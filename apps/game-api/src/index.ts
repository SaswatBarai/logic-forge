import http from "http";
import { app, logger, config } from "./app";
import { WebSocketServer } from "ws";
import { setupWebSocketServer } from "./websocket/socket.manager";

const port = config.ports.gameApi;

// Create HTTP server attaching the Express app
const server = http.createServer(app);

// Create WebSocket server explicitly bound to the HTTP server
const wss = new WebSocketServer({ server });

// Bind WebSocket logic
setupWebSocketServer(wss);

server.listen(port, () => {
    logger.info(`Game API (HTTP + WS) running on port ${port} [${config.env}]`);
});

// Graceful Shutdown
const shutdown = () => {
    logger.info("SIGTERM/SIGINT received, shutting down gracefully");

    // Close the socket connections. In a real clustered app, we'd unsubscribe from Redis too
    wss.clients.forEach(client => client.close(1001, "Server shutting down"));

    server.close(() => {
        logger.info("Closed HTTP server");
        process.exit(0);
    });

    setTimeout(() => {
        logger.error("Forcefully shutting down");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
