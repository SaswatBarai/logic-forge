import { getRedisClient } from "@logicforge/config";
import { db } from "@logicforge/db";
import { logger } from "../app";
import { GameMode, PlayerFormat, MatchFoundPayload } from "@logicforge/types";
import { broadcastToSession, userSockets } from "../websocket/socket.manager";
import { WebSocket } from "ws";

// Redis key for matchmaking queues
const MATCHMAKER_QUEUE = "matchmaker:queue";

/**
 * Enqueue user and try to find a match.
 */
export async function findOrQueueMatch(userId: string) {
    const redis = await getRedisClient();

    // Try to pop an opponent (sPop returns string | string[] | null depending on overload)
    const popped = await redis.sPop(MATCHMAKER_QUEUE);
    const opponentId = Array.isArray(popped) ? popped[0] ?? null : popped;

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
        // Create a shared GameSession for both players
        const session = await db.gameSession.create({
            data: {
                userId,
                mode: "ARCADE",
                playerFormat: "DUAL",
                status: "LOBBY",
            }
        });

        // Create DualMatch linking two GameSession references
        // player1 and player2 point to GameSession IDs, so we create
        // lightweight per-player sessions to satisfy FK constraints
        const p1Session = await db.gameSession.create({
            data: {
                userId: opponentId,
                mode: "ARCADE",
                playerFormat: "DUAL",
                status: "LOBBY",
            }
        });

        await db.dualMatch.create({
            data: {
                player1Id: p1Session.id,
                player2Id: session.id,
                status: "MATCHED",
            }
        });

        // Notify the queued player (opponentId) via WebSocket about the match
        const opponentSocket = userSockets.get(opponentId);
        if (opponentSocket && opponentSocket.readyState === WebSocket.OPEN) {
            const matchMsg: MatchFoundPayload = {
                type: "MATCH_FOUND",
                opponentId: userId,
                sessionId: session.id,
            };
            opponentSocket.send(JSON.stringify(matchMsg));
            logger.info({ opponentId, sessionId: session.id }, "Sent MATCH_FOUND to queued player");
        } else {
            logger.warn({ opponentId }, "Queued player has no active WebSocket — cannot notify");
        }

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
