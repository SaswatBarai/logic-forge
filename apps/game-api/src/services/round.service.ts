import type { Server as SocketServer } from "socket.io";
import { logger } from "../app";
import {
    BlitzSessionConfig,
    BlitzCategory,
    LiveCategory,
    LIVE_CATEGORY_POOL,
    TOTAL_ROUNDS,
} from "@logicforge/types";
import type { SessionService } from "./session.service";

const QUESTION_ENGINE_URL = process.env.QUESTION_ENGINE_URL || "http://localhost:3002";
const CODE_RUNNER_URL     = process.env.CODE_RUNNER_URL     || "http://localhost:3004";

const CATEGORY_TO_QE: Record<BlitzCategory, string> = {
    "MISSING_LINK": "THE_MISSING_LINK",
    "BOTTLENECK":   "THE_BOTTLENECK_BREAKER",
    "TRACING":      "STATE_TRACING",
    "SYNTAX_ERROR": "SYNTAX_ERROR_DETECTION",
};

const ARCADE_LANGUAGES = ["PYTHON", "JAVA", "CPP"] as const;
type ArcadeLanguage = typeof ARCADE_LANGUAGES[number];

function pickLanguage(): ArcadeLanguage {
    return ARCADE_LANGUAGES[Math.floor(Math.random() * ARCADE_LANGUAGES.length)];
}

export interface RoundState {
    sessionId: string;
    currentRound: number;
    livesRemaining: number;
    categoryHistory: BlitzCategory[];
    usedChallengeIds: string[];
    isTerminated: boolean;
    terminationCause?: "LIVES_EXHAUSTED" | "COMPLETED";
    submittedUserIds: Set<string>;
}

interface ChallengeApiResponse {
    id: string;
    title: string;
    description: string;
    codeTemplate: string;
    hints: unknown;
    timeLimitMs: number;
    category: string;
    language: string;
    difficulty: string;
    solution?: { type?: string; answers?: string[]; correct?: string };
    testCases?: Array<{ input: string; expectedOutput: string }>;
    mcqOptions?: Record<string, string> | null;
}

export interface RoundChallenge {
    id: string;
    title: string;
    description: string;
    codeTemplate: string;
    hints: unknown;
    timeLimitMs: number | null;
    category: string;
    language?: string;
    mcqOptions?: Record<string, string> | null;
}

export interface EvaluateAnswerResult {
    userId: string;
    challengeId: string;
    passed: boolean;
    points: number;
    verdict: string;
    executionTimeMs: number;
    livesRemaining?: number;
    roundState: {
        currentRound: number;
        isTerminated: boolean;
        terminationCause?: string;
    };
    players: Array<{ userId: string; score: number; roundScores: number[]; livesRemaining: number }>;
}

export interface PrepareNextRoundPayload {
    roundNumber: number;
    totalRounds: number;
    challenge: RoundChallenge;
    players: Array<{ userId: string; score: number; roundScores: number[]; livesRemaining: number }>;
}

const roundStates       = new Map<string, RoundState>();
const roundTimers       = new Map<string, ReturnType<typeof setInterval>>();
// ✅ NEW: tracks the LIVE mode advance timeout per session
const liveAdvanceTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ── Answer normalization ──────────────────────────────────────────────────────

const DIRECT_MATCH_CATEGORIES = new Set([
    "THE_MISSING_LINK",
    "SYNTAX_ERROR_DETECTION",
    "THE_BOTTLENECK_BREAKER",
]);

function normalizeAnswer(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, "");
}

function evaluateDirectMatch(answer: string, solutionAnswers: string[]): "CORRECT" | "INCORRECT" {
    const normalized = normalizeAnswer(answer);
    return solutionAnswers.map(normalizeAnswer).includes(normalized)
        ? "CORRECT" : "INCORRECT";
}

// ── Code wrapping helpers ─────────────────────────────────────────────────────

function extractPythonFunctionName(template: string): string {
    const match = template.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : "solve";
}

function buildPythonExecutable(template: string, answer: string): string {
    const filled = template.replace("________", answer.trim());
    const fnName = extractPythonFunctionName(filled);
    return `
import sys, ast
${filled}
input_data = sys.stdin.read().strip()
try:
    args = [ast.literal_eval(x.strip()) for x in input_data.split(",", 1) if x.strip()]
except Exception:
    args = [ast.literal_eval(input_data)]
print(${fnName}(*args))
`.trim();
}

function buildJavaExecutable(template: string, answer: string): string {
    const filled = template.replace("________", answer.trim());
    return `
import java.util.*;
import java.util.stream.*;
public class Main {
    ${filled}
    public static void main(String[] args) { System.out.println("OK"); }
}`.trim();
}

function buildCppExecutable(template: string, answer: string): string {
    const filled = template.replace("________", answer.trim());
    return `
#include <bits/stdc++.h>
using namespace std;
${filled}
int main() { cout << "OK" << endl; return 0; }`.trim();
}

function buildExecutableCode(language: string, template: string, answer: string): string {
    const lang = language.toUpperCase();
    if (lang === "PYTHON") return buildPythonExecutable(template, answer);
    if (lang === "JAVA")   return buildJavaExecutable(template, answer);
    if (lang === "CPP")    return buildCppExecutable(template, answer);
    return template.replace("________", answer.trim());
}

// ─────────────────────────────────────────────────────────────────────────────

export class RoundService {

    constructor(private readonly sessionService: SessionService) { }

    initSession(sessionId: string, config: BlitzSessionConfig): RoundState {
        const state: RoundState = {
            sessionId,
            currentRound: 1,
            livesRemaining: config.livesEnabled ? config.lives : (Infinity as any),
            categoryHistory: [],
            usedChallengeIds: [],
            isTerminated: false,
            submittedUserIds: new Set<string>(),
        };
        roundStates.set(sessionId, state);
        logger.info({ sessionId }, "Round state initialized");
        return state;
    }

    getState(sessionId: string): RoundState {
        const state = roundStates.get(sessionId);
        if (!state) throw new Error(`No round state for session: ${sessionId}`);
        return state;
    }

    async fetchChallenge(sessionId: string, config: BlitzSessionConfig): Promise<RoundChallenge> {
        const state = this.getState(sessionId);
        const category = this.resolveCategory(state, config);

        const qeCategory = CATEGORY_TO_QE[category];
        const isTracing  = qeCategory === "STATE_TRACING";
        const language   = pickLanguage();

        const url = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
        url.searchParams.set("category", qeCategory);
        if (!isTracing) url.searchParams.set("language", language);
        if (state.usedChallengeIds.length > 0) {
            for (const id of state.usedChallengeIds) {
                url.searchParams.append("excludeIds", id);
            }
        }

        let res = await fetch(url.toString());

        if (!res.ok && state.usedChallengeIds.length > 0) {
            logger.warn({ sessionId, category }, "No unused challenges — retrying without excludeIds");
            const fallbackUrl = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
            fallbackUrl.searchParams.set("category", qeCategory);
            if (!isTracing) fallbackUrl.searchParams.set("language", language);
            res = await fetch(fallbackUrl.toString());
        }

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Question engine error ${res.status}: ${text}`);
        }

        const body = await res.json() as { success: boolean; data: ChallengeApiResponse };
        const data = body.data ?? (body as any);

        state.categoryHistory.push(category);
        state.usedChallengeIds.push(data.id);

        logger.info(
            { sessionId, round: state.currentRound, category, language, challengeId: data.id },
            "Challenge fetched"
        );

        return {
            id: data.id,
            title: data.title,
            description: data.description,
            codeTemplate: data.codeTemplate,
            hints: data.hints ?? null,
            timeLimitMs: this.resolveTimeLimit(config.sessionType, state.currentRound),
            category: data.category,
            language: data.language,
            mcqOptions: data.mcqOptions ?? null,
        };
    }

    recordResult(sessionId: string, config: BlitzSessionConfig, passed: boolean): RoundState {
        const state = this.getState(sessionId);

        if (state.currentRound >= config.totalRounds) {
            state.isTerminated = true;
            state.terminationCause = "COMPLETED";
            return state;
        }

        state.currentRound++;
        return state;
    }

    async evaluateAnswer(args: {
        sessionId: string;
        userId: string;
        challengeId: string;
        answer: string;
    }): Promise<EvaluateAnswerResult> {
        const { sessionId, userId, challengeId, answer } = args;
        logger.info({ answer, challengeId }, "RAW ANSWER RECEIVED");

        const session = await this.sessionService.getSession(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);
        const config = session.config;

        let verdict         = "INCORRECT";
        let executionTimeMs = 0;

        const isAutoSubmit = !answer || answer.trim().length === 0;

        if (!isAutoSubmit) {
            try {
                const challengeRes = await fetch(`${QUESTION_ENGINE_URL}/api/v1/challenges/${challengeId}`);
                if (!challengeRes.ok) throw new Error(`QE returned ${challengeRes.status}`);

                const challengeBody = await challengeRes.json() as { success: boolean; data: ChallengeApiResponse };
                const challenge = challengeBody.data;

                if (challenge.category === "STATE_TRACING") {
                    const expected = challenge.testCases?.[0]?.expectedOutput ?? "";
                    verdict = normalizeAnswer(answer) === normalizeAnswer(expected)
                        ? "CORRECT" : "INCORRECT";
                    logger.info({ sessionId, challengeId, verdict }, "STATE_TRACING evaluated");

                } else if (challenge.category === "THE_BOTTLENECK_BREAKER") {
                    const sol = challenge.solution as any;
                    if (sol?.type === "MCQ") {
                        const correct    = (sol.correct as string ?? "").trim().toUpperCase();
                        const submitted  = answer.trim().toUpperCase();
                        verdict = submitted === correct ? "CORRECT" : "INCORRECT";
                        logger.info({ sessionId, challengeId, submitted, correct, verdict }, "BOTTLENECK MCQ evaluated");
                    } else {
                        const solutionAnswers = sol?.answers ?? [];
                        verdict = evaluateDirectMatch(answer, solutionAnswers);
                    }

                } else if (DIRECT_MATCH_CATEGORIES.has(challenge.category)) {
                    const solutionAnswers = (challenge.solution as any)?.answers ?? [];
                    verdict = solutionAnswers.length > 0
                        ? evaluateDirectMatch(answer, solutionAnswers)
                        : "INCORRECT";
                    logger.info({ sessionId, challengeId, category: challenge.category, verdict }, "Direct-match evaluation");
                }
            } catch (err) {
                logger.error({ err, sessionId, challengeId }, "Evaluation failed");
                verdict = "RUNTIME_ERROR";
            }
        }

        const passed = verdict === "CORRECT";
        const points = verdict === "CORRECT" ? 100 : verdict === "PARTIAL" ? 50 : 0;

        logger.info({ sessionId, userId, challengeId, verdict, points, executionTimeMs }, "Answer evaluated");

        const state = this.recordResult(sessionId, config, passed);
        await this.sessionService.recordRoundScore(sessionId, userId, points);
        if (!passed && config.livesEnabled) {
            await this.sessionService.deductLife(sessionId, userId);
            const afterDeduct = await this.sessionService.getSession(sessionId);
            if (afterDeduct) {
                const afterSerialized = await this.sessionService.serialize(afterDeduct);
                const afterPlayer = afterSerialized.players.find((p) => p.userId === userId);
                if (afterPlayer && afterPlayer.livesRemaining <= 0) {
                    state.isTerminated = true;
                    state.terminationCause = "LIVES_EXHAUSTED";
                    logger.warn({ sessionId, userId, livesRemaining: afterPlayer.livesRemaining }, "Lives exhausted — terminating session");
                }
            }
        }

        const updatedSession = await this.sessionService.getSession(sessionId);
        if (!updatedSession) throw new Error(`Session not found: ${sessionId}`);
        const serialized = await this.sessionService.serialize(updatedSession);
        const player = serialized.players.find((p) => p.userId === userId);

        return {
            userId,
            challengeId,
            passed,
            points,
            verdict,
            executionTimeMs,
            livesRemaining: config.livesEnabled ? player?.livesRemaining : undefined,
            roundState: {
                currentRound: state.currentRound,
                isTerminated: state.isTerminated,
                terminationCause: state.terminationCause,
            },
            players: serialized.players,
        };
    }

    async prepareNextRound(sessionId: string): Promise<PrepareNextRoundPayload> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);
        const config = session.config;

        let state = roundStates.get(sessionId);
        if (!state) state = this.initSession(sessionId, config);

        state.submittedUserIds = new Set<string>();

        const challenge  = await this.fetchChallenge(sessionId, config);
        const serialized = await this.sessionService.serialize(session);

        return {
            roundNumber: state.currentRound,
            totalRounds: config.totalRounds,
            challenge,
            players: serialized.players,
        };
    }

    async startRound(io: SocketServer, sessionId: string, roundNumber: number): Promise<void> {
        this.clearRoundTimer(sessionId);
        const payload = await this.prepareNextRound(sessionId);
        io.to(sessionId).emit("ROUND_START", payload);
        await this.sessionService.updateSession(sessionId, { currentRound: roundNumber, status: "ACTIVE" });
        logger.info({ sessionId, roundNumber }, "ROUND_START emitted");

        if (payload.challenge.timeLimitMs != null) {
            this.startRoundTimer(io, sessionId, roundNumber, payload.challenge.timeLimitMs);
        }
    }

    private startRoundTimer(io: SocketServer, sessionId: string, roundNumber: number, timeLimitMs: number): void {
        const endAt = Date.now() + timeLimitMs;
        logger.info({ sessionId, roundNumber, timeLimitMs }, "Round timer started");

        const handle = setInterval(async () => {
            const remainingMs = Math.max(0, endAt - Date.now());
            io.to(sessionId).emit("TIMER_SYNC", { roundNumber, remainingMs, serverTimestamp: Date.now() });

            if (remainingMs <= 0) {
                this.clearRoundTimer(sessionId);
                logger.info({ sessionId, roundNumber }, "Round timer expired — auto-submitting");
                await this.handleTimerExpiry(io, sessionId, roundNumber);
            }
        }, 1_000);

        roundTimers.set(sessionId, handle);
    }

    private async handleTimerExpiry(io: SocketServer, sessionId: string, roundNumber: number): Promise<void> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) return;

        const state = roundStates.get(sessionId);
        if (!state) return;

        const pending = session.players.filter((uid) => !state.submittedUserIds.has(uid));
        if (pending.length === 0) {
            logger.info({ sessionId, roundNumber }, "Timer expired but all players already submitted");
            return;
        }

        io.to(sessionId).emit("TIMER_EXPIRED", { roundNumber });

        const challengeId =
            state.usedChallengeIds[roundNumber - 1] ??
            state.usedChallengeIds[state.usedChallengeIds.length - 1];

        for (const userId of pending) {
            try {
                state.submittedUserIds.add(userId);
                const result = await this.evaluateAnswer({ sessionId, userId, challengeId, answer: "" });
                io.to(sessionId).emit("ROUND_RESULT", result);
                logger.info({ sessionId, userId, roundNumber }, "Auto-submitted (timer expired)");

                const isLastPending = userId === pending[pending.length - 1];
                if (isLastPending) {
                    if (result.roundState.isTerminated) {
                        io.to(sessionId).emit("SESSION_END", {
                            cause: result.roundState.terminationCause ?? "COMPLETED",
                            finalState: { players: result.players },
                        });
                        this.cleanup(sessionId);
                    } else {
                        setTimeout(async () => {
                            try {
                                const liveState = this.getState(sessionId);
                                await this.startRound(io, sessionId, liveState.currentRound);
                            } catch (err) {
                                logger.error({ err, sessionId }, "Error starting next round after timer expiry");
                            }
                        }, 3500);
                    }
                }
            } catch (err) {
                logger.error({ err, sessionId, userId }, "Error auto-submitting on timer expiry");
            }
        }
    }

    private clearRoundTimer(sessionId: string): void {
        const handle = roundTimers.get(sessionId);
        if (handle) {
            clearInterval(handle);
            roundTimers.delete(sessionId);
            logger.info({ sessionId }, "Round timer cleared");
        }
    }

    // ✅ NEW: LIVE mode advance timer — fires if second player never submits
    // Zero effect on TIMER mode (the else-if guard in handleSubmission blocks it)
    private scheduleLiveAdvance(
        io: SocketServer,
        sessionId: string,
        roundNumber: number,
        delayMs = 15_000
    ): void {
        const existing = liveAdvanceTimers.get(sessionId);
        if (existing) {
            clearTimeout(existing);
            liveAdvanceTimers.delete(sessionId);
        }

        const handle = setTimeout(async () => {
            liveAdvanceTimers.delete(sessionId);

            const state = roundStates.get(sessionId);
            if (!state) return;

            const session = await this.sessionService.getSession(sessionId);
            if (!session) return;

            const pending = session.players.filter(
                (uid) => !state.submittedUserIds.has(uid)
            );
            if (pending.length === 0) return;

            logger.info(
                { sessionId, roundNumber, pending },
                "LIVE advance timer fired — auto-submitting pending players"
            );

            const challengeId =
                state.usedChallengeIds[roundNumber - 1] ??
                state.usedChallengeIds[state.usedChallengeIds.length - 1];

            for (const userId of pending) {
                try {
                    state.submittedUserIds.add(userId);
                    const result = await this.evaluateAnswer({
                        sessionId,
                        userId,
                        challengeId,
                        answer: "",
                    });
                    io.to(sessionId).emit("ROUND_RESULT", result);

                    const isLast = userId === pending[pending.length - 1];
                    if (isLast) {
                        if (result.roundState.isTerminated) {
                            io.to(sessionId).emit("SESSION_END", {
                                cause: result.roundState.terminationCause ?? "COMPLETED",
                                finalState: { players: result.players },
                            });
                            this.cleanup(sessionId);
                        } else {
                            setTimeout(async () => {
                                try {
                                    const liveState = this.getState(sessionId);
                                    await this.startRound(io, sessionId, liveState.currentRound);
                                } catch (err) {
                                    logger.error({ err, sessionId }, "Error starting next round after live advance");
                                }
                            }, 3500);
                        }
                    }
                } catch (err) {
                    logger.error({ err, sessionId, userId }, "Error auto-submitting in live advance");
                }
            }
        }, delayMs);

        liveAdvanceTimers.set(sessionId, handle);
    }

    async handleSubmission(
        io: SocketServer,
        sessionId: string,
        userId: string,
        answer: string,
        roundNumber: number
    ): Promise<void> {
        const state = this.getState(sessionId);

        if (state.submittedUserIds.has(userId)) {
            logger.warn({ sessionId, userId, roundNumber }, "Duplicate SUBMIT_ANSWER ignored");
            return;
        }
        state.submittedUserIds.add(userId);

        const challengeId =
            state.usedChallengeIds[roundNumber - 1] ??
            state.usedChallengeIds[state.usedChallengeIds.length - 1];

        const result = await this.evaluateAnswer({ sessionId, userId, challengeId, answer });
        io.to(sessionId).emit("ROUND_RESULT", result);

        const session     = await this.sessionService.getSession(sessionId);
        const totalPlayers = session?.players.length ?? 1;
        const allSubmitted = state.submittedUserIds.size >= totalPlayers;

        if (allSubmitted) {
            // ✅ Cancel live advance timer — everyone submitted normally
            const existing = liveAdvanceTimers.get(sessionId);
            if (existing) {
                clearTimeout(existing);
                liveAdvanceTimers.delete(sessionId);
            }

            this.clearRoundTimer(sessionId);

            if (result.roundState.isTerminated) {
                io.to(sessionId).emit("SESSION_END", {
                    cause: result.roundState.terminationCause ?? "COMPLETED",
                    finalState: { players: result.players },
                });
                this.cleanup(sessionId);
                logger.info({ sessionId }, "Session ended");
            } else {
                setTimeout(async () => {
                    try {
                        const liveState = this.getState(sessionId);
                        await this.startRound(io, sessionId, liveState.currentRound);
                    } catch (err) {
                        logger.error({ err, sessionId }, "Error starting next round");
                    }
                }, 3500);
            }
        } else if (totalPlayers > 1 && !roundTimers.has(sessionId)) {
            // ✅ LIVE mode only: first player submitted, arm the advance timer
            // Guard: totalPlayers > 1 (not single player) AND no TIMER mode timer running
            this.scheduleLiveAdvance(io, sessionId, roundNumber);
            logger.info({ sessionId, roundNumber }, "LIVE advance timer scheduled (15s)");
        }
    }

    cleanup(sessionId: string): void {
        this.clearRoundTimer(sessionId);

        // ✅ Also clear live advance timer on cleanup
        const liveHandle = liveAdvanceTimers.get(sessionId);
        if (liveHandle) {
            clearTimeout(liveHandle);
            liveAdvanceTimers.delete(sessionId);
        }

        roundStates.delete(sessionId);
    }

    private resolveCategory(state: RoundState, config: BlitzSessionConfig): BlitzCategory {
        if (config.sessionType === "TIMER") return config.category!;
        const pool = [...LIVE_CATEGORY_POOL] as LiveCategory[];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    private resolveTimeLimit(sessionType: BlitzSessionConfig["sessionType"], round: number): number | null {
        if (sessionType === "TIMER") return Math.max(20_000, 60_000 - (round - 1) * 5_000);
        return null;
    }
}
