import { getRedisClient } from "@logicforge/config";
import { db } from "@logicforge/db";
import { logger } from "../app";
import { GameMode, PlayerFormat } from "@logicforge/types";
import { broadcastToSession } from "../websocket/socket.manager";

// Redis key for matchmaking queues
const MATCHMAKER_QUEUE = "matchmaker:queue";

/**
 * Enqueue user and try to find a match.
 */
export async function findOrQueueMatch(userId: string) {
    const redis = await getRedisClient();

    // Try to pop an opponent
    const opponentId = await redis.sPop(MATCHMAKER_QUEUE);

    if (!opponentId) {
        // Nobody waiting, enqueue self
        logger.debug({ userId }, "No opponent found. Entering matchmaker queue.");
        await redis.sAdd(MATCHMAKER_QUEUE, userId);
        return { status: "QUEUED" };
    }

    if (opponentId === userId) {
        // Safeguard
        await redis.sAdd(MATCHMAKER_QUEUE, userId);
        return { status: "QUEUED" };
    }

    // Found match! Create the session
    logger.info({ p1: userId, p2: opponentId }, "Match found. Creating DualMatch.");

    try {
        const dualMatch = await db.dualMatch.create({
            data: {
                player1Id: userId,
                player2Id: opponentId,
                status: "MATCHED"
            }
        });

        const session = await db.gameSession.create({
            data: {
                userId,
                mode: "ARCADE", // Dual maps to Arcade but DUAL format
                playerFormat: "DUAL",
                status: "LOBBY",
                // We link via the relations from dualMatch, or simplify the model structure.
                // For now, return the Match ID and both enter a shared WebSocket Lobby
            }
        });

        // They join the single GameSession ID
        return {
            status: "MATCHED",
            sessionId: session.id,
            opponentId
        };

    } catch (err: any) {
        logger.error({ err, p1: userId, p2: opponentId }, "Failed to create match");
        // Rescue queue state by returning the opponent
        await redis.sAdd(MATCHMAKER_QUEUE, opponentId);
        return { status: "ERROR" };
    }
}

/**
 * Stop waiting if the user cancels or disconnects
 */
export async function dequeueMatch(userId: string) {
    const redis = await getRedisClient();
    await redis.sRem(MATCHMAKER_QUEUE, userId);
    logger.debug({ userId }, "Dequeued from matchmaker");
}
