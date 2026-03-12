// ─── Gateway — JWT Auth Middleware ───────────────────────────────────
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../logger.js";

// Augment Express Request to carry userId set by auth middleware
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "";

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Skip JWT validation for public routes:
    // - Health check (not under /api, but defensive check)
    // - NextAuth callbacks under /api/auth/*
    // - Socket.io handshake/polling under /api/game/socket.io (client sends IDENTIFY after connect)
    const originalUrl = req.originalUrl ?? req.url ?? "";
    if (
        req.path === "/health" ||
        originalUrl.startsWith("/api/auth/") ||
        originalUrl.startsWith("/api/game/socket.io")
    ) {
        next();
        return;
    }

    // 1. Try Authorization: Bearer <token>
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
    }

    // 2. Fallback: next-auth session cookie (dev vs production name)
    if (!token) {
        const cookies = req.cookies as Record<string, string | undefined>;
        token =
            cookies["next-auth.session-token"] ??
            cookies["__Secure-next-auth.session-token"];
    }

    if (!token) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        req.userId = payload.sub;
        next();
    } catch (err) {
        logger.warn({ err }, "JWT verification failed");
        res.status(401).json({ error: "Unauthorized" });
    }
}
