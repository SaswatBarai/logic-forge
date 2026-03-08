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
import { commitMatchResult } from "./match-record.service.js";
import { db } from "@logicforge/db";

const QUESTION_ENGINE_URL = process.env.QUESTION_ENGINE_URL || "http://localhost:3002";
const CODE_RUNNER_URL = process.env.CODE_RUNNER_URL || "http://localhost:3004";
const SURVIVAL_BONUS_MS = 30_000;

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
    /**
     * Guards against the dual-player race condition where two concurrent
     * handleSubmission calls both see allSubmitted=true and both call
     * recordResult(), double-incrementing currentRound.
     *
     * Set to the round number the moment completion handling starts.
     * Any later concurrent path that sees the same roundNumber short-circuits.
     */
    lastCompletedRound: number;
    /** Wall-clock ms when the session started — used to compute real timeTakenMs */
    sessionStartedAt: number;
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

const roundStates = new Map<string, RoundState>();
const roundTimers = new Map<string, ReturnType<typeof setInterval>>();
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
    if (lang === "JAVA") return buildJavaExecutable(template, answer);
    if (lang === "CPP") return buildCppExecutable(template, answer);
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
            lastCompletedRound: 0,
            sessionStartedAt: Date.now(),  // ← track real start time for speed bonus
        };
        roundStates.set(sessionId, state);
        logger.info({ sessionId }, "[ROUND_STATE] Initialized");
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
        const isTracing = qeCategory === "STATE_TRACING";
        const language = pickLanguage();

        logger.info(
            { sessionId, round: state.currentRound, usedChallengeCount: state.usedChallengeIds.length, usedIds: state.usedChallengeIds },
            "fetchChallenge: starting fetch"
        );

        const url = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
        url.searchParams.set("category", qeCategory);
        if (!isTracing) url.searchParams.set("language", language);
        if (state.usedChallengeIds.length > 0) {
            for (const id of state.usedChallengeIds) {
                url.searchParams.append("excludeIds", id);
            }
        }

        logger.info(
            { sessionId, round: state.currentRound, url: url.toString() },
            "fetchChallenge: request URL"
        );

        let res = await fetch(url.toString());

        // Second try: drop language, keep excludeIds (avoid repeating challenges)
        if (!res.ok && !isTracing) {
            logger.warn({ sessionId, category, language }, "No challenges for category+language — retrying without language, keeping excludeIds");
            const noLangUrl = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
            noLangUrl.searchParams.set("category", qeCategory);
            if (state.usedChallengeIds.length > 0) {
                for (const id of state.usedChallengeIds) {
                    noLangUrl.searchParams.append("excludeIds", id);
                }
            }
            res = await fetch(noLangUrl.toString());
        }

        // Third try: category only (last resort — may repeat)
        if (!res.ok) {
            logger.warn({ sessionId, category }, "No unused challenges in category — retrying without excludeIds");
            const fallbackUrl = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
            fallbackUrl.searchParams.set("category", qeCategory);
            res = await fetch(fallbackUrl.toString());
        }

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Question engine error ${res.status}: ${text}`);
        }

        const body = await res.json() as { success: boolean; data: ChallengeApiResponse };
        const data = body.data ?? (body as any);

        state.categoryHistory.push(category);
        if (!state.usedChallengeIds.includes(data.id)) {
            state.usedChallengeIds.push(data.id);
        }

        logger.info(
            { sessionId, round: state.currentRound, category, language, challengeId: data.id, totalUsedCount: state.usedChallengeIds.length },
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

        logger.info(
            { sessionId, currentRound: state.currentRound, totalRounds: config.totalRounds },
            "recordResult: checking if session should terminate"
        );

        if (state.currentRound >= config.totalRounds) {
            state.isTerminated = true;
            state.terminationCause = "COMPLETED";
            logger.info(
                { sessionId, currentRound: state.currentRound, totalRounds: config.totalRounds },
                "recordResult: session terminated (all rounds completed)"
            );
            return state;
        }

        state.currentRound++;
        logger.info(
            { sessionId, newRound: state.currentRound, totalRounds: config.totalRounds },
            "recordResult: advancing to next round"
        );
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
                        const correct = (sol.correct as string ?? "").trim().toUpperCase();
                        const submitted = answer.trim().toUpperCase();
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

        logger.info({ sessionId, userId, challengeId, verdict, points }, "[ANSWER_RECEIVED] evaluated");

        // ─────────────────────────────────────────────────────────────────────
        // IMPORTANT: recordResult() (which increments currentRound) is NOT
        // called here.  It is called ONCE in handleSubmission / handleTimerExpiry
        // AFTER the round-completion guard fires.  Calling it here caused a race
        // condition in dual-player mode where both concurrent evaluateAnswer()
        // calls saw isLastToSubmit=true and each incremented the round counter,
        // jumping two rounds ahead (e.g. round 2 → round 4).
        // ─────────────────────────────────────────────────────────────────────
        const state = this.getState(sessionId);

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
                    logger.warn({ sessionId, userId, livesRemaining: afterPlayer.livesRemaining }, "[LIFE_LOST] Lives exhausted — will terminate session");
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
                // currentRound reflects the round that was just played (not yet incremented).
                // The client uses applyRoundStart to navigate rounds, so this value
                // is informational only.
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

        const challenge = await this.fetchChallenge(sessionId, config);
        const serialized = await this.sessionService.serialize(session);

        logger.info(
            { sessionId, roundNumber: state.currentRound, totalRounds: config.totalRounds, challengeId: challenge.id },
            "prepareNextRound: about to emit ROUND_START"
        );

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

        logger.info(
            { sessionId, roundNumber, payloadRoundNumber: payload.roundNumber, challengeId: payload.challenge.id },
            "startRound: about to emit ROUND_START"
        );

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

        // ── Round-completion guard ──────────────────────────────────────────
        // Prevents the timer path from running if handleSubmission already
        // completed this round (both players answered before timer fired).
        if (state.lastCompletedRound >= roundNumber) {
            logger.info({ sessionId, roundNumber }, "[TIMER_EXPIRED] Round already completed — timer expiry skipped");
            return;
        }

        const pending = session.players.filter((uid) => !state.submittedUserIds.has(uid));
        if (pending.length === 0) {
            logger.info({ sessionId, roundNumber }, "[TIMER_EXPIRED] All players already submitted — no auto-submit needed");
            return;
        }

        io.to(sessionId).emit("TIMER_EXPIRED", { roundNumber });
        logger.info({ sessionId, roundNumber, pendingCount: pending.length }, "[TIMER_EXPIRED] Auto-submitting pending players");

        const challengeId =
            state.usedChallengeIds[roundNumber - 1] ??
            state.usedChallengeIds[state.usedChallengeIds.length - 1];

        // Auto-submit all pending players
        for (const userId of pending) {
            try {
                state.submittedUserIds.add(userId);
                const result = await this.evaluateAnswer({ sessionId, userId, challengeId, answer: "" });
                await this.emitToPlayer(io, userId, "ROUND_RESULT", result);
                const opponents = session.players.filter((uid) => uid !== userId);
                for (const opponentId of opponents) {
                    await this.emitToPlayer(io, opponentId, "OPPONENT_TELEMETRY", {
                        fromUserId: userId,
                        wpm: 0,
                        codeLength: 0,
                        progress: 1,
                        submitted: true,
                        verdict: result.verdict,
                    });
                }
                logger.info({ sessionId, userId, roundNumber }, "[ANSWER_RECEIVED] Auto-submitted (timer expired)");
            } catch (err) {
                logger.error({ err, sessionId, userId }, "Error auto-submitting on timer expiry");
            }
        }

        // ── Round completion (guarded — fires exactly once) ─────────────────
        if (state.lastCompletedRound >= roundNumber) {
            logger.warn({ sessionId, roundNumber }, "[TIMER_EXPIRED] Completion guard hit after auto-submit loop");
            return;
        }
        state.lastCompletedRound = roundNumber;

        const livesTerminated = state.isTerminated && state.terminationCause === "LIVES_EXHAUSTED";
        if (livesTerminated) {
            const finalSession = await this.sessionService.getSession(sessionId);
            const finalSerialized = finalSession ? await this.sessionService.serialize(finalSession) : { players: [] };
            io.to(sessionId).emit("SESSION_END", {
                cause: "LIVES_EXHAUSTED",
                finalState: { players: finalSerialized.players },
            });
            await this.emitSurvivalOutcomes(io, sessionId, finalSerialized.players, "LIVES_EXHAUSTED");
            this.persistMatchResults(io, sessionId, finalSerialized.players, "LIVES_EXHAUSTED")
                .catch(err => logger.error({ err, sessionId }, "persistMatchResults failed"));
            this.cleanup(sessionId);
            return;
        }

        const advancedState = this.recordResult(sessionId, session.config, false);
        logger.info({ sessionId, roundNumber, nextRound: advancedState.currentRound, isTerminated: advancedState.isTerminated }, "[ROUND_COMPLETE] Timer expiry — round advanced");

        if (advancedState.isTerminated) {
            const finalSession = await this.sessionService.getSession(sessionId);
            const finalSerialized = finalSession ? await this.sessionService.serialize(finalSession) : { players: [] };
            io.to(sessionId).emit("SESSION_END", {
                cause: advancedState.terminationCause ?? "COMPLETED",
                finalState: { players: finalSerialized.players },
            });
            await this.emitSurvivalOutcomes(io, sessionId, finalSerialized.players, (advancedState.terminationCause ?? "COMPLETED") as "COMPLETED");
            this.persistMatchResults(io, sessionId, finalSerialized.players, advancedState.terminationCause ?? "COMPLETED")
                .catch(err => logger.error({ err, sessionId }, "persistMatchResults failed"));
            this.cleanup(sessionId);
        } else {
            logger.info({ sessionId, nextRound: advancedState.currentRound }, "[NEXT_ROUND] Scheduling after timer expiry");
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

    private clearRoundTimer(sessionId: string): void {
        const handle = roundTimers.get(sessionId);
        if (handle) {
            clearInterval(handle);
            roundTimers.delete(sessionId);
            logger.info({ sessionId }, "Round timer cleared");
        }
    }

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

            // ── Round-completion guard ─────────────────────────────────────
            if (state.lastCompletedRound >= roundNumber) {
                logger.info({ sessionId, roundNumber }, "[LIVE_ADVANCE] Round already completed — skipping");
                return;
            }

            const session = await this.sessionService.getSession(sessionId);
            if (!session) return;

            const pending = session.players.filter(
                (uid) => !state.submittedUserIds.has(uid)
            );
            if (pending.length === 0) return;

            logger.info(
                { sessionId, roundNumber, pending },
                "[LIVE_ADVANCE] Auto-submitting pending players after 15s"
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
                    await this.emitToPlayer(io, userId, "ROUND_RESULT", result);
                    const opponents = session.players.filter((uid) => uid !== userId);
                    for (const opponentId of opponents) {
                        await this.emitToPlayer(io, opponentId, "OPPONENT_TELEMETRY", {
                            fromUserId: userId,
                            wpm: 0,
                            codeLength: 0,
                            progress: 1,
                            submitted: true,
                            verdict: result.verdict,
                        });
                    }
                    logger.info({ sessionId, userId, roundNumber }, "[ANSWER_RECEIVED] Auto-submitted (live advance)");
                } catch (err) {
                    logger.error({ err, sessionId, userId }, "Error auto-submitting in live advance");
                }
            }

            // ── Round completion (guarded) ─────────────────────────────────
            if (state.lastCompletedRound >= roundNumber) {
                logger.warn({ sessionId, roundNumber }, "[LIVE_ADVANCE] Completion guard hit after auto-submit");
                return;
            }
            state.lastCompletedRound = roundNumber;

            const livesTerminated = state.isTerminated && state.terminationCause === "LIVES_EXHAUSTED";
            if (livesTerminated) {
                const finalSession = await this.sessionService.getSession(sessionId);
                const finalSerialized = finalSession ? await this.sessionService.serialize(finalSession) : { players: [] };
                io.to(sessionId).emit("SESSION_END", {
                    cause: "LIVES_EXHAUSTED",
                    finalState: { players: finalSerialized.players },
                });
                await this.emitSurvivalOutcomes(io, sessionId, finalSerialized.players, "LIVES_EXHAUSTED");
                this.cleanup(sessionId);
                return;
            }

            const advancedState = this.recordResult(sessionId, session.config, false);
            logger.info({ sessionId, roundNumber, nextRound: advancedState.currentRound, isTerminated: advancedState.isTerminated }, "[ROUND_COMPLETE] Live advance — round advanced");

            if (advancedState.isTerminated) {
                const finalSession = await this.sessionService.getSession(sessionId);
                const finalSerialized = finalSession ? await this.sessionService.serialize(finalSession) : { players: [] };
                io.to(sessionId).emit("SESSION_END", {
                    cause: advancedState.terminationCause ?? "COMPLETED",
                    finalState: { players: finalSerialized.players },
                });
                await this.emitSurvivalOutcomes(io, sessionId, finalSerialized.players, (advancedState.terminationCause ?? "COMPLETED") as "COMPLETED");
                this.persistMatchResults(io, sessionId, finalSerialized.players, advancedState.terminationCause ?? "COMPLETED")
                    .catch(err => logger.error({ err, sessionId }, "persistMatchResults failed"));
                this.cleanup(sessionId);
            } else {
                logger.info({ sessionId, nextRound: advancedState.currentRound }, "[NEXT_ROUND] Scheduling after live advance");
                setTimeout(async () => {
                    try {
                        const liveState = this.getState(sessionId);
                        await this.startRound(io, sessionId, liveState.currentRound);
                    } catch (err) {
                        logger.error({ err, sessionId }, "Error starting next round after live advance");
                    }
                }, 3500);
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

        // ── Duplicate-submit guard ────────────────────────────────────────────
        if (state.submittedUserIds.has(userId)) {
            logger.warn({ sessionId, userId, roundNumber }, "Duplicate SUBMIT_ANSWER ignored");
            return;
        }
        state.submittedUserIds.add(userId);

        const challengeId =
            state.usedChallengeIds[roundNumber - 1] ??
            state.usedChallengeIds[state.usedChallengeIds.length - 1];

        logger.info(
            { sessionId, userId, roundNumber, challengeId, submittedCount: state.submittedUserIds.size },
            "[ANSWER_RECEIVED] Processing submission"
        );

        // Evaluate answer — does NOT touch round state (no recordResult)
        const result = await this.evaluateAnswer({ sessionId, userId, challengeId, answer });
        await this.emitToPlayer(io, userId, "ROUND_RESULT", result);

        const session = await this.sessionService.getSession(sessionId);
        const totalPlayers = session?.players.length ?? 1;
        const allSubmitted = state.submittedUserIds.size >= totalPlayers;

        logger.info(
            { sessionId, userId, roundNumber, allSubmitted, submittedCount: state.submittedUserIds.size, totalPlayers },
            "[ANSWER_RECEIVED] Submission processed"
        );

        // ── OPPONENT_PROGRESS + OPPONENT_TELEMETRY: notify all other players ─
        if (totalPlayers > 1) {
            const opponents = (session?.players ?? []).filter((uid) => uid !== userId);
            for (const opponentId of opponents) {
                await this.emitToPlayer(io, opponentId, "OPPONENT_PROGRESS", {
                    fromUserId: userId,
                    answered: true,
                    round: result.roundState.currentRound,
                    livesRemaining: result.livesRemaining,
                    allSubmitted,
                });
                await this.emitToPlayer(io, opponentId, "OPPONENT_TELEMETRY", {
                    fromUserId: userId,
                    wpm: 0,
                    codeLength: 0,
                    progress: 1,
                    submitted: true,
                    verdict: result.verdict,
                });
            }
            logger.info(
                { sessionId, userId, roundNumber, allSubmitted },
                "OPPONENT_PROGRESS emitted"
            );
        }

        if (allSubmitted) {
            // ── Round-completion guard ────────────────────────────────────────
            // This is the critical fix for the double-increment race condition.
            //
            // In dual-player mode both SUBMIT_ANSWER handlers run concurrently.
            // Both do submittedUserIds.add() synchronously BEFORE any await,
            // so when they both hit `await evaluateAnswer()` they both see
            // submittedUserIds.size >= totalPlayers.  Without this guard,
            // both paths would proceed here and call recordResult() twice,
            // skipping a round (e.g. round 2 jumps to round 4).
            //
            // Solution: mark the round completed atomically here.  Only the
            // first call through proceeds; the second returns early.
            if (state.lastCompletedRound >= roundNumber) {
                logger.warn(
                    { sessionId, roundNumber, lastCompletedRound: state.lastCompletedRound },
                    "[ROUND_COMPLETE] Completion guard prevented duplicate — skipping"
                );
                return;
            }
            state.lastCompletedRound = roundNumber;

            // Cancel all outstanding timers for this round
            const liveTimer = liveAdvanceTimers.get(sessionId);
            if (liveTimer) {
                clearTimeout(liveTimer);
                liveAdvanceTimers.delete(sessionId);
            }
            this.clearRoundTimer(sessionId);

            // ── Termination path 1: lives exhausted (detected in evaluateAnswer) ──
            if (result.roundState.isTerminated && result.roundState.terminationCause === "LIVES_EXHAUSTED") {
                logger.info({ sessionId, roundNumber }, "[SESSION_END] Lives exhausted");
                io.to(sessionId).emit("SESSION_END", {
                    cause: "LIVES_EXHAUSTED",
                    finalState: { players: result.players },
                });
                await this.emitSurvivalOutcomes(io, sessionId, result.players, "LIVES_EXHAUSTED");
                this.persistMatchResults(io, sessionId, result.players, "LIVES_EXHAUSTED")
                    .catch(err => logger.error({ err, sessionId }, "persistMatchResults failed"));
                this.cleanup(sessionId);
                return;
            }

            // ── Advance round state (called exactly ONCE per round) ──────────
            const advancedState = this.recordResult(sessionId, session!.config, result.passed);
            logger.info(
                { sessionId, completedRound: roundNumber, nextRound: advancedState.currentRound, isTerminated: advancedState.isTerminated },
                "[ROUND_COMPLETE] Round advanced"
            );

            // ── Termination path 2: all rounds completed ─────────────────────
            if (advancedState.isTerminated) {
                logger.info({ sessionId }, "[SESSION_END] All rounds completed");
                io.to(sessionId).emit("SESSION_END", {
                    cause: advancedState.terminationCause ?? "COMPLETED",
                    finalState: { players: result.players },
                });
                await this.emitSurvivalOutcomes(io, sessionId, result.players, (advancedState.terminationCause ?? "COMPLETED") as "COMPLETED");
                this.persistMatchResults(io, sessionId, result.players, advancedState.terminationCause ?? "COMPLETED")
                    .catch(err => logger.error({ err, sessionId }, "persistMatchResults failed"));
                this.cleanup(sessionId);
            } else {
                // ── Next round ───────────────────────────────────────────────
                logger.info(
                    { sessionId, nextRound: advancedState.currentRound },
                    "[NEXT_ROUND] Scheduling start in 3.5s"
                );
                setTimeout(async () => {
                    try {
                        const liveState = this.getState(sessionId);
                        logger.info(
                            { sessionId, nextRound: liveState.currentRound },
                            "[ROUND_START] Starting next round"
                        );
                        await this.startRound(io, sessionId, liveState.currentRound);
                    } catch (err) {
                        logger.error({ err, sessionId }, "Error starting next round");
                    }
                }, 3500);
            }
        } else if (totalPlayers > 1 && !roundTimers.has(sessionId)) {
            // LIVE mode only: first player submitted — arm the 15s advance timer
            this.scheduleLiveAdvance(io, sessionId, roundNumber);
            logger.info({ sessionId, roundNumber }, "LIVE advance timer scheduled (15s)");
        }
    }

    private async emitToPlayer(
        io: SocketServer,
        userId: string,
        event: string,
        data: unknown
    ): Promise<void> {
        const socketId = await this.sessionService.getSocketId(userId);
        if (socketId) {
            io.to(socketId).emit(event, data);
        }
    }

    /** Emit SURVIVAL_CONTINUE to winner(s) and SURVIVAL_ENDED to loser(s) after session end. */
    private async emitSurvivalOutcomes(
        io: SocketServer,
        sessionId: string,
        players: Array<{ userId: string; score: number }>,
        cause: "COMPLETED" | "LIVES_EXHAUSTED"
    ): Promise<void> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) return;
        const isDual = session.config.playerFormat === "DUAL";
        if (isDual && players.length >= 2) {
            const [a, b] = players;
            const winner = a.score >= b.score ? a : b;
            const loser = a.score >= b.score ? b : a;
            await this.emitToPlayer(io, winner.userId, "SURVIVAL_CONTINUE", {
                bonusTimeMs: SURVIVAL_BONUS_MS,
                requeue: true,
            });
            await this.emitToPlayer(io, loser.userId, "SURVIVAL_ENDED", {});
        } else if (players.length === 1) {
            const userId = players[0].userId;
            if (cause === "COMPLETED") {
                await this.emitToPlayer(io, userId, "SURVIVAL_CONTINUE", {
                    bonusTimeMs: SURVIVAL_BONUS_MS,
                    requeue: true,
                });
            } else {
                await this.emitToPlayer(io, userId, "SURVIVAL_ENDED", {});
            }
        }
    }

    private async persistMatchResults(
        io: SocketServer,
        sessionId: string,
        players: Array<{ userId: string; score: number; roundScores: number[] }>,
        cause: string
    ): Promise<void> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) return;

        const isDual = session.config.playerFormat === "DUAL";
        const totalRounds = session.config.totalRounds;

        // ── Bug fix: use real elapsed time for speed-bonus calculation ──────────
        const roundState = roundStates.get(sessionId);
        const timeTakenMs = roundState
            ? Date.now() - roundState.sessionStartedAt
            : totalRounds * 30_000; // fallback if state was already cleaned up

        // ── Bug fix: fetch real globalScore values so ELO isn't always ±16 ─────
        // (previously both sides were hardcoded to 1000, making eloExpected always
        //  return 0.5 and the shift always land at exactly K*(actual−0.5))
        let lpMap: Record<string, number> = {};
        if (isDual) {
            try {
                const userIds = players.map(p => p.userId);
                const scores = await db.userScore.findMany({ where: { userId: { in: userIds } } });
                lpMap = Object.fromEntries(scores.map(s => [s.userId, s.globalScore]));
            } catch (err) {
                logger.warn({ err, sessionId }, "Could not fetch globalScores for ELO — falling back to 1000");
            }
        }

        for (const player of players) {
            try {
                const correctAnswers = player.roundScores.filter(s => s > 0).length;
                const accuracy = correctAnswers / Math.max(totalRounds, 1);

                const mode = isDual ? "ARCADE_DUAL" as const : "ARCADE_SINGLE" as const;

                const opponentId = players.find(p => p.userId !== player.userId)?.userId ?? "";
                const stats = isDual
                    ? {
                        myScore: player.score,
                        opponentScore: players.find(p => p.userId !== player.userId)?.score ?? 0,
                        opponentId,
                        correctAnswers,
                        totalRounds,
                        myGlobalLp: lpMap[player.userId] ?? 1000,
                        opponentGlobalLp: lpMap[opponentId] ?? 1000,
                    }
                    : { correctAnswers, totalRounds, timeTakenMs, accuracy };

                const result = await commitMatchResult({ userId: player.userId, mode, stats });
                logger.info({ sessionId, userId: player.userId, ...result }, "Match committed to DB");
            } catch (err) {
                logger.error({ err, sessionId, userId: player.userId }, "Failed to persist match result");
            }
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
