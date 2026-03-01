import { Router, Request, Response } from "express";
import { CreateSessionSchema } from "@logicforge/types";
import { db } from "@logicforge/db";
import { findOrQueueMatch, dequeueMatch } from "../services/matchmaker.service";
import { logger } from "../app";

const router:Router = Router();

// POST /api/v1/sessions
router.post("/", async (req: Request, res: Response) => {
    try {
        const payload = CreateSessionSchema.parse(req.body);
        // Use userId from request body (sent by frontend), fall back to random ID
        const userId: string = req.body.userId || `anon-${Math.random().toString(36).slice(2, 10)}`;

        // Handle Dual Matchmaking initialization
        if (payload.playerFormat === "DUAL") {
            const matchResult = await findOrQueueMatch(userId);
            return res.status(200).json({ success: true, data: matchResult });
        }

        // Handle Single Player (Story or standard Arcade)
        const session = await db.gameSession.create({
            data: {
                userId,
                mode: payload.mode,
                sessionType: payload.sessionType,
                playerFormat: "SINGLE",
                category: payload.category as any,
                language: payload.language as any,
                status: "LOBBY",
            }
        });

        res.status(201).json({ success: true, data: session });
    } catch (err: any) {
        logger.error({ err }, "Failed to create session");
        res.status(400).json({ success: false, error: "VALIDATION_FAILED", details: err });
    }
});

// DEL /api/v1/sessions/queue
router.delete("/queue", async (req: Request, res: Response) => {
    const userId: string = req.body?.userId || "unknown";
    await dequeueMatch(userId);
    res.status(200).json({ success: true });
});

export default router;
