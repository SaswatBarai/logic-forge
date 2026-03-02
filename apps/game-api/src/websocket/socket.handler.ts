import { Server as SocketServer, Socket } from "socket.io";
import { logger } from "../app";
import { SessionService } from "../services/session.service";
import { MatchmakerService } from "../services/matchmaker.service";
import { RoundService } from "../services/round.service";

export function registerSocketHandlers(
    io: SocketServer,
    sessionService: SessionService,
    matchmakerService: MatchmakerService,
    roundService: RoundService
) {
    io.on("connection", (socket: Socket) => {
        logger.info({ socketId: socket.id }, "Client connected");

        // ─── IDENTIFY ───────────────────────────────────────────────────
        socket.on("IDENTIFY", async ({ userId }: { userId: string }) => {
            try {
                // Map userId → socketId in Redis so matchmaker can reach them
                await sessionService.registerSocket(userId, socket.id);
                socket.data.userId = userId;

                logger.info({ userId, socketId: socket.id }, "Identified");

                // Re-deliver any pending MATCHED event after reconnect
                const pendingSessionId = await sessionService.getPendingMatch(userId);
                if (pendingSessionId) {
                    const session = await sessionService.getSession(pendingSessionId);
                    if (session) {
                        socket.emit("MATCHED", {
                            status: "MATCHED",
                            sessionId: pendingSessionId,
                        });
                        logger.info(
                            { userId, pendingSessionId },
                            "Re-delivered MATCHED after reconnect"
                        );
                    }
                }

                socket.emit("IDENTIFIED");
            } catch (err) {
                logger.error({ err }, "Error in IDENTIFY handler");
            }
        });

        // ─── JOIN_SESSION ────────────────────────────────────────────────
        socket.on(
            "JOIN_SESSION",
            async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
                try {
                    const session = await sessionService.getSession(sessionId);

                    if (!session) {
                        socket.emit("SESSION_ERROR", {
                            message: "Session not found or expired. Please re-queue.",
                        });
                        logger.warn({ userId, sessionId }, "JOIN_SESSION: session not found");
                        return;
                    }

                    // Join the socket room
                    await socket.join(sessionId);
                    socket.data.sessionId = sessionId;
                    socket.data.userId = userId;

                    // Mark this player as joined in Redis
                    const joinedCount = await sessionService.markPlayerJoined(sessionId, userId);

                    const { players } = await sessionService.serialize(session);
                    // ✅ Ack THIS player immediately — don't wait for both
                    socket.emit("SESSION_JOINED", {
                        sessionId,
                        status: session.status,
                        config: session.config,
                        players,
                    });

                    // Clear pending match key
                    await sessionService.clearPendingMatch(userId);

                    logger.info({ userId, sessionId, status: session.status }, "Joined session");

                    // ✅ If ALL players have joined — start round 1
                    if (joinedCount >= session.players.length) {
                        logger.info({ sessionId }, "All players joined — starting round 1");
                        await roundService.startRound(io, sessionId, 1);
                    }
                } catch (err) {
                    logger.error({ err, userId, sessionId }, "Error in JOIN_SESSION handler");
                    socket.emit("SESSION_ERROR", { message: "Failed to join session." });
                }
            }
        );

        // ─── PLAYER_READY (Lobby Ready Up) ──────────────────────────────
        socket.on("PLAYER_READY", async ({ sessionId, userId }: { sessionId: string; userId: string }) => {
            try {
                const readyCount = await sessionService.markPlayerReady(sessionId, userId);
                const session = await sessionService.getSession(sessionId);

                if (!session) return;

                // Broadcast ready state to both players in room
                io.to(sessionId).emit("PLAYER_READY_ACK", { userId, readyCount });

                logger.info({ userId, sessionId, readyCount }, "Player ready");

                if (readyCount >= session.players.length) {
                    logger.info({ sessionId }, "All players ready — starting round 1");
                    await roundService.startRound(io, sessionId, 1);
                }
            } catch (err) {
                logger.error({ err }, "Error in PLAYER_READY handler");
            }
        });

        // ─── SUBMIT_ANSWER ───────────────────────────────────────────────
        socket.on(
            "SUBMIT_ANSWER",
            async ({
                sessionId,
                userId,
                answer,
                roundNumber,
            }: {
                sessionId: string;
                userId: string;
                answer: string;
                roundNumber: number;
            }) => {
                try {
                    await roundService.handleSubmission(io, sessionId, userId, answer, roundNumber);
                } catch (err) {
                    logger.error({ err }, "Error in SUBMIT_ANSWER handler");
                }
            }
        );

        // ─── DISCONNECT ──────────────────────────────────────────────────
        socket.on("disconnect", async (reason: string) => {
            const { userId, sessionId } = socket.data;

            logger.info({ userId, sessionId, reason }, "Client disconnected");

            if (userId) {
                matchmakerService.cancelQueue(userId);
                await sessionService.unregisterSocket(userId);
            }
        });
    });
}
