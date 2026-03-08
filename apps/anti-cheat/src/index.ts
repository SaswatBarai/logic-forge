import { createServer } from "http";
import express from "express";
import { Server as SocketServer } from "socket.io";
import { getConfig } from "@logicforge/config";
import { createLogger } from "@logicforge/logger";
import apiRouter from "./api/routes.js";
import { registerTelemetryHandlers } from "./handlers/telemetry.handler.js";

const config = getConfig();
const logger = createLogger({ service: "anti-cheat" });

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "anti-cheat" });
});

app.use("/api", apiRouter);

const httpServer = createServer(app);
const io = new SocketServer(httpServer, { cors: { origin: "*" } });

io.of("/telemetry").on("connection", (socket) => {
  socket.on("JOIN_TELEMETRY", ({ sessionId }: { sessionId: string }) => {
    if (sessionId) socket.join(sessionId);
  });
  registerTelemetryHandlers(socket, io);
});

const port = config.ports.antiCheat ?? 3003;
httpServer.listen(port, () => {
  logger.info({ port }, "Anti-cheat service listening");
});
