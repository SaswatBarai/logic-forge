// ─── Gateway — Request Logger Middleware ─────────────────────────────
import type { Request, Response, NextFunction } from "express";
import logger from "../logger.js";

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const startMs = Date.now();

    res.on("finish", () => {
        const responseTimeMs = Date.now() - startMs;
        logger.info({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTimeMs,
            userId: req.userId,
        });
    });

    next();
}
