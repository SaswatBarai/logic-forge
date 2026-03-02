import { Server as SocketServer, Socket } from "socket.io";
import { logger } from "../app";
import { SessionService }    from "../services/session.service";
import { MatchmakerService } from "../services/matchmaker.service";
import { RoundService }      from "../services/round.service";

export function registerSocketHandlers(
    io: SocketServer,
    sessionService:    SessionService,
    matchmakerService: MatchmakerService,
    roundService:      RoundService
) {
    io.on("connection", (socket: Socket) => {
        logger.info({ socketId: socket.id }, "Client connected");

        // ─── IDENTIFY ───────────────────────────────────────────────────
        socket.on("IDENTIFY", async ({ userId }: { userId: string }) => {
            try {
                await sessionService.registerSocket(userId, socket.id);
                socket.data.userId = userId;
                logger.info({ userId, socketId: socket.id }, "Identified");

                // Re-deliver pending MATCHED after reconnect
                const pendingSessionId = await sessionService.getPendingMatch(userId);
                if (pendingSessionId) {
                    const session = await sessionService.getSession(pendingSessionId);
                    if (session) {
                        socket.emit("MATCHED", { status: "MATCHED", sessionId: pendingSessionId });
                        logger.info({ userId, pendingSessionId }, "Re-delivered MATCHED after reconnect");
                    }
                }

                socket.emit("IDENTIFIED");
            } catch (err) {
                logger.error({ err }, "Error in IDENTIFY handler");
            }
        });

        // ─── JOIN_SESSION ────────────────────────────────────────────────
        socket.on("JOIN_SESSION", async ({
            sessionId,
            userId,
        }: { sessionId: string; userId: string }) => {
            try {
                const session = await sessionService.getSession(sessionId);

                if (!session) {
                    socket.emit("SESSION_ERROR", {
                        message: "Session not found or expired. Please re-queue.",
                    });
                    logger.warn({ userId, sessionId }, "JOIN_SESSION: session not found");
                    return;
                }

                await socket.join(sessionId);
                socket.data.sessionId = sessionId;
                socket.data.userId    = userId;

                const joinedCount = await sessionService.markPlayerJoined(sessionId, userId);
                const { players }  = await sessionService.serialize(session);

                // Ack this player immediately
                socket.emit("SESSION_JOINED", {
                    sessionId,
                    status:  session.status,
                    config:  session.config,
                    players,
                });

                await sessionService.clearPendingMatch(userId);

                logger.info({ userId, sessionId, joinedCount, playerFormat: session.config.playerFormat }, "Joined session");

                // ✅ SINGLE: start immediately when the one player joins
                // ✅ DUAL:   DO NOT start here — wait for both PLAYER_READY events
                if (
                    session.config.playerFormat === "SINGLE" &&
                    joinedCount >= session.players.length
                ) {
                    logger.info({ sessionId }, "Single player joined — starting round 1");
                    await roundService.startRound(io, sessionId, 1);
                }
            } catch (err) {
                logger.error({ err, userId, sessionId }, "Error in JOIN_SESSION handler");
                socket.emit("SESSION_ERROR", { message: "Failed to join session." });
            }
        });

        // ─── PLAYER_READY (Dual Mode lobby gate) ────────────────────────
        // Only used by DUAL sessions. Both players must emit this before
        // round 1 starts.
        socket.on("PLAYER_READY", async ({
            sessionId,
            userId,
        }: { sessionId: string; userId: string }) => {
            try {
                const session = await sessionService.getSession(sessionId);
                if (!session) return;

                // Guard: ignore PLAYER_READY for SINGLE sessions
                if (session.config.playerFormat === "SINGLE") {
                    logger.warn({ userId, sessionId }, "PLAYER_READY received for SINGLE session — ignored");
                    return;
                }

                const readyCount = await sessionService.markPlayerReady(sessionId, userId);

                // Broadcast ready state so both UIs can update
                io.to(sessionId).emit("PLAYER_READY_ACK", { userId, readyCount });

                logger.info({ userId, sessionId, readyCount, total: session.players.length }, "Player ready");

                // ✅ Start only when ALL players are ready
                if (readyCount >= session.players.length) {
                    logger.info({ sessionId }, "All players ready — starting round 1");
                    await roundService.startRound(io, sessionId, 1);
                }
            } catch (err) {
                logger.error({ err }, "Error in PLAYER_READY handler");
            }
        });

        // ─── SUBMIT_ANSWER ───────────────────────────────────────────────
        socket.on("SUBMIT_ANSWER", async ({
            sessionId,
            userId,
            answer,
            roundNumber,
        }: {
            sessionId:   string;
            userId:      string;
            answer:      string;
            roundNumber: number;
        }) => {
            try {
                await roundService.handleSubmission(io, sessionId, userId, answer, roundNumber);
            } catch (err) {
                logger.error({ err }, "Error in SUBMIT_ANSWER handler");
            }
        });

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
