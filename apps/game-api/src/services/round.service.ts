// apps/game-api/src/services/round.service.ts

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

// ── Category map: types short names → question-engine/DB enum ────────────
const CATEGORY_TO_QE: Record<BlitzCategory, string> = {
    "MISSING_LINK": "THE_MISSING_LINK",
    "BOTTLENECK": "THE_BOTTLENECK_BREAKER",
    "TRACING": "STATE_TRACING",
    "SYNTAX_ERROR": "SYNTAX_ERROR_DETECTION",
};

// ── Languages available for arcade mode (no user selection yet) ──────────
const ARCADE_LANGUAGES = ["PYTHON", "JAVA", "CPP"] as const;
type ArcadeLanguage = typeof ARCADE_LANGUAGES[number];

function pickLanguage(): ArcadeLanguage {
    return ARCADE_LANGUAGES[Math.floor(Math.random() * ARCADE_LANGUAGES.length)];
}

// ── Per-session round state ───────────────────────────────────────────────
export interface RoundState {
    sessionId: string;
    currentRound: number;
    livesRemaining: number;
    categoryHistory: BlitzCategory[];
    usedChallengeIds: string[];          // prevent duplicate challenges
    isTerminated: boolean;
    terminationCause?: "LIVES_EXHAUSTED" | "COMPLETED";
    submittedUserIds: Set<string>;       // tracks who submitted this round (reset each round)
}

// ── Matches ChallengeResponseSchema from @logicforge/types ───────────────
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
}

// ── Shape sent in ROUND_START — matches RoundStartPayload on frontend ─────
export interface RoundChallenge {
    id: string;
    title: string;
    description: string;
    codeTemplate: string;
    hints: unknown;
    timeLimitMs: number | null;
    category: string;   // e.g. "STATE_TRACING", "THE_MISSING_LINK"
}

export interface EvaluateAnswerResult {
    userId: string;
    challengeId: string;
    passed: boolean;
    points: number;
    verdict: string;  // CORRECT | PARTIAL | INCORRECT | COMPILE_ERROR | RUNTIME_ERROR | TIMEOUT
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

// ── In-memory stores ──────────────────────────────────────────────────────
const roundStates = new Map<string, RoundState>();
// sessionId → active countdown interval handle
const roundTimers = new Map<string, ReturnType<typeof setInterval>>();

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

    // ── Fetch challenge from question-engine ──────────────────────────────
    async fetchChallenge(
        sessionId: string,
        config: BlitzSessionConfig
    ): Promise<RoundChallenge> {
        const state = this.getState(sessionId);
        const category = this.resolveCategory(state, config);

        // ── Map short name → DB enum before calling QE ────────────────────
        const qeCategory = CATEGORY_TO_QE[category];
        const language = pickLanguage();

        const url = new URL(`${QUESTION_ENGINE_URL}/api/v1/challenges/random`);
        url.searchParams.set("category", qeCategory);
        url.searchParams.set("language", language);

        // Exclude already-used challenges this session
        if (state.usedChallengeIds.length > 0) {
            url.searchParams.set("excludeIds", state.usedChallengeIds.join(","));
        }

        const res = await fetch(url.toString());
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Question engine error ${res.status}: ${text}`);
        }

        // ── QE returns { success, data: ChallengeResponse } ──────────────
        const body = await res.json() as { success: boolean; data: ChallengeApiResponse };
        const data = body.data ?? (body as any); // handle flat response too

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
        };
    }

    // ── Record result and advance round state ─────────────────────────────
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

    // ── Evaluate a submission via code-runner ─────────────────────────────
    async evaluateAnswer(args: {
        sessionId: string;
        userId: string;
        challengeId: string;
        answer: string;   // the user's submitted code
    }): Promise<EvaluateAnswerResult> {
        const { sessionId, userId, challengeId, answer } = args;
        const session = await this.sessionService.getSession(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);
        const config = session.config;

        // ── 1. Fetch testCases + language from question-engine ─────────────
        let verdict = "INCORRECT";
        let executionTimeMs = 0;

        // Default values for empty / auto-submit (timer expiry)
        const isAutoSubmit = !answer || answer.trim().length === 0;

        if (!isAutoSubmit) {
            try {
                const challengeRes = await fetch(`${QUESTION_ENGINE_URL}/api/v1/challenges/${challengeId}`);
                if (!challengeRes.ok) {
                    throw new Error(`QE returned ${challengeRes.status} for challenge ${challengeId}`);
                }
                const challengeBody = await challengeRes.json() as {
                    success: boolean;
                    data: {
                        language: string;
                        testCases: Array<{ input: string; expectedOutput: string }>;
                        timeLimitMs?: number;
                    };
                };
                const challenge = challengeBody.data;

                // ── 2. POST to code-runner ─────────────────────────────────
                const runRes = await fetch(`${CODE_RUNNER_URL}/api/v1/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language: challenge.language,
                        code: answer,
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
                    verdict = runBody.verdict;    // CORRECT | PARTIAL | INCORRECT | COMPILE_ERROR | RUNTIME_ERROR | TIMEOUT
                    executionTimeMs = runBody.totalExecutionTimeMs ?? 0;
                } else {
                    logger.error({ sessionId, challengeId, status: runRes.status }, "Code-runner returned error");
                    verdict = "RUNTIME_ERROR";
                }
            } catch (err) {
                logger.error({ err, sessionId, challengeId }, "Failed to evaluate via code-runner — falling back to INCORRECT");
                verdict = "RUNTIME_ERROR";
            }
        }
        // Auto-submit (timer expiry) → already INCORRECT / 0 pts

        // ── 3. Map verdict → pass/points ──────────────────────────────────
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

    // ── Prepare ROUND_START payload ───────────────────────────────────────
    async prepareNextRound(sessionId: string): Promise<PrepareNextRoundPayload> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);
        const config = session.config;

        let state = roundStates.get(sessionId);
        if (!state) {
            state = this.initSession(sessionId, config);
        }

        // Reset submitted players for the new round
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

    /** Emit ROUND_START to session room; used by socket handler when all players joined / ready. */
    async startRound(io: SocketServer, sessionId: string, roundNumber: number): Promise<void> {
        // Clear any existing timer for this session (safety: don't double-start)
        this.clearRoundTimer(sessionId);

        const payload = await this.prepareNextRound(sessionId);
        io.to(sessionId).emit("ROUND_START", payload);
        await this.sessionService.updateSession(sessionId, { currentRound: roundNumber, status: "ACTIVE" });
        logger.info({ sessionId, roundNumber }, "ROUND_START emitted");

        // ── Start countdown only for TIMER mode ───────────────────────────
        if (payload.challenge.timeLimitMs != null) {
            this.startRoundTimer(io, sessionId, roundNumber, payload.challenge.timeLimitMs);
        }
    }

    // ── Timer countdown — emits TIMER_SYNC every 1 s ──────────────────────
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

    /** When time runs out, auto-fail every player who hasn't submitted yet. */
    private async handleTimerExpiry(
        io: SocketServer,
        sessionId: string,
        roundNumber: number
    ): Promise<void> {
        const session = await this.sessionService.getSession(sessionId);
        if (!session) return;

        const state = roundStates.get(sessionId);
        if (!state) return;

        // Find players who haven't submitted this round
        const pending = session.players.filter((uid) => !state.submittedUserIds.has(uid));

        if (pending.length === 0) {
            // All submitted already — nothing to do, handleSubmission already moved us forward
            logger.info({ sessionId, roundNumber }, "Timer expired but all players already submitted");
            return;
        }

        // Emit TIMER_EXPIRED so the client can show a toast / flash
        io.to(sessionId).emit("TIMER_EXPIRED", { roundNumber });

        // Auto-submit with empty answer for each pending player
        const state2 = roundStates.get(sessionId);
        if (!state2) return;
        const challengeId = state2.usedChallengeIds[roundNumber - 1] ?? state2.usedChallengeIds[state2.usedChallengeIds.length - 1];

        for (const userId of pending) {
            try {
                state.submittedUserIds.add(userId); // prevent double-processing
                const result = await this.evaluateAnswer({
                    sessionId,
                    userId,
                    challengeId,
                    answer: "", // blank = fail
                });

                io.to(sessionId).emit("ROUND_RESULT", result);
                logger.info({ sessionId, userId, roundNumber }, "Auto-submitted (timer expired)");

                // Only process round transition after ALL pending players evaluated
                // Use the last player's result to decide next step
                const isLastPending = userId === pending[pending.length - 1];
                if (isLastPending) {
                    if (result.roundState.isTerminated) {
                        io.to(sessionId).emit("SESSION_END", {
                            reason: result.roundState.terminationCause ?? "COMPLETED",
                            players: result.players,
                        });
                        this.cleanup(sessionId);
                        logger.info({ sessionId }, "Session ended after timer expiry");
                    } else {
                        await this.startRound(io, sessionId, result.roundState.currentRound);
                    }
                }
            } catch (err) {
                logger.error({ err, sessionId, userId }, "Error auto-submitting on timer expiry");
            }
        }
    }

    /** Clear the countdown interval for a session. */
    private clearRoundTimer(sessionId: string): void {
        const handle = roundTimers.get(sessionId);
        if (handle) {
            clearInterval(handle);
            roundTimers.delete(sessionId);
            logger.info({ sessionId }, "Round timer cleared");
        }
    }

    /** Handle SUBMIT_ANSWER: evaluate, emit ROUND_RESULT; if terminated emit SESSION_END and cleanup, else start next round. */
    async handleSubmission(
        io: SocketServer,
        sessionId: string,
        userId: string,
        answer: string,
        roundNumber: number
    ): Promise<void> {
        const state = this.getState(sessionId);

        // Guard: ignore duplicate submissions from the same player this round
        if (state.submittedUserIds.has(userId)) {
            logger.warn({ sessionId, userId, roundNumber }, "Duplicate SUBMIT_ANSWER ignored");
            return;
        }
        state.submittedUserIds.add(userId);

        const challengeId = state.usedChallengeIds[roundNumber - 1] ?? state.usedChallengeIds[state.usedChallengeIds.length - 1];
        const result = await this.evaluateAnswer({ sessionId, userId, challengeId, answer });
        io.to(sessionId).emit("ROUND_RESULT", result);

        // Get the session to know total player count
        const session = await this.sessionService.getSession(sessionId);
        const totalPlayers = session?.players.length ?? 1;
        const allSubmitted = state.submittedUserIds.size >= totalPlayers;

        if (allSubmitted) {
            // All players submitted — no need to wait for timer
            this.clearRoundTimer(sessionId);

            if (result.roundState.isTerminated) {
                io.to(sessionId).emit("SESSION_END", {
                    reason: result.roundState.terminationCause ?? "COMPLETED",
                    players: result.players,
                });
                this.cleanup(sessionId);
                logger.info({ sessionId }, "Session ended");
            } else {
                await this.startRound(io, sessionId, result.roundState.currentRound);
            }
        }
        // else: wait for other player(s) or timer expiry
    }

    cleanup(sessionId: string): void {
        this.clearRoundTimer(sessionId);
        roundStates.delete(sessionId);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private resolveCategory(state: RoundState, config: BlitzSessionConfig): BlitzCategory {
        if (config.sessionType === "TIMER") {
            return config.category!;
        }
        const pool = [...LIVE_CATEGORY_POOL] as LiveCategory[];
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * Returns the time limit for a round in milliseconds.
     * Timer mode: starts at 60s, decreases 5s per round, min 20s.
     * Live mode: null (no countdown).
     */
    private resolveTimeLimit(sessionType: BlitzSessionConfig["sessionType"], round: number): number | null {
        if (sessionType === "TIMER") {
            return Math.max(20_000, 60_000 - (round - 1) * 5_000);
        }
        // Live mode — no timer
        return null;
    }
}
