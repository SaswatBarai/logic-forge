// ─── @logicforge/logger — Structured Logging ─────────────────────────
import pino from "pino";

export interface LoggerOptions {
    service: string;
    level?: string;
}

/**
 * Create a structured logger for a LogicForge service.
 *
 * @example
 * ```ts
 * import { createLogger } from "@logicforge/logger";
 * const logger = createLogger({ service: "game-api" });
 * logger.info({ sessionId: "abc" }, "Session created");
 * ```
 */
export function createLogger(options: LoggerOptions): pino.Logger {
    const isDev = process.env.NODE_ENV !== "production";

    return pino({
        name: options.service,
        level: options.level ?? (isDev ? "debug" : "info"),
        // Pretty print in development, JSON in production
        ...(isDev
            ? {
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "SYS:HH:MM:ss",
                        ignore: "pid,hostname",
                    },
                },
            }
            : {}),
        // Add default fields to every log message
        base: {
            service: options.service,
            env: process.env.NODE_ENV ?? "development",
        },
        // Standard serializers for error objects and requests
        serializers: {
            err: pino.stdSerializers.err,
            req: pino.stdSerializers.req,
            res: pino.stdSerializers.res,
        },
    });
}

/**
 * Create a child logger with additional context.
 * Useful for adding request-specific fields (requestId, userId, etc.)
 */
export function createChildLogger(
    parent: pino.Logger,
    bindings: Record<string, unknown>
): pino.Logger {
    return parent.child(bindings);
}

// Re-export pino types for consumer convenience
export type Logger = pino.Logger;
export { pino };
