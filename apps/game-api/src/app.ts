import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { createLogger } from "@logicforge/logger";
import { getConfig } from "@logicforge/config";
import { ZodError } from "zod";
import { ApiError } from "@logicforge/types";

export const config = getConfig();
export const logger = createLogger({ service: "game-api" });

export const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

import sessionRoutes from "./routes/session.routes";
app.use("/api/v1/sessions", sessionRoutes);

// Basic health check
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "game-api" });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        const errorResponse: ApiError = {
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                details: err.format(),
            },
        };
        return res.status(400).json(errorResponse);
    }

    const isApiError = err.success === false && err.error && err.error.code;
    if (isApiError) {
        return res.status(400).json(err);
    }

    logger.error({ err, path: req.path }, "Unhandled application error");

    const internalError: ApiError = {
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
    };
    return res.status(500).json(internalError);
});
