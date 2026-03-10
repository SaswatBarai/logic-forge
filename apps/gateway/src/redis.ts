// ─── Gateway — Redis Client Singleton ────────────────────────────────
import { Redis } from "ioredis";
import logger from "./logger.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let connected = false;

const redis = new Redis(REDIS_URL, {
    // Disable auto-reconnect storm; retry for up to ~30 s then give up
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times: number) {
        if (times > 5) {
            logger.warn("Redis: max retries reached, giving up");
            return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
    },
});

redis.on("connect", () => {
    connected = true;
    logger.info("Redis connected");
});

redis.on("ready", () => {
    connected = true;
    logger.info("Redis ready");
});

redis.on("error", (err: Error) => {
    connected = false;
    logger.warn({ err }, "Redis error — rate limiting will fail-open");
});

redis.on("close", () => {
    connected = false;
    logger.warn("Redis connection closed");
});

// Attempt initial connection (non-blocking)
redis.connect().catch((err: Error) => {
    logger.warn({ err }, "Redis initial connect failed — will retry");
});

/**
 * Returns true only when Redis is fully ready to accept commands.
 */
export function isRedisConnected(): boolean {
    return connected && redis.status === "ready";
}

export default redis;
