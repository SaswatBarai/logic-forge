import { GameSocket, sessionRooms, userSockets, broadcastToSession, sendError } from "./socket.manager";
import { WsClientMessage, PongPayload, SessionJoinedPayload, OpponentSubmittedPayload } from "@logicforge/types";
import { logger } from "../app";
import { joinSession, recordSubmission, forfeitSession } from "../services/session.service";
import { startRound, endRound } from "../services/round.service";

// Track per-session ready state for dual mode (sessionId → Set of userId)
const readyPlayers = new Map<string, Set<string>>();

/**
 * Validates and routes typed incoming WS messages to session logic
 */
export async function handleClientMessage(socket: GameSocket, message: WsClientMessage) {
    switch (message.type) {
        case "JOIN_SESSION":
            await handleJoinSession(socket, message.sessionId, message.token);
            break;

        case "READY":
            if (!socket.sessionId || !socket.userId) {
                return sendError(socket, "UNAUTHORIZED", "Must join a session first");
            }
            await handleReady(socket, message.sessionId);
            break;

        case "SUBMIT_ANSWER":
            if (!socket.sessionId || !socket.userId) {
                return sendError(socket, "UNAUTHORIZED", "Must join a session first");
            }
            await handleSubmitAnswer(socket, message);
            break;

        case "PING":
            const pong: PongPayload = {
                type: "PONG",
                timestamp: message.timestamp,
                serverTimestamp: Date.now(),
            };
            socket.send(JSON.stringify(pong));
            break;

        case "IDENTIFY":
            // Register this socket under the user's ID for pre-session notifications
            socket.userId = message.userId;
            userSockets.set(message.userId, socket);
            logger.debug({ userId: message.userId, socketId: socket.id }, "Client identified");
            break;

        case "LEAVE_SESSION":
            handleDisconnect(socket);
            break;
    }
}

/**
 * Handle a client leaving (disconnect or explicit LEAVE_SESSION)
 */
export function handleDisconnect(socket: GameSocket) {
    // Clean up userSockets mapping
    if (socket.userId) {
        const mapped = userSockets.get(socket.userId);
        if (mapped === socket) {
            userSockets.delete(socket.userId);
        }
    }

    if (socket.sessionId) {
        const room = sessionRooms.get(socket.sessionId);
        if (room) {
            room.delete(socket);
            if (room.size === 0) {
                sessionRooms.delete(socket.sessionId);
            }
        }

        // Clean up ready-player tracking
        const ready = readyPlayers.get(socket.sessionId);
        if (ready && socket.userId) {
            ready.delete(socket.userId);
        }

        forfeitSession(socket.sessionId, socket.userId).catch((err) => {
            logger.error({ err, sessionId: socket.sessionId }, "Failed to process forfeit on disconnect");
        });

        socket.sessionId = undefined;
        socket.userId = undefined;
    }
}

// ---------------------------------------------------------------------------
// Private handlers
// ---------------------------------------------------------------------------

async function handleJoinSession(socket: GameSocket, sessionId: string, token: string) {
    try {
        // Use the userId set by IDENTIFY if available, otherwise generate a stub
        const userId = socket.userId || "stub-user-" + Math.random().toString(36).slice(2, 7);

        const sessionState = await joinSession(sessionId, userId);

        socket.sessionId = sessionId;
        socket.userId = userId;

        if (!sessionRooms.has(sessionId)) {
            sessionRooms.set(sessionId, new Set());
        }
        sessionRooms.get(sessionId)!.add(socket);

        const response: SessionJoinedPayload = {
            type: "SESSION_JOINED",
            sessionId,
            currentRound: sessionState.currentRound,
            maxRounds: sessionState.maxRounds,
            status: sessionState.status,
        };

        socket.send(JSON.stringify(response));
        logger.debug({ sessionId, userId }, "Client joined session");

        // In SINGLE player mode, auto-start round 1 immediately after join
        if (sessionState.mode === "ARCADE" && sessionRooms.get(sessionId)?.size === 1) {
            // Give client a moment to finish setup, then start
            setTimeout(() => {
                startRound(sessionId, 1).catch((err) =>
                    logger.error({ err, sessionId }, "Failed to auto-start round for SINGLE player")
                );
            }, 500);
        }

        // In DUAL mode: start when both players are in the room
        if (sessionRooms.get(sessionId)?.size === 2) {
            logger.info({ sessionId }, "Both players joined. Starting round 1.");
            setTimeout(() => {
                startRound(sessionId, 1).catch((err) =>
                    logger.error({ err, sessionId }, "Failed to start round for DUAL session")
                );
            }, 500);
        }

    } catch (err: any) {
        logger.warn({ err, sessionId }, "Failed to join session");
        sendError(socket, "FORBIDDEN", err.message || "Failed to join session");
    }
}

async function handleReady(socket: GameSocket, sessionId: string) {
    const userId = socket.userId!;
    if (!readyPlayers.has(sessionId)) {
        readyPlayers.set(sessionId, new Set());
    }
    readyPlayers.get(sessionId)!.add(userId);
    logger.debug({ sessionId, userId }, "Player sent READY");

    const room = sessionRooms.get(sessionId);
    const ready = readyPlayers.get(sessionId);

    // Dual mode: start when both players ready
    if (room && ready && room.size >= 2 && ready.size >= 2) {
        readyPlayers.delete(sessionId);
        logger.info({ sessionId }, "Both players ready — starting round 1");
        await startRound(sessionId, 1);
    }
}

async function handleSubmitAnswer(socket: GameSocket, message: any) {
    const { sessionId, roundNumber, code } = message;
    const userId = socket.userId as string;

    try {
        // 1. Process submission (QE fetch → Code Runner → DB persist)
        const result = await recordSubmission(sessionId, roundNumber, userId, code);

        // 2. Broadcast OPPONENT_SUBMITTED to the other players in the room (dual mode)
        const room = sessionRooms.get(sessionId);
        if (room) {
            const opponentPayload: OpponentSubmittedPayload = {
                type: "OPPONENT_SUBMITTED",
                roundNumber,
                opponentVerdict: result.verdict,
                opponentScore: result.score,
            };
            for (const peer of room) {
                if (peer !== socket && peer.readyState === 1 /* OPEN */) {
                    peer.send(JSON.stringify(opponentPayload));
                }
            }
        }

        // 3. End the round (broadcasts ROUND_RESULT + maybe SESSION_COMPLETE)
        await endRound(sessionId, roundNumber, {
            verdict: result.verdict,
            score: result.score,
            executionTimeMs: result.executionTimeMs,
        });

    } catch (err: any) {
        logger.error({ err, sessionId, roundNumber }, "Submission failed");
        sendError(socket, "INTERNAL_ERROR", "Submission failed to process");
    }
}
