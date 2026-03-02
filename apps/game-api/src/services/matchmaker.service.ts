import { randomUUID } from "crypto";
import type { Server as SocketServer } from "socket.io";
import { logger } from "../app";
import {
    CreateSessionPayload,
    WaitingRoomEntry,
    BlitzSessionConfig,
    LIVE_MODE_INITIAL_LIVES,
    TOTAL_ROUNDS,
    TimerCategory,
} from "@logicforge/types";
import { SessionService } from "./session.service";

const dualWaitingRoom = new Map<string, WaitingRoomEntry>();
const QUEUE_TTL_MS = 60_000;

function buildWaitingRoomKey(payload: CreateSessionPayload): string {
    const categorySegment =
        payload.sessionType === "TIMER" ? payload.category! : "LIVE";
    return `${payload.sessionType}:${categorySegment}`;
}

function buildBlitzConfig(payload: CreateSessionPayload): BlitzSessionConfig {
    const isLive = payload.sessionType === "LIVE";
    return {
        playerFormat: payload.playerFormat,
        sessionType: payload.sessionType,
        category: isLive ? null : (payload.category as TimerCategory),
        livesEnabled: isLive,
        lives: isLive
            ? Number(process.env.LIVE_MODE_LIVES) || LIVE_MODE_INITIAL_LIVES
            : 0,
        totalRounds: TOTAL_ROUNDS,
    };
}

export type MatchResult =
    | { status: "QUEUED"; queueKey: string }
    | { status: "MATCHED"; sessionId: string };

export class MatchmakerService {
    constructor(
        private readonly sessionService: SessionService,
        private readonly io: SocketServer   // ✅ was missing — io was silently dropped before
    ) { }

    async findOrCreateSession(
        payload: CreateSessionPayload
    ): Promise<MatchResult> {
        if (payload.sessionType === "TIMER" && !payload.category) {
            throw new Error("Timer Mode requires a category.");
        }
        if (payload.playerFormat === "SINGLE") {
            return this.createSinglePlayerSession(payload);
        }
        return this.matchDualPlayer(payload);
    }

    private async createSinglePlayerSession(
        payload: CreateSessionPayload
    ): Promise<MatchResult> {
        const config = buildBlitzConfig(payload);
        const sessionId = randomUUID();
        await this.sessionService.createSession(sessionId, config, [
            payload.userId,
        ]);
        logger.info(
            { sessionId, userId: payload.userId },
            "Single player session created"
        );
        return { status: "MATCHED", sessionId };
    }

    private async matchDualPlayer(
        payload: CreateSessionPayload
    ): Promise<MatchResult> {
        const key = buildWaitingRoomKey(payload);
        const now = Date.now();

        // Evict stale entry
        const existing = dualWaitingRoom.get(key);
        if (existing && now - existing.queuedAt > QUEUE_TTL_MS) {
            logger.warn(
                { key, staleUserId: existing.userId },
                "Evicting stale queue entry"
            );
            dualWaitingRoom.delete(key);
        }

        const opponent = dualWaitingRoom.get(key);

        if (opponent && opponent.userId !== payload.userId) {
            // ── MATCH FOUND ──────────────────────────────────────────────
            dualWaitingRoom.delete(key);

            const config = buildBlitzConfig(payload);
            const sessionId = randomUUID();
            await this.sessionService.createSession(sessionId, config, [
                opponent.userId,
                payload.userId,
            ]);

            logger.info(
                { sessionId, players: [opponent.userId, payload.userId] },
                "Dual session matched"
            );

            // Notify the WAITING (first) player via socket — use socketId from queue if stored
            // (fixes multi-tab: last IDENTIFY overwrites Redis, so we use the tab that queued)
            const opponentEntry = opponent as WaitingRoomEntry & { socketId?: string };
            let opponentSocketId =
                opponentEntry.socketId ??
                (await this.sessionService.getSocketId(opponent.userId));

            // Retry up to 3 times × 250ms to handle reconnect / gateway timing
            if (!opponentSocketId) {
                for (let attempt = 1; attempt <= 3 && !opponentSocketId; attempt++) {
                    await new Promise((r) => setTimeout(r, 250));
                    opponentSocketId = await this.sessionService.getSocketId(opponent.userId);
                    if (!opponentSocketId) {
                        logger.warn(
                            { userId: opponent.userId, attempt },
                            "Waiting player socket not found — retrying…"
                        );
                    }
                }
            }

            if (opponentSocketId) {
                this.io.to(opponentSocketId).emit("MATCHED", {
                    status: "MATCHED",
                    sessionId,
                });
                logger.info(
                    { userId: opponent.userId, sessionId },
                    "Emitted MATCHED to waiting player via socket"
                );
            } else {
                // Socket not found even after retries.
                // `pending:match:userId` was already written by createSession, so P1
                // will receive MATCHED on their next IDENTIFY (e.g. page refresh / reconnect).
                logger.warn(
                    { userId: opponent.userId, sessionId },
                    "Waiting player socket still not found after retries — relying on pending:match Redis key for delivery"
                );
            }

            // Player 2 gets MATCHED via HTTP response (handled by route)
            return { status: "MATCHED", sessionId };
        }

        // Same user already in queue (e.g. two tabs) — overwrite so they don't match themselves
        if (existing?.userId === payload.userId) {
            logger.info({ key, userId: payload.userId }, "Same user re-queued; use two browsers/accounts for 1v1");
        }

        const payloadWithSocket = payload as CreateSessionPayload & { socketId?: string };
        const entry: WaitingRoomEntry & { socketId?: string } = {
            userId: payload.userId,
            payload,
            queuedAt: now,
        };
        if (typeof payloadWithSocket.socketId === "string") {
            entry.socketId = payloadWithSocket.socketId;
        }
        dualWaitingRoom.set(key, entry);
        logger.info({ key, userId: payload.userId }, "Player queued for Dual Mode");
        return { status: "QUEUED", queueKey: key };
    }

    cancelQueue(userId: string): void {
        for (const [key, entry] of dualWaitingRoom.entries()) {
            if (entry.userId === userId) {
                dualWaitingRoom.delete(key);
                logger.info({ key, userId }, "Queue entry cancelled");
                return;
            }
        }
    }
}
