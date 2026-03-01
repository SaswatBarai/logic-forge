import { getRedisClient } from "@logicforge/config";
import { db } from "@logicforge/db";
import { logger } from "../app";
import { SessionStatus } from "@logicforge/types";

// The heart of Session Orchestration — mostly Redis for speed

/**
 * Joins a user into a game session. 
 * Initializes Redis state if it's the first time joining.
 */
export async function joinSession(sessionId: string, userId: string) {
    const redis = await getRedisClient();
    const cacheKey = `session:${sessionId}`;

    // 1. Check if session lives in Redis
    let stateStr = await redis.get(cacheKey);

    if (!stateStr) {
        // 2. Hydrate from DB if not in Redis
        const sessionDoc = await db.gameSession.findUnique({
            where: { id: sessionId },
            include: { rounds: true }
        });

        if (!sessionDoc) {
            throw new Error(`Session ${sessionId} not found in DB`);
        }

        if (sessionDoc.status === "COMPLETED" || sessionDoc.status === "ABANDONED") {
            throw new Error(`Session is already ${sessionDoc.status}`);
        }

        // 3. Setup fresh cache state
        const initialState = {
            id: sessionDoc.id,
            mode: sessionDoc.mode,
            status: sessionDoc.status,
            currentRound: sessionDoc.currentRound,
            maxRounds: sessionDoc.maxRounds,
            startedAt: sessionDoc.startedAt,
            // We will track round timing here in real-time
            roundStartTime: null,
            roundTimeLimit: 60000 // default
        };

        await redis.set(cacheKey, JSON.stringify(initialState));
        // Expire idle sessions in cache after 1 hour mapped back to DB
        await redis.expire(cacheKey, 3600);

        return initialState;
    }

    return JSON.parse(stateStr);
}

/**
 * Handles incoming code submissions via WS
 * Invokes Question Engine validate HTTP endpoint and then pushes to Code Runner HTTP
 */
export async function recordSubmission(sessionId: string, roundNumber: number, userId: string, code: string) {
    logger.info({ sessionId, roundNumber }, "Received code submission");

    const redis = await getRedisClient();
    const cacheKey = `session:${sessionId}`;

    // Actually processing this relies on Question Engine + Code Execution API.
    // For Phase 3 scope, we define the signature and stub it.

    return {
        verdict: "PENDING",    // Until execution returns
        score: 0
    };
}

/**
 * Explicit forfeit or timeout handling when disconnected
 */
export async function forfeitSession(sessionId: string, userId: string | undefined) {
    if (!userId) return;

    // In strictly 1v1 Dual Mode, a disconnect might trigger an instant forfeit.
    // In Arcade, it just marks the session Abandoned.
    logger.debug({ sessionId, userId }, "Forfeiting session due to LEAVE/Disconnect");

    await db.gameSession.update({
        where: { id: sessionId },
        data: {
            status: "ABANDONED",
            endedAt: new Date()
        }
    });

    const redis = await getRedisClient();
    await redis.del(`session:${sessionId}`);
}
