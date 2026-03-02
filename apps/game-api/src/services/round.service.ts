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

// ── Category map: types short names → question-engine/DB enum ────────────
const CATEGORY_TO_QE: Record<BlitzCategory, string> = {
    "MISSING_LINK": "THE_MISSING_LINK",
    "BOTTLENECK":   "THE_BOTTLENECK_BREAKER",
    "TRACING":      "STATE_TRACING",
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
    sessionId:        string;
    currentRound:     number;
    livesRemaining:   number;
    categoryHistory:  BlitzCategory[];
    usedChallengeIds: string[];          // prevent duplicate challenges
    isTerminated:     boolean;
    terminationCause?: "LIVES_EXHAUSTED" | "COMPLETED";
}

// ── Matches ChallengeResponseSchema from @logicforge/types ───────────────
interface ChallengeApiResponse {
    id:           string;
    title:        string;
    description:  string;
    codeTemplate: string;
    hints:        unknown;
    timeLimitMs:  number;
    category:     string;
    language:     string;
    difficulty:   string;
}

// ── Shape sent in ROUND_START — matches RoundStartPayload on frontend ─────
export interface RoundChallenge {
    id:           string;
    title:        string;
    description:  string;
    codeTemplate: string;
    hints:        unknown;
    timeLimitMs:  number;
}

export interface RoundState {
    sessionId:        string;
    currentRound:     number;
    livesRemaining:   number;
    categoryHistory:  BlitzCategory[];
    usedChallengeIds: string[];
    isTerminated:     boolean;
    terminationCause?: "LIVES_EXHAUSTED" | "COMPLETED";
}

export interface EvaluateAnswerResult {
    userId:          string;
    challengeId:     string;
    passed:          boolean;
    points:          number;
    livesRemaining?: number;
    roundState: {
        currentRound:      number;
        isTerminated:      boolean;
        terminationCause?: string;
    };
    players: Array<{ userId: string; score: number; roundScores: number[]; livesRemaining: number }>;
}

export interface PrepareNextRoundPayload {
    roundNumber: number;         // ← renamed to match RoundStartPayload frontend type
    totalRounds: number;
    challenge:   RoundChallenge;
    players:     Array<{ userId: string; score: number; roundScores: number[]; livesRemaining: number }>;
}

// In-memory store
const roundStates = new Map<string, RoundState>();

export class RoundService {

    constructor(private readonly sessionService: SessionService) {}

    initSession(sessionId: string, config: BlitzSessionConfig): RoundState {
        const state: RoundState = {
            sessionId,
            currentRound:     1,
            livesRemaining:   config.livesEnabled ? config.lives : (Infinity as any),
            categoryHistory:  [],
            usedChallengeIds: [],
            isTerminated:     false,
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
        config:    BlitzSessionConfig
    ): Promise<RoundChallenge> {
        const state    = this.getState(sessionId);
        const category = this.resolveCategory(state, config);

        // ── Map short name → DB enum before calling QE ────────────────────
        const qeCategory = CATEGORY_TO_QE[category];
        const language   = pickLanguage();

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

        return {
            id:           data.id,
            title:        data.title,
            description:  data.description,
            codeTemplate: data.codeTemplate,
            hints:        data.hints ?? null,
            timeLimitMs:  this.resolveTimeLimit(config.sessionType, state.currentRound),
        };
    }

    // ── Record result and advance round state ─────────────────────────────
    recordResult(
        sessionId: string,
        config:    BlitzSessionConfig,
        passed:    boolean
    ): RoundState {
        const state = this.getState(sessionId);

        if (!passed && config.livesEnabled) {
            state.livesRemaining--;
            logger.warn({ sessionId, livesRemaining: state.livesRemaining }, "Life deducted");
        }

        if (config.livesEnabled && state.livesRemaining <= 0) {
            state.isTerminated     = true;
            state.terminationCause = "LIVES_EXHAUSTED";
            return state;
        }

        if (state.currentRound >= TOTAL_ROUNDS) {
            state.isTerminated     = true;
            state.terminationCause = "COMPLETED";
            return state;
        }

        state.currentRound++;
        return state;
    }

    // ── Evaluate a submission ─────────────────────────────────────────────
    async evaluateAnswer(args: {
        sessionId:   string;
        userId:      string;
        challengeId: string;
        answer:      string;
    }): Promise<EvaluateAnswerResult> {
        const { sessionId, userId, challengeId, answer } = args;
        const session = await this.sessionService.getSession(sessionId);
        if (!session) throw new Error(`Session not found: ${sessionId}`);
        const config = session.config;

        // TODO: replace with real validation via question-engine
        const passed = (answer?.trim().length ?? 0) > 0;
        const points = passed ? 100 : 0;

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
            livesRemaining: config.livesEnabled ? player?.livesRemaining : undefined,
            roundState: {
                currentRound:     state.currentRound,
                isTerminated:     state.isTerminated,
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

        const challenge  = await this.fetchChallenge(sessionId, config);
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
        const payload = await this.prepareNextRound(sessionId);
        io.to(sessionId).emit("ROUND_START", payload);
        await this.sessionService.updateSession(sessionId, { currentRound: roundNumber, status: "ACTIVE" });
        logger.info({ sessionId, roundNumber }, "ROUND_START emitted");
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
        const challengeId = state.usedChallengeIds[roundNumber - 1] ?? state.usedChallengeIds[state.usedChallengeIds.length - 1];
        const result = await this.evaluateAnswer({ sessionId, userId, challengeId, answer });
        io.to(sessionId).emit("ROUND_RESULT", result);
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

    cleanup(sessionId: string): void {
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

    private resolveTimeLimit(sessionType: BlitzSessionConfig["sessionType"], round: number): number {
        if (sessionType === "TIMER") {
            return Math.max(20_000, 60_000 - (round - 1) * 5_000);
        }
        return 45_000;
    }
}
