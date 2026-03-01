import express, { Express, Request, Response, NextFunction } from "express";
import cors from "express";
// Need proper cors import, but since the package is just installed, let me skip using the default import and require it.
import corsMware from "cors";
import { createLogger } from "@logicforge/logger";
import { getConfig } from "@logicforge/config";
import router from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";

const config = getConfig();
export const logger = createLogger({ service: "question-engine" });

const app: Express = express();

app.use(corsMware());
app.use(express.json());

// Routes
app.use("/api/v1", router);

// Error Handling Middleware
app.use(errorMiddleware);

const port = config.ports.questionEngine;

const server = app.listen(port, () => {
    logger.info(`Question Engine running on port ${port} [${config.env}]`);
});

// Graceful Shutdown
const shutdown = () => {
    logger.info("SIGTERM/SIGINT received, shutting down gracefully");
    server.close(() => {
        logger.info("Closed out remaining connections");
        process.exit(0);
    });

    setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
