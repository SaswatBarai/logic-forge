import { Server as SocketServer, Socket } from "socket.io";
import type { CreateSessionPayload } from "@logicforge/types";
import { logger } from "../app";
import { config } from "../app";
import { SessionService } from "../services/session.service";
import { MatchmakerService } from "../services/matchmaker.service";
import { RoundService } from "../services/round.service";

const TELEMETRY_EVENTS = [
  "PASTE_DETECTED",
  "FOCUS_LOST",
  "FOCUS_RESTORED",
  "KEYSTROKE_BURST",
  "MOUSE_INACTIVE",
  "SOLUTION_SUBMITTED",
  "FAST_SOLUTION",
] as const;

async function relayToAntiCheat(
  socket: Socket,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const sessionId =
    (payload.sessionId as string) ?? (socket.data?.sessionId as string);
  const candidateId =
    (payload.candidateId as string) ??
    (payload.userId as string) ??
    (socket.data?.userId as string);
  if (!sessionId || !candidateId) {
    logger.warn({ eventType, socketId: socket.id }, "Anti-cheat relay skipped: missing sessionId or candidateId");
    return;
  }
  const base = config.services.antiCheat;
  const url = `${base}/api/ingest`;
  const body = {
    sessionId,
    candidateId,
    eventType,
    timestamp: (payload.timestamp as string) ?? new Date().toISOString(),
    payload: payload.payload ?? undefined,
  };
  logger.info({ eventType, sessionId, candidateId, url }, "Relaying to anti-cheat");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error({ eventType, status: res.status, body: text }, "Anti-cheat ingest rejected");
    } else {
      const result = await res.json().catch(() => ({}));
      logger.info({ eventType, sessionId, riskScore: result?.riskScore, flagLevel: result?.flagLevel }, "Anti-cheat ingest OK");
    }
  } catch (err) {
    logger.error({ err, eventType, url }, "Anti-cheat relay network error — is the anti-cheat service running?");
  }
}

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
                await sessionService.registerSocket(userId, socket.id);
                socket.data.userId = userId;
                logger.info({ userId, socketId: socket.id }, "Identified");

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
        // ✅ Never starts a round here — PLAYER_READY is the only gate
        // ✅ Uses ack callback so client gets response reliably (event may not deliver in some setups)
        socket.on("JOIN_SESSION", async (
            { sessionId, userId }: { sessionId: string; userId: string },
            ack?: (response: { ok: true; payload: object } | { ok: false; error: string }) => void
        ) => {
            logger.info({ socketId: socket.id, userId, sessionId }, "JOIN_SESSION received");
            const sendError = (msg: string) => {
                socket.emit("SESSION_ERROR", { message: msg });
                ack?.({ ok: false, error: msg });
            };
            try {
                const session = await sessionService.getSession(sessionId);
                if (!session) {
                    logger.warn({ userId, sessionId }, "JOIN_SESSION: session not found");
                    sendError("Session not found or expired. Please re-queue.");
                    return;
                }
                if (!session.players.includes(userId)) {
                    logger.warn(
                        { userId, sessionId, sessionPlayers: session.players },
                        "JOIN_SESSION: userId not in session.players — allowing join"
                    );
                }
                await socket.join(sessionId);
                socket.data.sessionId = sessionId;
                socket.data.userId = userId;

                await sessionService.markPlayerJoined(sessionId, userId);
                const { players } = await sessionService.serialize(session);

                const payload = {
                    sessionId,
                    status: session.status,
                    config: session.config,
                    players,
                };
                socket.emit("SESSION_JOINED", payload);
                ack?.({ ok: true, payload });
                logger.info({ userId, sessionId, socketId: socket.id }, "SESSION_JOINED emitted");

                await sessionService.clearPendingMatch(userId);
                logger.info({ userId, sessionId, playerFormat: session.config.playerFormat }, "Joined session");
            } catch (err) {
                logger.error({ err, userId, sessionId }, "Error in JOIN_SESSION handler");
                sendError("Failed to join session.");
            }
        });

        // ─── PLAYER_READY ────────────────────────────────────────────────
        // ✅ Single player: fires automatically from client after 1.5s lobby display
        // ✅ Dual player:   fires when both players click "Ready Up"
        socket.on("PLAYER_READY", async ({
            sessionId,
            userId,
        }: { sessionId: string; userId: string }) => {
            logger.info({ socketId: socket.id, userId, sessionId }, "PLAYER_READY received");
            try {
                const session = await sessionService.getSession(sessionId);
                if (!session) return;

                const readyCount = await sessionService.markPlayerReady(sessionId, userId);

                io.to(sessionId).emit("PLAYER_READY_ACK", {
                    userId,
                    readyCount,
                    total: session.players.length,
                });

                logger.info(
                    { userId, sessionId, readyCount, total: session.players.length, playerFormat: session.config.playerFormat },
                    "Player ready"
                );

                if (readyCount >= session.players.length) {
                    logger.info({ sessionId }, "All players ready — starting round 1");
                    await roundService.startRound(io, sessionId, 1);
                }
            } catch (err) {
                logger.error({ err }, "Error in PLAYER_READY handler");
            }
        });

        // ─── TYPING_TELEMETRY ────────────────────────────────────────────
        // Client sends typing stats; server forwards to opponent(s) as OPPONENT_TELEMETRY
        socket.on("TYPING_TELEMETRY", async (payload: {
            sessionId: string;
            userId: string;
            charsTyped: number;
            wpm: number;
            codeLength: number;
            templateLength?: number;
        }) => {
            try {
                const { sessionId, userId, wpm, codeLength, templateLength } = payload;
                const session = await sessionService.getSession(sessionId);
                if (!session || session.players.length < 2) return;

                const progress = templateLength != null && templateLength > 0
                    ? Math.min(1, codeLength / templateLength)
                    : Math.min(1, codeLength / 500);

                const opponents = session.players.filter((uid) => uid !== userId);
                for (const opponentId of opponents) {
                    const socketId = await sessionService.getSocketId(opponentId);
                    if (socketId) {
                        io.to(socketId).emit("OPPONENT_TELEMETRY", {
                            fromUserId: userId,
                            wpm,
                            codeLength,
                            progress,
                            submitted: false,
                            verdict: null,
                        });
                    }
                }
            } catch (err) {
                logger.error({ err }, "Error in TYPING_TELEMETRY handler");
            }
        });

        // ─── SURVIVAL_REQUEUE ───────────────────────────────────────────
        // Winner continues: requeue for next match (SINGLE → new session, DUAL → back in queue)
        socket.on("SURVIVAL_REQUEUE", async (payload: CreateSessionPayload & { userId?: string }) => {
            try {
                const userId = payload.userId ?? socket.data.userId;
                if (!userId) {
                    socket.emit("SESSION_ERROR", { message: "SURVIVAL_REQUEUE requires userId" });
                    return;
                }
                const fullPayload: CreateSessionPayload = {
                    mode: "ARCADE",
                    playerFormat: payload.playerFormat,
                    sessionType: payload.sessionType,
                    category: payload.category ?? null,
                    userId,
                };
                const result = await matchmakerService.requeueForSurvival(userId, fullPayload, socket.id);
                if (result.status === "MATCHED") {
                    socket.emit("MATCHED", { status: "MATCHED", sessionId: result.sessionId });
                    logger.info({ userId, sessionId: result.sessionId }, "SURVIVAL_REQUEUE: MATCHED (single)");
                } else {
                    socket.emit("SURVIVAL_QUEUED", { queueKey: result.queueKey });
                    logger.info({ userId, queueKey: result.queueKey }, "SURVIVAL_REQUEUE: QUEUED (dual)");
                }
            } catch (err) {
                logger.error({ err }, "Error in SURVIVAL_REQUEUE handler");
                socket.emit("SESSION_ERROR", { message: "Failed to requeue for survival" });
            }
        });

        // ─── SUBMIT_ANSWER ───────────────────────────────────────────────
        socket.on("SUBMIT_ANSWER", async ({
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
        });

        // ─── Telemetry relay to anti-cheat ─────────────────────────────────
        for (const event of TELEMETRY_EVENTS) {
            socket.on(event, (payload: unknown) => {
                logger.info({ socketId: socket.id, event, userId: socket.data?.userId }, "Telemetry event received");
                relayToAntiCheat(socket, event, (payload as Record<string, unknown>) ?? {});
            });
        }

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
