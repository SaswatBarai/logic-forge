// ─── Challenge Types ─────────────────────────────────────────────────
import { z } from "zod";

export const ChallengeCategoryEnum = z.enum([
    "THE_MISSING_LINK",
    "THE_BOTTLENECK_BREAKER",
    "STATE_TRACING",
    "SYNTAX_ERROR_DETECTION",
]);

export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);
export const LanguageEnum = z.enum(["JAVA", "CPP", "PYTHON"]);

export type ChallengeCategory = z.infer<typeof ChallengeCategoryEnum>;
export type Difficulty = z.infer<typeof DifficultyEnum>;
export type Language = z.infer<typeof LanguageEnum>;

// ─── Challenge Query ─────────────────────────────────────────────────
export const ChallengeQuerySchema = z.object({
    category: ChallengeCategoryEnum.optional(),
    difficulty: DifficultyEnum.optional(),
    language: LanguageEnum.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
});
export type ChallengeQuery = z.infer<typeof ChallengeQuerySchema>;

// ─── Random Challenge Query ──────────────────────────────────────────
export const RandomChallengeQuerySchema = z.object({
    category: ChallengeCategoryEnum.optional(),
    difficulty: DifficultyEnum.optional(),
    language: LanguageEnum,
    excludeIds: z.array(z.string().uuid()).default([]),
});
export type RandomChallengeQuery = z.infer<typeof RandomChallengeQuerySchema>;

// ─── Challenge Response ──────────────────────────────────────────────
export const ChallengeResponseSchema = z.object({
    id: z.string().uuid(),
    category: ChallengeCategoryEnum,
    difficulty: DifficultyEnum,
    title: z.string(),
    description: z.string(),
    codeTemplate: z.string(),
    hints: z.unknown().nullable(),
    language: LanguageEnum,
    timeLimitMs: z.number().int(),
});
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

// ─── Semantic Token Map ──────────────────────────────────────────────
export const SemanticTokenMapSchema = z.record(
    z.string(), // placeholder name
    z.object({
        type: z.enum(["variable", "function", "class", "parameter", "constant"]),
        context: z.string().optional(), // hint for synonym selection
    })
);
export type SemanticTokenMap = z.infer<typeof SemanticTokenMapSchema>;
