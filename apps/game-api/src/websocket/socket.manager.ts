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
}

// In-memory mapping of active connected clients
// For a scaled production environment, you'd use Redis Pub/Sub directly,
// but for this phase we keep an in-memory map of sessionId -> GameSocket[]
export const sessionRooms = new Map<string, Set<GameSocket>>();

export function setupWebSocketServer(wss: WebSocketServer) {
    wss.on("connection", (ws: WebSocket) => {
        const socket = ws as GameSocket;
        socket.id = crypto.randomUUID();
        socket.isAlive = true;

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
        });

        socket.on("close", () => {
            logger.debug({ socketId: socket.id }, "WebSocket disconnected");
            handleDisconnect(socket);
        });

        socket.on("error", (err) => {
            logger.error({ err, socketId: socket.id }, "WebSocket error");
        });
    });

    // Heartbeat interval to drop dead connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const socket = ws as GameSocket;
            if (socket.isAlive === false) {
                handleDisconnect(socket);
                return socket.terminate();
            }

            socket.isAlive = false;
            socket.ping();
        });
    }, 30000);

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
