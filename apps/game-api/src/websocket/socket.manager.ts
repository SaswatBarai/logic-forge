import { WebSocket, WebSocketServer } from "ws";
import { logger } from "../app";
import { WsClientMessageSchema, WsErrorPayload } from "@logicforge/types";
import { handleClientMessage, handleDisconnect } from "./socket.handler";
import crypto from "crypto";

// Extend WebSocket to hold local session/user info
export interface GameSocket extends WebSocket {
    id: string; // Unique socket ID for tracking
    sessionId?: string; // Bound game session
    userId?: string; // Bound user
    isAlive: boolean; // For ping/pong keepalive
    _missedPongs?: number; // Consecutive missed pongs (grace before closing)
}

// In-memory mapping of active connected clients
// For a scaled production environment, you'd use Redis Pub/Sub directly,
// but for this phase we keep an in-memory map of sessionId -> GameSocket[]
export const sessionRooms = new Map<string, Set<GameSocket>>();

// Pre-session mapping: userId -> GameSocket (for notifying queued players of MATCH_FOUND)
export const userSockets = new Map<string, GameSocket>();

export function setupWebSocketServer(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
        const socket = ws as GameSocket;
        socket.id = crypto.randomUUID();
        socket.isAlive = true;
        socket._missedPongs = 0;

        logger.debug({ socketId: socket.id }, "New WebSocket connection established");

        socket.on("message", async (data: Buffer | string) => {
            try {
                const payload = JSON.parse(data.toString());

                // Use Zod to validate the incoming shape explicitly against ALL defined WS schemas
                const result = WsClientMessageSchema.safeParse(payload);

                if (!result.success) {
                    sendError(socket, "VALIDATION_ERROR", "Invalid message payload structure");
                    return;
                }

                // Handle parsed valid message
                await handleClientMessage(socket, result.data);
            } catch (err: any) {
                if (err instanceof SyntaxError) {
                    sendError(socket, "VALIDATION_ERROR", "Invalid JSON");
                } else {
                    logger.error({ err, socketId: socket.id }, "Error processing WS message");
                }
            }
        });

        socket.on("pong", () => {
            socket.isAlive = true;
            socket._missedPongs = 0;
        });

        socket.on("close", () => {
            logger.debug({ socketId: socket.id }, "WebSocket disconnected");
            handleDisconnect(socket);
        });

        socket.on("error", (err) => {
            logger.error({ err, socketId: socket.id }, "WebSocket error");
        });
    });

    // Heartbeat: ping clients; close only after 2 consecutive missed pongs (grace for background tabs)
    const HEARTBEAT_INTERVAL_MS = 30000;
    const MISSED_PONGS_BEFORE_CLOSE = 2;

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const socket = ws as GameSocket;
            if (socket.isAlive === false) {
                socket._missedPongs = (socket._missedPongs ?? 0) + 1;
                if (socket._missedPongs >= MISSED_PONGS_BEFORE_CLOSE) {
                    handleDisconnect(socket);
                    socket.close(1000, "Heartbeat timeout");
                    return;
                }
            } else {
                socket._missedPongs = 0;
            }

            socket.isAlive = false;
            socket.ping();
        });
    }, HEARTBEAT_INTERVAL_MS);

    wss.on("close", () => {
        clearInterval(interval);
    });
}

// Helper: send a structured error back to the client
export function sendError(ws: WebSocket, code: string, message: string) {
    if (ws.readyState !== WebSocket.OPEN) return;
    const payload: WsErrorPayload = {
        type: "ERROR",
        code,
        message,
    };
    ws.send(JSON.stringify(payload));
}

// Helper: Broadcast a message to all sockets in a specific game session
export function broadcastToSession(sessionId: string, message: any, excludeSocketId?: string) {
    const room = sessionRooms.get(sessionId);
    if (!room) return;

    const data = JSON.stringify(message);
    for (const client of room) {
        if (client.readyState === WebSocket.OPEN && client.id !== excludeSocketId) {
            client.send(data);
        }
    }
}
