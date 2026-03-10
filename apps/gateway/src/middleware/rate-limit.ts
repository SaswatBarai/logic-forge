// ─── Gateway — Redis Sliding-Window Rate Limiter ─────────────────────
import type { Request, Response, NextFunction } from "express";
import redis, { isRedisConnected } from "../redis.js";
import logger from "../logger.js";

interface RateLimitOptions {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Window duration in seconds */
    windowSecs: number;
    /** Key prefix used in Redis */
    prefix: string;
}

function createRateLimiter(opts: RateLimitOptions) {
    return async function rateLimitMiddleware(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        // Identify caller — prefer JWT userId, fallback to IP
        const identifier = req.userId ?? req.ip ?? "unknown";
        const redisKey = `rl:${opts.prefix}:${identifier}`;

        // Fail open when Redis is unavailable
        if (!isRedisConnected()) {
            logger.warn(
                { key: redisKey },
                "Redis unavailable — rate limit skipped (fail-open)"
            );
            next();
            return;
        }

        try {
            const current = await redis.incr(redisKey);

            // Set expiry only on the first request within this window
            if (current === 1) {
                await redis.expire(redisKey, opts.windowSecs);
            }

            const remaining = Math.max(opts.limit - current, 0);

            res.setHeader("X-RateLimit-Limit", opts.limit);
            res.setHeader("X-RateLimit-Remaining", remaining);

            if (current > opts.limit) {
                // Compute how many seconds until the key expires
                const ttl = await redis.ttl(redisKey);
                res.status(429).json({
                    error: "Too many requests",
                    retryAfter: ttl > 0 ? ttl : opts.windowSecs,
                });
                return;
            }

            next();
        } catch (err) {
            // Redis error during the request — fail open
            logger.warn({ err }, "Rate limit Redis error — failing open");
            next();
        }
    };
}

/** General rate limit: 120 req / 60 s per user */
export const generalRateLimit = createRateLimiter({
    limit: 120,
    windowSecs: 60,
    prefix: "general",
});

/** Code-runner rate limit: 10 req / 60 s per user */
export const codeRunnerRateLimit = createRateLimiter({
    limit: 10,
    windowSecs: 60,
    prefix: "run",
});
