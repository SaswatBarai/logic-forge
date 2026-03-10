// ─── Gateway — Proxy Middleware Factory ──────────────────────────────
import { type IncomingMessage, ServerResponse } from "http";
import type { Socket } from "net";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Options, RequestHandler } from "http-proxy-middleware";
import logger from "./logger.js";

export type GatewayProxy = RequestHandler<IncomingMessage, ServerResponse>;

/**
 * Creates a reverse-proxy middleware for the given upstream service.
 *
 * @param target    Full URL of the upstream service, e.g. "http://game-api:3001"
 * @param pathPrefix The /api/XXX prefix to strip before forwarding, e.g. "/api/game"
 * @param serviceName Human-readable name used in error logs, e.g. "game-api"
 */
function createProxy(
    target: string,
    pathPrefix: string,
    serviceName: string
): GatewayProxy {
    const options: Options<IncomingMessage, ServerResponse> = {
        target,
        changeOrigin: true,
        // Strip the gateway prefix so upstream sees its own paths
        pathRewrite: { [`^${pathPrefix}`]: "" },
        // WebSocket support (used by game-api)
        ws: true,
        on: {
            error(err: Error, _req: IncomingMessage, res: ServerResponse | Socket) {
                logger.error({ err, service: serviceName }, "Proxy error");
                // res is ServerResponse for HTTP errors, Socket for WS errors
                if (res instanceof ServerResponse && !res.headersSent) {
                    res.writeHead(502, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Bad Gateway" }));
                }
            },
        },
    };

    return createProxyMiddleware<IncomingMessage, ServerResponse>(options);
}

// ── Named proxy instances ─────────────────────────────────────────────

const GAME_API_URL =
    process.env.GAME_API_URL ?? "http://game-api:3001";
const QUESTION_ENGINE_URL =
    process.env.QUESTION_ENGINE_URL ?? "http://question-engine:3002";
const ANTI_CHEAT_URL =
    process.env.ANTI_CHEAT_URL ?? "http://anti-cheat:3003";
const CODE_RUNNER_URL =
    process.env.CODE_RUNNER_URL ?? "http://code-runner:3004";

export const gameProxy = createProxy(
    GAME_API_URL,
    "/api/game",
    "game-api"
);

export const questionsProxy = createProxy(
    QUESTION_ENGINE_URL,
    "/api/questions",
    "question-engine"
);

export const antiCheatProxy = createProxy(
    ANTI_CHEAT_URL,
    "/api/anticheat",
    "anti-cheat"
);

export const codeRunnerProxy = createProxy(
    CODE_RUNNER_URL,
    "/api/run",
    "code-runner"
);
