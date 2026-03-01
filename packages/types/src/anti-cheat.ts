// ─── Anti-Cheat Types ────────────────────────────────────────────────
import { z } from "zod";

// ─── Telemetry Event Types ───────────────────────────────────────────
export const TelemetryEventTypeEnum = z.enum([
    "WINDOW_FOCUS_LOSS",
    "WINDOW_FOCUS_GAIN",
    "PASTE_DETECTED",
    "KEYSTROKE_CADENCE",
    "ROUND_TIMING",
    "CLIPBOARD_ACCESS",
    "DEVTOOLS_OPEN",
]);
export type TelemetryEventType = z.infer<typeof TelemetryEventTypeEnum>;

// ─── Single Telemetry Event ──────────────────────────────────────────
export const TelemetryEventSchema = z.object({
    type: TelemetryEventTypeEnum,
    timestamp: z.number(), // Unix ms
    sessionId: z.string().uuid(),
    roundNumber: z.number().int().optional(),
    data: z.record(z.unknown()).optional(), // Event-specific payload
});
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

// ─── Telemetry Batch Submission ──────────────────────────────────────
export const TelemetryBatchSchema = z.object({
    sessionId: z.string().uuid(),
    events: z.array(TelemetryEventSchema).min(1).max(100),
    clientTimestamp: z.number(),
});
export type TelemetryBatch = z.infer<typeof TelemetryBatchSchema>;

// ─── Risk Score Response ─────────────────────────────────────────────
export const RiskScoreResponseSchema = z.object({
    sessionId: z.string().uuid(),
    windowFocusLoss: z.number().int(),
    keystrokeFlagsCount: z.number().int(),
    timeAnomalyCount: z.number().int(),
    aggregateScore: z.number(),
    flagged: z.boolean(),
    computedAt: z.string().datetime(),
});
export type RiskScoreResponse = z.infer<typeof RiskScoreResponseSchema>;

// ─── Behavior Signal (internal scoring) ──────────────────────────────
export interface BehaviorSignal {
    type: TelemetryEventType;
    weight: number;
    threshold: number;
    description: string;
}

export const DEFAULT_SIGNAL_WEIGHTS: Record<string, BehaviorSignal> = {
    WINDOW_FOCUS_LOSS: {
        type: "WINDOW_FOCUS_LOSS",
        weight: 0.15,
        threshold: 3,
        description: "Tab switching or application focus loss",
    },
    PASTE_DETECTED: {
        type: "PASTE_DETECTED",
        weight: 0.25,
        threshold: 1,
        description: "Paste event detected in answer input",
    },
    KEYSTROKE_CADENCE: {
        type: "KEYSTROKE_CADENCE",
        weight: 0.2,
        threshold: 5,
        description: "Non-human keystroke timing pattern",
    },
    ROUND_TIMING: {
        type: "ROUND_TIMING",
        weight: 0.3,
        threshold: 1,
        description: "Implausibly fast solution for difficulty level",
    },
    DEVTOOLS_OPEN: {
        type: "DEVTOOLS_OPEN",
        weight: 0.1,
        threshold: 1,
        description: "Browser developer tools opened during session",
    },
};
