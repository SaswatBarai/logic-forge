import { getRedisClient } from "@logicforge/config";
import { db } from "@logicforge/db";
import { logger } from "../app";
import { broadcastToSession } from "../websocket/socket.manager";
import {
    RoundStartPayload,
    TimerSyncPayload,
    RoundResultPayload,
    SessionCompletePayload,
} from "@logicforge/types";

// In-memory per-session round history (for SESSION_COMPLETE aggregate)
const sessionRoundHistory = new Map<
    string,
    Array<{ roundNumber: number; verdict: string; score: number; timeMs: number }>
>();

const QUESTION_ENGINE_URL =
    process.env.QUESTION_ENGINE_URL || "http://localhost:3002";

// Cache key helpers
const sessionCacheKey = (sid: string) => `session:${sid}`;
const roundCacheKey = (sid: string) => `session:${sid}:round`;

// In-process timer references (fine for single-instance dev)
const timers = new Map<string, NodeJS.Timeout[]>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a challenge from Question Engine, cache it in Redis, and broadcast
 * ROUND_START to every client in the session room.
 */
export async function startRound(
    sessionId: string,
    roundNumber: number
): Promise<void> {
    const redis = await getRedisClient();

    // 1. Fetch a random challenge from Question Engine
    const challengeRes = await fetch(
        `${QUESTION_ENGINE_URL}/api/v1/challenges/random?language=PYTHON`
    );
    if (!challengeRes.ok) {
        throw new Error(
            `Question Engine returned ${challengeRes.status} when fetching challenge`
        );
    }
    const { data: challenge } = await challengeRes.json();

    const timeLimitMs: number = challenge.timeLimitMs ?? 120_000;

    // 2. Persist round context into Redis
    const roundContext = {
        challengeId: challenge.id,
        language: challenge.language ?? "PYTHON",
        timeLimitMs,
        startedAt: Date.now(),
        roundNumber,
    };
    await redis.set(roundCacheKey(sessionId), JSON.stringify(roundContext));

    // 3. Update session cache with current round + ACTIVE status
    const rawSession = await redis.get(sessionCacheKey(sessionId));
    if (rawSession) {
        const session = JSON.parse(rawSession);
        session.currentRound = roundNumber;
        session.status = "ACTIVE";
        session.roundStartTime = roundContext.startedAt;
        await redis.set(sessionCacheKey(sessionId), JSON.stringify(session));
    }

    // 4. Broadcast ROUND_START
    const roundStart: RoundStartPayload = {
        type: "ROUND_START",
        roundNumber,
        challenge: {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            codeTemplate: challenge.codeTemplate ?? "",
            hints: challenge.hints ?? null,
            timeLimitMs,
        },
    };
    broadcastToSession(sessionId, roundStart);

    // 5. Schedule periodic TIMER_SYNC broadcasts (every 5 seconds)
    clearSessionTimers(sessionId);
    const timerRefs: NodeJS.Timeout[] = [];

    const syncInterval = setInterval(() => {
        const elapsedMs = Date.now() - roundContext.startedAt;
        const remainingMs = Math.max(0, timeLimitMs - elapsedMs);

        const sync: TimerSyncPayload = {
            type: "TIMER_SYNC",
            roundNumber,
            remainingMs,
            serverTimestamp: Date.now(),
        };
        broadcastToSession(sessionId, sync);

        if (remainingMs <= 0) {
            clearSessionTimers(sessionId);
        }
    }, 5_000);

    // 6. Auto-timeout: end the round when time is up
    const timeoutRef = setTimeout(async () => {
        clearSessionTimers(sessionId);
        logger.info({ sessionId, roundNumber }, "Round timed out — auto-ending");
        await endRound(sessionId, roundNumber, {
            verdict: "TIMEOUT",
            score: 0,
            executionTimeMs: 0,
        });
    }, timeLimitMs);

    timerRefs.push(syncInterval, timeoutRef);
    timers.set(sessionId, timerRefs);

    logger.info(
        { sessionId, roundNumber, challengeId: challenge.id },
        "Round started"
    );
}

/**
 * Called after a real submission verdict, or on timeout.
 * Persists the Round to Postgres and broadcasts ROUND_RESULT.
 * If all rounds done, broadcasts SESSION_COMPLETE instead of starting another.
 */
export async function endRound(
    sessionId: string,
    roundNumber: number,
    results: {
        verdict: string;
        score: number;
        executionTimeMs: number;
    }
): Promise<void> {
    clearSessionTimers(sessionId);

    const redis = await getRedisClient();

    // Fetch session to know maxRounds
    const rawSession = await redis.get(sessionCacheKey(sessionId));
    if (!rawSession) {
        logger.warn({ sessionId }, "endRound: session cache missing");
        return;
    }
    const session = JSON.parse(rawSession);

    // Accumulate round history (in-memory per session)
    const history = sessionRoundHistory.get(sessionId) ?? [];
    history.push({
        roundNumber,
        verdict: results.verdict,
        score: results.score,
        timeMs: results.executionTimeMs,
    });
    sessionRoundHistory.set(sessionId, history);

    // Persist Round row to Postgres
    const roundContext = await getRoundChallenge(sessionId);
    if (roundContext) {
        try {
            const dbAny = db as any;
            const existing = await dbAny.round.findUnique({
                where: { sessionId_roundNumber: { sessionId, roundNumber } },
            });
            if (!existing) {
                await dbAny.round.create({
                    data: {
                        sessionId,
                        roundNumber,
                        challengeId: roundContext.challengeId,
                        status: results.verdict === "TIMEOUT" ? "TIMED_OUT" : "COMPLETED",
                        score: results.score,
                        startedAt: new Date(roundContext.startedAt),
                        endedAt: new Date(),
                    },
                });
            }
        } catch (err) {
            logger.error({ err, sessionId, roundNumber }, "Failed to persist Round to DB");
        }
    }

    // Broadcast ROUND_RESULT to the submitting client's session room
    const roundResult: RoundResultPayload = {
        type: "ROUND_RESULT",
        roundNumber,
        verdict: results.verdict,
        score: results.score,
        totalScore: history.reduce((sum, r) => sum + r.score, 0),
        executionTimeMs: results.executionTimeMs,
    };
    broadcastToSession(sessionId, roundResult);

    // Check if this was the last round
    if (roundNumber >= (session.maxRounds ?? 5)) {
        // Mark session COMPLETED in Postgres
        try {
            await db.gameSession.update({
                where: { id: sessionId },
                data: {
                    status: "COMPLETED",
                    endedAt: new Date(),
                },
            });
        } catch (err) {
            logger.error({ err, sessionId }, "Failed to mark session COMPLETED in DB");
        }

        // Evict from Redis cache
        await redis.del(sessionCacheKey(sessionId));
        await redis.del(roundCacheKey(sessionId));

        const complete: SessionCompletePayload = {
            type: "SESSION_COMPLETE",
            totalScore: roundResult.totalScore,
            roundResults: history,
        };
        broadcastToSession(sessionId, complete);

        // Clean up in-memory history
        sessionRoundHistory.delete(sessionId);
        logger.info({ sessionId }, "Session complete");
    } else {
        // Start next round after a 3-second breather
        setTimeout(() => {
            startRound(sessionId, roundNumber + 1).catch((err) =>
                logger.error({ err, sessionId }, "Failed to start next round")
            );
        }, 3_000);
    }
}

// ---------------------------------------------------------------------------
// Helpers — used by session.service.ts
// ---------------------------------------------------------------------------

/**
 * Retrieve current round context from Redis (used by submission handler)
 */
export async function getRoundChallenge(sessionId: string): Promise<{
    challengeId: string;
    language: string;
    timeLimitMs: number;
    startedAt: number;
    roundNumber: number;
} | null> {
    const redis = await getRedisClient();
    const raw = await redis.get(roundCacheKey(sessionId));
    return raw ? JSON.parse(raw) : null;
}

function clearSessionTimers(sessionId: string) {
    const refs = timers.get(sessionId) ?? [];
    for (const ref of refs) {
        clearTimeout(ref);
    }
    timers.delete(sessionId);
}
