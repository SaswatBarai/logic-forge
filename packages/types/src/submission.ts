// ─── Submission Types ────────────────────────────────────────────────
import { z } from "zod";

export const SubmissionVerdictEnum = z.enum([
    "CORRECT",
    "INCORRECT",
    "PARTIAL",
    "TIMEOUT",
    "RUNTIME_ERROR",
    "COMPILE_ERROR",
]);
export type SubmissionVerdict = z.infer<typeof SubmissionVerdictEnum>;

export const RoundStatusEnum = z.enum([
    "PENDING",
    "ACTIVE",
    "COMPLETED",
    "SKIPPED",
    "TIMED_OUT",
]);
export type RoundStatus = z.infer<typeof RoundStatusEnum>;

// ─── Submit Answer Request ───────────────────────────────────────────
export const SubmitAnswerSchema = z.object({
    code: z.string().min(1, "Code cannot be empty").max(50000),
});
export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerSchema>;

// ─── Single Test Result ──────────────────────────────────────────────
export const TestResultSchema = z.object({
    passed: z.boolean(),
    input: z.string().optional(),
    expectedOutput: z.string().optional(),
    actualOutput: z.string().optional(),
    executionTimeMs: z.number().int().optional(),
    memoryUsedKb: z.number().int().optional(),
});
export type TestResult = z.infer<typeof TestResultSchema>;

// ─── Submission Response ─────────────────────────────────────────────
export const SubmissionResponseSchema = z.object({
    id: z.string().uuid(),
    roundId: z.string().uuid(),
    verdict: SubmissionVerdictEnum,
    executionTimeMs: z.number().int().nullable(),
    memoryUsedKb: z.number().int().nullable(),
    compilerOutput: z.string().nullable(),
    testResults: z.array(TestResultSchema).nullable(),
    submittedAt: z.string().datetime(),
});
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;

// ─── Code Execution Request (to Code Runner service) ─────────────────
export const CodeExecutionRequestSchema = z.object({
    language: z.enum(["java", "cpp", "python"]),
    code: z.string(),
    testCases: z.array(
        z.object({
            input: z.string(),
            expectedOutput: z.string(),
        })
    ),
    timeLimitMs: z.number().int().positive().default(5000),
    memoryLimitKb: z.number().int().positive().default(262144),
});
export type CodeExecutionRequest = z.infer<typeof CodeExecutionRequestSchema>;

// ─── Code Execution Response (from Code Runner service) ──────────────
export const CodeExecutionResponseSchema = z.object({
    verdict: SubmissionVerdictEnum,
    testResults: z.array(TestResultSchema),
    totalExecutionTimeMs: z.number().int(),
    compilerOutput: z.string().nullable(),
});
export type CodeExecutionResponse = z.infer<typeof CodeExecutionResponseSchema>;
