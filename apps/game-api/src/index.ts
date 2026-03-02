import http from "http";
import { Server } from "socket.io";
import { app, logger, config } from "./app";
import { SessionService } from "./services/session.service";
import { RoundService } from "./services/round.service";
import { MatchmakerService } from "./services/matchmaker.service";
import { registerSocketHandlers } from "./websocket/socket.handler";

const port = config.ports.gameApi;

// ── Services ───────────────────────────────────────────────────────────────
const sessionService = new SessionService();
const roundService = new RoundService(sessionService);

// ── HTTP + Socket.IO ──────────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.WEB_URL ?? "http://localhost:3000",
        methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
});

const matchmakerService = new MatchmakerService(sessionService, io);
registerSocketHandlers(io, sessionService, matchmakerService, roundService);

// Inject singletons into Express for use in routes
app.set("matchmakerService", matchmakerService);

server.listen(port, () => {
    logger.info(`Game API running on port ${port} [${config.env}]`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────
const shutdown = () => {
    logger.info("Shutting down...");
    io.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);
