import { z } from "zod";

export type PlayerFormat = "SINGLE" | "DUAL";
export type SessionType  = "TIMER" | "LIVE";


export type TimerCategory = "MISSING_LINK" | "BOTTLENECK" | "TRACING";

export type LiveCategory  = TimerCategory | "SYNTAX_ERROR";


export type BlitzCategory = LiveCategory;

export const LIVE_CATEGORY_POOL: LiveCategory[] = [
    "MISSING_LINK",
    "BOTTLENECK",
    "TRACING",
    "SYNTAX_ERROR",
];

export const TOTAL_ROUNDS = 5;
export const LIVE_MODE_INITIAL_LIVES = 3; 


export const CreateSessionSchema = z
    .object({
        mode:         z.literal("ARCADE"),
        playerFormat: z.enum(["SINGLE", "DUAL"]),
        sessionType:  z.enum(["TIMER", "LIVE"]),
        category:     z.enum(["MISSING_LINK", "BOTTLENECK", "TRACING"]).nullable(),
        userId:       z.string().min(1),
    })
    .refine(
        (d) => !(d.sessionType === "TIMER" && d.category === null),
        { message: "Timer Mode requires a category", path: ["category"] }
    );

export type CreateSessionPayload = z.infer<typeof CreateSessionSchema>;

export interface BlitzSessionConfig {
    playerFormat: PlayerFormat;
    sessionType:  SessionType;
    category:     TimerCategory | null;
    livesEnabled: boolean;
    lives:        number;
    totalRounds:  number;
}

export interface WaitingRoomEntry {
    userId:    string;
    payload:   CreateSessionPayload;
    queuedAt:  number; 
}
