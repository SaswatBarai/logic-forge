// apps/web/store/game-store.ts

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type SessionStatus = "IDLE" | "LOBBY" | "ACTIVE" | "COMPLETED" | "ABORTED";
export type PlayerFormat = "SINGLE" | "DUAL";
export type SessionType = "TIMER" | "LIVE";
export type BlitzCategory =
    | "MISSING_LINK"
    | "BOTTLENECK"
    | "TRACING"
    | "SYNTAX_ERROR";

export interface BlitzConfig {
    playerFormat: PlayerFormat;
    sessionType: SessionType;
    category: BlitzCategory | null;
    livesEnabled: boolean;
    lives: number;
    totalRounds: number;
}

export interface RoundChallenge {
    id: string;
    title: string;
    description: string;
    codeTemplate: string;
    hints: unknown;
    timeLimitMs: number | null;   // null = Live Mode (no countdown)
}

export interface PlayerSnapshot {
    userId: string;
    score: number;
    roundScores: number[];
    livesRemaining: number;
}

export interface RoundResult {
    userId: string;
    challengeId: string;
    passed: boolean;
    points: number;
}

// ── Per-round history entry for results screen ────────────────────────────
export interface RoundHistoryEntry {
    roundNumber: number;
    verdict: "CORRECT" | "INCORRECT";
    score: number;
    executionTimeMs: number;
}

interface GameState {
    connected: boolean;
    socketStatus: "CONNECTING" | "OPEN" | "CLOSED" | "ERROR";
    matchStatus: "IDLE" | "QUEUED" | "MATCHED";
    queueError: string | null;
    sessionId: string | null;
    pendingUserId: string | null;
    sessionStatus: SessionStatus;
    config: BlitzConfig | null;
    players: PlayerSnapshot[];
    currentRound: number;
    totalRounds: number;
    challenge: RoundChallenge | null;
    lastResult: RoundResult | null;
    showResultOverlay: boolean;
    myLives: number;
    abortReason: string | null;
    // ── Timer ──
    timeRemaining: number | null;
    // ── Results history ──
    roundHistory: RoundHistoryEntry[];

    setConnected: (v: boolean) => void;
    setSocketStatus: (v: GameState["socketStatus"]) => void;
    setMatchStatus: (v: GameState["matchStatus"]) => void;
    applyMatched: (sessionId: string, userId?: string) => void;
    setQueuedUserId: (userId: string) => void;
    setQueueError: (msg: string | null) => void;
    applySessionJoined: (payload: SessionJoinedPayload) => void;
    applyPlayerConnected: (userId: string) => void;
    applyRoundStart: (payload: RoundStartPayload) => void;
    applyRoundResult: (payload: RoundResultPayload) => void;
    applyTimerSync: (payload: TimerSyncPayload) => void;
    applySessionEnd: (payload: SessionEndPayload) => void;
    applySessionAborted: (payload: SessionAbortedPayload) => void;
    dismissResultOverlay: () => void;
    reset: () => void;
}

// ── Payload shapes ────────────────────────────────────────────────────────
export interface SessionJoinedPayload {
    sessionId: string;
    config: BlitzConfig;
    players: { userId: string; score: number; livesRemaining: number }[];
    currentRound: number;
    maxRounds: number;
    status: string;
}

export interface RoundStartPayload {
    roundNumber: number;
    totalRounds: number;
    challenge: RoundChallenge;
    players: PlayerSnapshot[];
}

export interface RoundResultPayload {
    userId: string;
    challengeId: string;
    passed: boolean;
    points: number;
    livesRemaining?: number;
    roundState: {
        currentRound: number;
        isTerminated: boolean;
        terminationCause?: string;
    };
    players: PlayerSnapshot[];
}

export interface TimerSyncPayload {
    roundNumber: number;
    remainingMs: number;
    serverTimestamp: number;
}

export interface SessionEndPayload {
    cause: "COMPLETED" | "LIVES_EXHAUSTED";
    finalState: { players: PlayerSnapshot[] };
}

export interface SessionAbortedPayload {
    reason: string;
    abortedBy: string;
}

const initialState = {
    connected: false,
    socketStatus: "CONNECTING" as const,
    matchStatus: "IDLE" as const,
    queueError: null,
    sessionId: null,
    pendingUserId: null as string | null,
    sessionStatus: "IDLE" as SessionStatus,
    config: null,
    players: [],
    currentRound: 0,
    totalRounds: 5,
    challenge: null,
    lastResult: null,
    showResultOverlay: false,
    myLives: 0,
    abortReason: null,
    timeRemaining: null,
    roundHistory: [] as RoundHistoryEntry[],
};

export const useGameStore = create<GameState>()(
    immer((set) => ({
        ...initialState,

        setConnected: (v) => set((s) => { s.connected = v; }),
        setSocketStatus: (v) => set((s) => { s.socketStatus = v; }),
        setMatchStatus: (v) => set((s) => { s.matchStatus = v; }),
        applyMatched: (sid, uid) => set((s) => {
            s.matchStatus = "MATCHED";
            s.sessionId = sid;
            if (uid) s.pendingUserId = uid;
        }),
        setQueuedUserId: (uid) => set((s) => { s.pendingUserId = uid; }), // Use same userId for JOIN when MATCHED
        setQueueError: (msg) => set((s) => { s.queueError = msg; }),

        applySessionJoined: (payload) => set((s) => {
            s.sessionId = payload.sessionId;
            s.config = payload.config;
            s.sessionStatus = "LOBBY";
            s.totalRounds = payload.config.totalRounds;
            s.myLives = payload.config.livesEnabled ? payload.config.lives : 0;
            s.matchStatus = "MATCHED";
            s.roundHistory = [];
            s.players = payload.players.map((p) => ({
                userId: p.userId,
                score: p.score ?? 0,
                roundScores: [],
                livesRemaining: p.livesRemaining ?? (payload.config.livesEnabled ? payload.config.lives : 0),
            }));
        }),

        applyPlayerConnected: (userId) => set((s) => {
            if (!s.players.find((p: PlayerSnapshot) => p.userId === userId)) {
                s.players.push({
                    userId,
                    score: 0,
                    roundScores: [],
                    livesRemaining: s.config?.lives ?? 0,
                });
            }
        }),

        applyRoundStart: (payload) => set((s) => {
            s.sessionStatus = "ACTIVE";
            s.currentRound = payload.roundNumber;
            s.totalRounds = payload.totalRounds;
            s.challenge = payload.challenge;
            s.players = payload.players;
            s.lastResult = null;
            s.showResultOverlay = false;
            // ── Seed timer from challenge config ──────────────────────────
            s.timeRemaining = payload.challenge.timeLimitMs;
        }),

        applyRoundResult: (payload) => set((s) => {
            s.players = payload.players;
            s.lastResult = {
                userId: payload.userId,
                challengeId: payload.challengeId,
                passed: payload.passed,
                points: payload.points,
            };
            s.showResultOverlay = true;
            s.timeRemaining = null;

            if (payload.livesRemaining !== undefined) {
                s.myLives = payload.livesRemaining;
            }

            // ── Accumulate round history for results screen ───────────────
            s.roundHistory.push({
                roundNumber: payload.roundState.currentRound - 1 || s.currentRound,
                verdict: payload.passed ? "CORRECT" : "INCORRECT",
                score: payload.points,
                executionTimeMs: 0,  // filled when code-runner is integrated
            });

            if (payload.roundState.isTerminated) {
                s.sessionStatus = "COMPLETED";
            }
        }),

        // ── TIMER_SYNC — server-driven countdown ──────────────────────────
        applyTimerSync: (payload) => set((s) => {
            s.timeRemaining = payload.remainingMs;
        }),

        applySessionEnd: (payload) => set((s) => {
            s.sessionStatus = "COMPLETED";
            s.players = payload.finalState.players;
            s.challenge = null;
            s.showResultOverlay = false;
            s.timeRemaining = null;
        }),

        applySessionAborted: (payload) => set((s) => {
            s.sessionStatus = "ABORTED";
            s.abortReason = payload.reason;
            s.challenge = null;
            s.timeRemaining = null;
        }),

        dismissResultOverlay: () => set((s) => { s.showResultOverlay = false; }),
        reset: () => set(() => ({ ...initialState })),
    }))
);
