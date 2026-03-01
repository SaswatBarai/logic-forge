// ─── API Response Types ──────────────────────────────────────────────
import { z } from "zod";

// ─── Standard API Envelope ───────────────────────────────────────────
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.literal(true),
        data: dataSchema,
        meta: z
            .object({
                page: z.number().int().optional(),
                limit: z.number().int().optional(),
                total: z.number().int().optional(),
            })
            .optional(),
    });

export const ApiErrorSchema = z.object({
    success: z.literal(false),
    error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
    }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── Standard Error Codes ────────────────────────────────────────────
export const ERROR_CODES = {
    // Client errors
    VALIDATION_ERROR: "VALIDATION_ERROR",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    RATE_LIMITED: "RATE_LIMITED",

    // Session errors
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
    SESSION_ALREADY_ACTIVE: "SESSION_ALREADY_ACTIVE",
    SESSION_COMPLETED: "SESSION_COMPLETED",
    INVALID_STATE_TRANSITION: "INVALID_STATE_TRANSITION",
    ROUND_NOT_FOUND: "ROUND_NOT_FOUND",
    ROUND_ALREADY_COMPLETED: "ROUND_ALREADY_COMPLETED",

    // Execution errors
    COMPILATION_FAILED: "COMPILATION_FAILED",
    EXECUTION_TIMEOUT: "EXECUTION_TIMEOUT",
    RUNTIME_ERROR: "RUNTIME_ERROR",
    UNSUPPORTED_LANGUAGE: "UNSUPPORTED_LANGUAGE",

    // Service errors
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    QUESTION_ENGINE_ERROR: "QUESTION_ENGINE_ERROR",
    CODE_RUNNER_ERROR: "CODE_RUNNER_ERROR",
    ANTI_CHEAT_ERROR: "ANTI_CHEAT_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─── Helper to create standard responses ─────────────────────────────
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        details?: unknown;
    };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
