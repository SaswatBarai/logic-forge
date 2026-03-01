import { GameSocket, sessionRooms, broadcastToSession, sendError } from "./socket.manager";
import { WsClientMessage, PongPayload, SessionJoinedPayload } from "@logicforge/types";
import { logger } from "../app";
import { joinSession, recordSubmission, forfeitSession } from "../services/session.service";

/**
 * Validates and routes typed incoming WS messages to session logic
 */
export async function handleClientMessage(socket: GameSocket, message: WsClientMessage) {
    switch (message.type) {
        case "JOIN_SESSION":
            await handleJoinSession(socket, message.sessionId, message.token);
            break;

        case "READY":
            // Currently, just acknowledge or track readiness. The game starts when joined or 
            // when both default to ready in dual match.
            break;

        case "SUBMIT_ANSWER":
            if (!socket.sessionId) {
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

        case "LEAVE_SESSION":
            handleDisconnect(socket);
            break;
    }
}

/**
 * Handle a client leaving (disconnect or explicit LEAVE_SESSION)
 */
export function handleDisconnect(socket: GameSocket) {
    if (socket.sessionId) {
        const room = sessionRooms.get(socket.sessionId);
        if (room) {
            room.delete(socket);
            if (room.size === 0) {
                sessionRooms.delete(socket.sessionId);
            }
        }

        // In dual format, or generally, handle forfeit if active
        forfeitSession(socket.sessionId, socket.userId).catch(err => {
            logger.error({ err, sessionId: socket.sessionId }, "Failed to process forfeit on disconnect");
        });

        socket.sessionId = undefined;
        socket.userId = undefined;
    }
}

/**
 * Business logic mappings for WS inputs
 */
async function handleJoinSession(socket: GameSocket, sessionId: string, token: string) {
    try {
        // 1. Verify token / permissions (stubbed as accepting all for dev)
        const userId = "stub-user-id";

        // 2. Perform DB/Redis joined session logic
        const sessionState = await joinSession(sessionId, userId);

        // 3. Register socket into the room
        socket.sessionId = sessionId;
        socket.userId = userId;

        if (!sessionRooms.has(sessionId)) {
            sessionRooms.set(sessionId, new Set());
        }
        sessionRooms.get(sessionId)!.add(socket);

        // 4. Send acknowledgment back to client
        const response: SessionJoinedPayload = {
            type: "SESSION_JOINED",
            sessionId: sessionId,
            currentRound: sessionState.currentRound,
            maxRounds: sessionState.maxRounds,
            status: sessionState.status
        };

        socket.send(JSON.stringify(response));
        logger.debug({ sessionId, socketId: socket.id }, "Client joined session");

    } catch (err: any) {
        logger.warn({ err, sessionId }, "Failed to join session");
        sendError(socket, "FORBIDDEN", err.message || "Failed to join session");
    }
}

async function handleSubmitAnswer(socket: GameSocket, message: any) {
    const { sessionId, roundNumber, code } = message;
    try {
        const result = await recordSubmission(sessionId, roundNumber, socket.userId as string, code);

        // The recordSubmission logic will handle broadcasting ROUND_RESULT to the user,
        // and potentially OPPONENT_SUBMITTED to the other user if Dual Mode.

    } catch (err: any) {
        sendError(socket, "INTERNAL_ERROR", "Submission failed to process");
    }
}
