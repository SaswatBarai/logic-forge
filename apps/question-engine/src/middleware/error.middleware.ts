import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../index";
import { ApiError } from "@logicforge/types";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If it's a Zod validation error
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

    // Handle explicitly thrown generic errors
    const isApiError = err.success === false && err.error && err.error.code;

    if (isApiError) {
        const status =
            err.error.code === "NOT_FOUND" ? 404 :
                err.error.code === "UNAUTHORIZED" ? 401 :
                    err.error.code === "FORBIDDEN" ? 403 : 400;

        return res.status(status).json(err);
    }

    // Fallback handler for unhandled errors
    logger.error({ err, path: req.path }, "Unhandled application error");

    const internalError: ApiError = {
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
    };
    return res.status(500).json(internalError);
};
