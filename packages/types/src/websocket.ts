// ─── WebSocket Event Types ───────────────────────────────────────────
import { z } from "zod";

// ─── Client → Server Events ─────────────────────────────────────────
export const WsClientEventEnum = z.enum([
    "JOIN_SESSION",
    "READY",
    "SUBMIT_ANSWER",
    "LEAVE_SESSION",
    "PING",
    "IDENTIFY",
]);
export type WsClientEvent = z.infer<typeof WsClientEventEnum>;

export const JoinSessionPayloadSchema = z.object({
    type: z.literal("JOIN_SESSION"),
    sessionId: z.string().uuid(),
    token: z.string(), // Auth token
});

export const ReadyPayloadSchema = z.object({
    type: z.literal("READY"),
    sessionId: z.string().uuid(),
});

export const SubmitAnswerWsPayloadSchema = z.object({
    type: z.literal("SUBMIT_ANSWER"),
    sessionId: z.string().uuid(),
    roundNumber: z.number().int(),
    code: z.string(),
});

export const LeaveSessionPayloadSchema = z.object({
    type: z.literal("LEAVE_SESSION"),
    sessionId: z.string().uuid(),
});

export const PingPayloadSchema = z.object({
    type: z.literal("PING"),
    timestamp: z.number(),
});

export const IdentifyPayloadSchema = z.object({
    type: z.literal("IDENTIFY"),
    userId: z.string().min(1),
});

export const WsClientMessageSchema = z.discriminatedUnion("type", [
    JoinSessionPayloadSchema,
    ReadyPayloadSchema,
    SubmitAnswerWsPayloadSchema,
    LeaveSessionPayloadSchema,
    PingPayloadSchema,
    IdentifyPayloadSchema,
]);
export type WsClientMessage = z.infer<typeof WsClientMessageSchema>;

// ─── Server → Client Events ─────────────────────────────────────────
export const WsServerEventEnum = z.enum([
    "SESSION_JOINED",
    "ROUND_START",
    "TIMER_SYNC",
    "ROUND_RESULT",
    "OPPONENT_SUBMITTED",
    "SESSION_COMPLETE",
    "MATCH_FOUND",
    "ERROR",
    "PONG",
]);
export type WsServerEvent = z.infer<typeof WsServerEventEnum>;

export interface SessionJoinedPayload {
    type: "SESSION_JOINED";
    sessionId: string;
    currentRound: number;
    maxRounds: number;
    status: string;
}

export interface RoundStartPayload {
    type: "ROUND_START";
    roundNumber: number;
    challenge: {
        id: string;
        title: string;
        description: string;
        codeTemplate: string;
        hints: unknown;
        timeLimitMs: number;
    };
}

export interface TimerSyncPayload {
    type: "TIMER_SYNC";
    roundNumber: number;
    remainingMs: number;
    serverTimestamp: number;
}

export interface RoundResultPayload {
    type: "ROUND_RESULT";
    roundNumber: number;
    verdict: string;
    score: number;
    totalScore: number;
    executionTimeMs: number | null;
}

export interface OpponentSubmittedPayload {
    type: "OPPONENT_SUBMITTED";
    roundNumber: number;
    opponentVerdict: string;
    opponentScore: number;
}

export interface SessionCompletePayload {
    type: "SESSION_COMPLETE";
    totalScore: number;
    roundResults: Array<{
        roundNumber: number;
        verdict: string;
        score: number;
        timeMs: number;
    }>;
}

export interface MatchFoundPayload {
    type: "MATCH_FOUND";
    opponentId: string;
    sessionId: string;
}

export interface WsErrorPayload {
    type: "ERROR";
    code: string;
    message: string;
}

export interface PongPayload {
    type: "PONG";
    timestamp: number;
    serverTimestamp: number;
}

export type WsServerMessage =
    | SessionJoinedPayload
    | RoundStartPayload
    | TimerSyncPayload
    | RoundResultPayload
    | OpponentSubmittedPayload
    | SessionCompletePayload
    | MatchFoundPayload
    | WsErrorPayload
    | PongPayload;
