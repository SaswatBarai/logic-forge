import { getRedisClient } from "@logicforge/config";
import { logger } from "../app";
import type { BlitzSessionConfig } from "@logicforge/types";

const SESSION_TTL = 3600; // 1 hour

export type SessionStatus = "LOBBY" | "ACTIVE" | "COMPLETED" | "ABORTED";

export interface BlitzSession {
    sessionId: string;
    config: BlitzSessionConfig;
    players: string[];
    status: SessionStatus;
    currentRound: number;
    createdAt: number;
}

export class SessionService {
    async createSession(
        sessionId: string,
        config: BlitzSessionConfig,
        players: string[]
    ): Promise<BlitzSession> {
        const redis = await getRedisClient();
        const session: BlitzSession = {
            sessionId,
            config,
            players,
            status: "LOBBY",
            currentRound: 0,
            createdAt: Date.now(),
        };
        await redis.setEx(`session:${sessionId}`, SESSION_TTL, JSON.stringify(session));
        const playerdata: Record<string, { score: number; roundScores: number[]; livesRemaining: number }> = {};
        for (const userId of players) {
            playerdata[userId] = {
                score: 0,
                roundScores: [],
                livesRemaining: config.livesEnabled ? config.lives : 0,
            };
            await redis.setEx(`pending:match:${userId}`, 120, sessionId);
        }
        await redis.setEx(`session:${sessionId}:playerdata`, SESSION_TTL, JSON.stringify(playerdata));
        logger.info({ sessionId, playerCount: players.length }, "Session created");
        return session;
    }

    async getSession(sessionId: string): Promise<BlitzSession | null> {
        const redis = await getRedisClient();
        const raw = await redis.get(`session:${sessionId}`);
        return raw ? (JSON.parse(raw) as BlitzSession) : null;
    }

    async updateSession(sessionId: string, update: Partial<BlitzSession>): Promise<void> {
        const session = await this.getSession(sessionId);
        if (!session) return;
        const redis = await getRedisClient();
        const updated = { ...session, ...update };
        await redis.setEx(`session:${sessionId}`, SESSION_TTL, JSON.stringify(updated));
    }

    async registerSocket(userId: string, socketId: string): Promise<void> {
        const redis = await getRedisClient();
        await redis.setEx(`socket:${userId}`, 3600, socketId);
    }

    async unregisterSocket(userId: string): Promise<void> {
        const redis = await getRedisClient();
        await redis.del(`socket:${userId}`);
    }

    async getSocketId(userId: string): Promise<string | null> {
        const redis = await getRedisClient();
        return redis.get(`socket:${userId}`);
    }

    async markPlayerJoined(sessionId: string, userId: string): Promise<number> {
        const redis = await getRedisClient();
        const key = `session:${sessionId}:joined`;
        await redis.sAdd(key, userId);
        await redis.expire(key, SESSION_TTL);
        return redis.sCard(key);
    }

    async getJoinedCount(sessionId: string): Promise<number> {
        const redis = await getRedisClient();
        return redis.sCard(`session:${sessionId}:joined`);
    }

    async markPlayerReady(sessionId: string, userId: string): Promise<number> {
        const redis = await getRedisClient();
        const key = `session:${sessionId}:ready`;
        await redis.sAdd(key, userId);
        await redis.expire(key, SESSION_TTL);
        return redis.sCard(key);
    }

    async getReadyCount(sessionId: string): Promise<number> {
        const redis = await getRedisClient();
        return redis.sCard(`session:${sessionId}:ready`);
    }

    async getPendingMatch(userId: string): Promise<string | null> {
        const redis = await getRedisClient();
        return redis.get(`pending:match:${userId}`);
    }

    async clearPendingMatch(userId: string): Promise<void> {
        const redis = await getRedisClient();
        await redis.del(`pending:match:${userId}`);
    }

    async recordRoundScore(sessionId: string, userId: string, points: number): Promise<void> {
        const redis = await getRedisClient();
        const raw = await redis.get(`session:${sessionId}:playerdata`);
        if (!raw) return;
        const playerdata = JSON.parse(raw) as Record<string, { score: number; roundScores: number[]; livesRemaining: number }>;
        const p = playerdata[userId];
        if (p) {
            p.score += points;
            p.roundScores.push(points);
            await redis.setEx(`session:${sessionId}:playerdata`, SESSION_TTL, JSON.stringify(playerdata));
        }
    }

    async deductLife(sessionId: string, userId: string): Promise<void> {
        const redis = await getRedisClient();
        const raw = await redis.get(`session:${sessionId}:playerdata`);
        if (!raw) return;
        const playerdata = JSON.parse(raw) as Record<string, { score: number; roundScores: number[]; livesRemaining: number }>;
        const p = playerdata[userId];
        if (p && p.livesRemaining > 0) {
            p.livesRemaining--;
            await redis.setEx(`session:${sessionId}:playerdata`, SESSION_TTL, JSON.stringify(playerdata));
        }
    }

    /** Returns session with players array for round/result payloads */
    async serialize(session: BlitzSession): Promise<{ players: Array<{ userId: string; score: number; roundScores: number[]; livesRemaining: number }> }> {
        const redis = await getRedisClient();
        const raw = await redis.get(`session:${session.sessionId}:playerdata`);
        const playerdata = raw
            ? (JSON.parse(raw) as Record<string, { score: number; roundScores: number[]; livesRemaining: number }>)
            : {};
        const players = session.players.map((userId) => {
            const p = playerdata[userId] ?? { score: 0, roundScores: [], livesRemaining: session.config.livesEnabled ? session.config.lives : 0 };
            return { userId, ...p };
        });
        return { players };
    }
}
