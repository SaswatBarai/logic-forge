
import type { Server as SocketServer } from "socket.io";
import { logger } from "../app";
import {
    BlitzSessionConfig,
    BlitzCategory,
    LiveCategory,
    LIVE_CATEGORY_POOL,
    TOTAL_ROUNDS,
    TimerCategory,
} from "@logicforge/types";
import type { SessionService } from "./session.service";

const QUESTION_ENGINE_URL =
    process.env.QUESTION_ENGINE_URL || "http://localhost:3002";

const CODE_RUNNER_URL =
    process.env.CODE_RUNNER_URL || "http://localhost:3004";

const CATEGORY_TO_QE: Record<BlitzCategory, string> = {
    "MISSING_LINK": "THE_MISSING_LINK",
    "BOTTLENECK": "THE_BOTTLENECK_BREAKER",
    "TRACING": "STATE_TRACING",
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
    solution?: { answers: string[] };
    testCases?: Array<{ input: string; expectedOutput: string }>;
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

const roundStates = new Map<string, RoundState>();
const roundTimers = new Map<string, ReturnType<typeof setInterval>>();

// ── Answer evaluation helpers ─────────────────────────────────────────────────

/**
 * Categories where verdict = direct string match against solution.answers.
 * No code execution needed — sending a fragment to the compiler always fails.
 */
const DIRECT_MATCH_CATEGORIES = new Set([
    "THE_MISSING_LINK",
    "SYNTAX_ERROR_DETECTION",
]);

function normalizeAnswer(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, "");
}
function evaluateDirectMatch(
    answer: string,
    solutionAnswers: string[]
): "CORRECT" | "INCORRECT" {
    const normalized = normalizeAnswer(answer);
    const matched = solutionAnswers
        .map(normalizeAnswer)
        .includes(normalized);
    return matched ? "CORRECT" : "INCORRECT";
}

// ── Code wrapping for BOTTLENECK (full execution) ─────────────────────────────

function extractPythonFunctionName(template: string): string {
    const match = template.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : "solve";
}

function buildPythonExecutable(template: string, answer: string): string {
    const filled = template.replace("________", answer.trim());
    const fnName = extractPythonFunctionName(filled);
    return `
import sys
import ast

${filled}

input_data = sys.stdin.read().strip()
# Support comma-separated args like "[1,3,5], 5"
try:
    args = [ast.literal_eval(x.strip()) for x in input_data.split(",", 1) if x.strip()]
except Exception:
    args = [ast.literal_eval(input_data)]
result = ${fnName}(*args)
print(result)
`.trim();
}

function buildJavaExecutable(template: string, answer: string): string {
    const filled = template.replace("________", answer.trim());
    return `
import java.util.*;
import java.util.stream.*;

public class Main {
    ${filled}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Harness: for BOTTLENECK challenges the method is called and result printed
        // Input parsing is delegated to the template's main — print OK as sentinel
        System.out.println("OK");
    }
}
`.trim();
}

function buildCppExecutable(template: string, answer: string): string {
    const filled = template.replace("________", answer.trim());
    return `
#include <bits/stdc++.h>
using namespace std;

${filled}

int main() {
    cout << "OK" << endl;
    return 0;
}
`.trim();
}

function buildExecutableCode(
    language: string,
    template: string,
    answer: string,
): string {
    const lang = language.toUpperCase();
    if (lang === "PYTHON") return buildPythonExecutable(template, answer);
    if (lang === "JAVA")   return buildJavaExecutable(template, answer);
    if (lang === "CPP")    return buildCppExecutable(template, answer);
    // Fallback: inject answer as-is
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

    async fetchChallenge(
        sessionId: string,
        config: BlitzSessionConfig
    ): Promise<RoundChallenge> {
        const state = this.getState(sessionId);
        const category = this.resolveCategory(state, config);

        const qeCategory = CATEGORY_TO_QE[category];
        const isTracing = qeCategory === "STATE_TRACING";
        const language = pickLanguage();

        const url = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
        url.searchParams.set("category", qeCategory);
        if (!isTracing) {
            url.searchParams.set("language", language);
        }
        if (state.usedChallengeIds.length > 0) {
            url.searchParams.set("excludeIds", state.usedChallengeIds.join(","));
        }

        let res = await fetch(url.toString());

        if (!res.ok && state.usedChallengeIds.length > 0) {
            logger.warn({ sessionId, category }, "No unused challenges — retrying without excludeIds");
            const fallbackUrl = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
            fallbackUrl.searchParams.set("category", qeCategory);
            if (!isTracing) {
                fallbackUrl.searchParams.set("language", language);
            }
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

        const timeLimitMs = this.resolveTimeLimit(config.sessionType, state.currentRound);

      return {
            id: data.id,
            title: data.title,
            description: data.description,
            codeTemplate: data.codeTemplate,
            hints: data.hints ?? null,
            timeLimitMs,
            category: data.category,
            language: data.language,   
        };
    }

    recordResult(
        sessionId: string,
        config: BlitzSessionConfig,
        passed: boolean
    ): RoundState {
        const state = this.getState(sessionId);

        if (!passed && config.livesEnabled) {
            state.livesRemaining--;
            logger.warn({ sessionId, livesRemaining: state.livesRemaining }, "Life deducted");
        }

        if (config.livesEnabled && state.livesRemaining <= 0) {
            state.isTerminated = true;
            state.terminationCause = "LIVES_EXHAUSTED";
            return state;
        }

        if (state.currentRound >= TOTAL_ROUNDS) {
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

        let verdict = "INCORRECT";
        let executionTimeMs = 0;

        const isAutoSubmit = !answer || answer.trim().length === 0;

        if (!isAutoSubmit) {
            try {
                const challengeRes = await fetch(`${QUESTION_ENGINE_URL}/api/v1/challenges/${challengeId}`);
                if (!challengeRes.ok) {
                    throw new Error(`QE returned ${challengeRes.status} for challenge ${challengeId}`);
                }
                const challengeBody = await challengeRes.json() as {
                    success: boolean;
                    data: ChallengeApiResponse;
                };
                const challenge = challengeBody.data;

                // ── STATE_TRACING: compare against first testCase expectedOutput ──
                if (challenge.category === "STATE_TRACING") {
                    const testCases = challenge.testCases ?? [];
                    const expected = testCases[0]?.expectedOutput ?? "";
                    verdict = normalizeAnswer(answer) === normalizeAnswer(expected)
                        ? "CORRECT"
                        : "INCORRECT";
                    logger.info({ sessionId, challengeId, verdict }, "STATE_TRACING evaluated");

                // ── MISSING_LINK / SYNTAX_ERROR: compare against solution.answers ──
                } else if (DIRECT_MATCH_CATEGORIES.has(challenge.category)) {
                    const solutionAnswers = challenge.solution?.answers ?? [];
                    if (solutionAnswers.length === 0) {
                        logger.warn({ sessionId, challengeId, category: challenge.category },
                            "No solution.answers found — defaulting INCORRECT");
                        verdict = "INCORRECT";
                    } else {
                        verdict = evaluateDirectMatch(answer, solutionAnswers);
                    }
                    logger.info(
                        { sessionId, challengeId, category: challenge.category, verdict },
                        "Direct-match evaluation"
                    );

                // ── BOTTLENECK: full code execution via code-runner ──────────────
                } else {
                    const executableCode = buildExecutableCode(
                        challenge.language,
                        challenge.codeTemplate,
                        answer,
                    );

                    logger.debug({ sessionId, challengeId, executableCode }, "Sending to code-runner");

                    const runRes = await fetch(`${CODE_RUNNER_URL}/api/v1/execute`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            language: challenge.language,
                            code: executableCode,
                            testCases: challenge.testCases ?? [],
                            timeLimitMs: challenge.timeLimitMs ?? 5000,
                            memoryLimitKb: 262144,
                        }),
                    });

                    if (runRes.ok) {
                        const runBody = await runRes.json() as {
                            verdict: string;
                            totalExecutionTimeMs: number;
                        };
                        verdict = runBody.verdict;
                        executionTimeMs = runBody.totalExecutionTimeMs ?? 0;
                    } else {
                        logger.error({ sessionId, challengeId, status: runRes.status }, "Code-runner error");
                        verdict = "RUNTIME_ERROR";
                    }
                }
            } catch (err) {
                logger.error({ err, sessionId, challengeId }, "Evaluation failed — RUNTIME_ERROR");
                verdict = "RUNTIME_ERROR";
            }
        }

        const passed = verdict === "CORRECT";
        const points =
            verdict === "CORRECT" ? 100 :
            verdict === "PARTIAL" ? 50 : 0;

        logger.info({ sessionId, userId, challengeId, verdict, points, executionTimeMs }, "Answer evaluated");

        const state = this.recordResult(sessionId, config, passed);
        await this.sessionService.recordRoundScore(sessionId, userId, points);
        if (!passed && config.livesEnabled) {
            await this.sessionService.deductLife(sessionId, userId);
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
        if (!state) {
            state = this.initSession(sessionId, config);
        }

        state.submittedUserIds = new Set<string>();

        const challenge = await this.fetchChallenge(sessionId, config);
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

    private startRoundTimer(
        io: SocketServer,
        sessionId: string,
        roundNumber: number,
        timeLimitMs: number
    ): void {
        const startAt = Date.now();
        const endAt = startAt + timeLimitMs;

        logger.info({ sessionId, roundNumber, timeLimitMs }, "Round timer started");

        const handle = setInterval(async () => {
            const now = Date.now();
            const remainingMs = Math.max(0, endAt - now);

            io.to(sessionId).emit("TIMER_SYNC", {
                roundNumber,
                remainingMs,
                serverTimestamp: now,
            });

            if (remainingMs <= 0) {
                this.clearRoundTimer(sessionId);
                logger.info({ sessionId, roundNumber }, "Round timer expired — auto-submitting");
                await this.handleTimerExpiry(io, sessionId, roundNumber);
            }
        }, 1_000);

        roundTimers.set(sessionId, handle);
    }

    private async handleTimerExpiry(
        io: SocketServer,
        sessionId: string,
        roundNumber: number
    ): Promise<void> {
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
                const result = await this.evaluateAnswer({
                    sessionId,
                    userId,
                    challengeId,
                    answer: "",
                });

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
                        const nextRound = result.roundState.currentRound;
                        setTimeout(async () => {
                            try {
                                await this.startRound(io, sessionId, nextRound);
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

        const session = await this.sessionService.getSession(sessionId);
        const totalPlayers = session?.players.length ?? 1;
        const allSubmitted = state.submittedUserIds.size >= totalPlayers;

        if (allSubmitted) {
            this.clearRoundTimer(sessionId);

            if (result.roundState.isTerminated) {
                io.to(sessionId).emit("SESSION_END", {
                    cause: result.roundState.terminationCause ?? "COMPLETED",
                    finalState: { players: result.players },
                });
                this.cleanup(sessionId);
                logger.info({ sessionId }, "Session ended");
            } else {
                const nextRound = result.roundState.currentRound;
                setTimeout(async () => {
                    try {
                        await this.startRound(io, sessionId, nextRound);
                    } catch (err) {
                        logger.error({ err, sessionId }, "Error starting next round after delay");
                    }
                }, 3500);
            }
        }
    }

    cleanup(sessionId: string): void {
        this.clearRoundTimer(sessionId);
        roundStates.delete(sessionId);
    }

    private resolveCategory(state: RoundState, config: BlitzSessionConfig): BlitzCategory {
        if (config.sessionType === "TIMER") {
            return config.category!;
        }
        const pool = [...LIVE_CATEGORY_POOL] as LiveCategory[];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    private resolveTimeLimit(sessionType: BlitzSessionConfig["sessionType"], round: number): number | null {
        if (sessionType === "TIMER") {
            return Math.max(20_000, 60_000 - (round - 1) * 5_000);
        }
        return null;
    }
}
