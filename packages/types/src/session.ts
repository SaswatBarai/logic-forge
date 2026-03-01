// ─── Session Types ───────────────────────────────────────────────────
import { z } from "zod";

export const SessionTypeEnum = z.enum(["TIMER", "LIVE"]);
export const PlayerFormatEnum = z.enum(["SINGLE", "DUAL"]);
export const SessionStatusEnum = z.enum([
  "LOBBY",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ABANDONED",
]);
export const GameModeEnum = z.enum(["ARCADE", "STORY"]);

export type SessionType = z.infer<typeof SessionTypeEnum>;
export type PlayerFormat = z.infer<typeof PlayerFormatEnum>;
export type SessionStatus = z.infer<typeof SessionStatusEnum>;
export type GameMode = z.infer<typeof GameModeEnum>;

// ─── Create Session Request ─────────────────────────────────────────
export const CreateSessionSchema = z.object({
  mode: GameModeEnum,
  sessionType: SessionTypeEnum.optional(),
  playerFormat: PlayerFormatEnum.default("SINGLE"),
  category: z.string().optional(),
  language: z.string().optional(),
});
export type CreateSessionRequest = z.infer<typeof CreateSessionSchema>;

// ─── Session Response ────────────────────────────────────────────────
export const SessionResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  mode: GameModeEnum,
  sessionType: SessionTypeEnum.nullable(),
  playerFormat: PlayerFormatEnum,
  category: z.string().nullable(),
  language: z.string().nullable(),
  status: SessionStatusEnum,
  totalScore: z.number().int(),
  livesRemaining: z.number().int().nullable(),
  currentRound: z.number().int(),
  maxRounds: z.number().int(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
