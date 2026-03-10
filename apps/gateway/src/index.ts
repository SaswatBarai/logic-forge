// ─── Gateway — Entry Point ────────────────────────────────────────────
import * as http from "http";
import type { IncomingMessage } from "http";
import express from "express";
import type { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import logger from "./logger.js";
import { authMiddleware } from "./middleware/auth.js";
import { requestLogger } from "./middleware/logger.js";
import { generalRateLimit, codeRunnerRateLimit } from "./middleware/rate-limit.js";
import {
    gameProxy,
    questionsProxy,
    antiCheatProxy,
    codeRunnerProxy,
} from "./proxy.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";

// ── App setup ─────────────────────────────────────────────────────────
const app = express();

app.set("trust proxy", 1); // Needed for correct req.ip behind Docker

// Security headers
app.use(helmet());

// CORS — only allow requests from the web frontend
app.use(
    cors({
        origin: WEB_URL,
        credentials: true,
    })
);

// Cookie parsing (for next-auth.session-token)
app.use(cookieParser());

// ── Health check (no auth) ────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", ts: Date.now() });
});

// ── Auth + request logging applied to all /api/* routes ──────────────
app.use("/api", authMiddleware);
app.use("/api", requestLogger);

// ── Proxy routes ──────────────────────────────────────────────────────

// Game API — Socket.io + HTTP (WebSocket upgrade handled below)
app.use("/api/game", generalRateLimit, gameProxy);

// Question Engine
app.use("/api/questions", generalRateLimit, questionsProxy);

// Anti-cheat
app.use("/api/anticheat", generalRateLimit, antiCheatProxy);

// Code runner — stricter rate limit
app.use("/api/run", codeRunnerRateLimit, codeRunnerProxy);

// ── Global error handler (safety net — proxy errors are caught in
//    proxy.ts, but this ensures no Express unhandled error crashes us) ─
app.use(
    (
        err: Error,
        _req: express.Request,
        res: express.Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _next: express.NextFunction
    ) => {
        logger.error({ err }, "Unhandled gateway error");
        if (!res.headersSent) {
            res.status(502).json({ error: "Bad Gateway" });
        }
    }
);

// ── HTTP server + WebSocket upgrade (Socket.io passthrough) ──────────
const server = http.createServer(app);

// Forward WebSocket upgrade requests for /api/game/* to game-api
server.on("upgrade", (req: IncomingMessage, socket: import("stream").Duplex, head: Buffer) => {
    const url = req.url ?? "";
    if (url.startsWith("/api/game")) {
        // http-proxy-middleware v3 exposes upgrade() on the middleware object
        // Cast needed because the type incorrectly narrows the handler type
        (gameProxy as unknown as { upgrade: (req: http.IncomingMessage, socket: import("stream").Duplex, head: Buffer) => void }).upgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});

server.listen(PORT, () => {
    logger.info({ port: PORT }, "Gateway listening");
});

// ── Graceful shutdown ─────────────────────────────────────────────────
process.on("SIGTERM", () => {
    logger.info("SIGTERM received — shutting down gracefully");
    server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    logger.info("SIGINT received — shutting down gracefully");
    server.close(() => {
        process.exit(0);
    });
});
