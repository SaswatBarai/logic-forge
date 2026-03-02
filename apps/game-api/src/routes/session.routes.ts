import { Router, Request, Response } from "express";
import { z } from "zod";
import { MatchmakerService } from "../services/matchmaker.service";

const router: Router = Router();

const CreateSessionSchema = z.object({
    mode:         z.literal("ARCADE"),
    playerFormat: z.enum(["SINGLE", "DUAL"]),
    sessionType:  z.enum(["TIMER", "LIVE"]),
    category:     z.enum(["MISSING_LINK", "BOTTLENECK", "TRACING"]).nullable(),
    userId:       z.string().min(1),
}).refine(
    (d) => !(d.sessionType === "TIMER" && d.category === null),
    { message: "Timer Mode requires a category", path: ["category"] }
);

router.post("/", async (req: Request, res: Response) => {
    const parsed = CreateSessionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const matchmakerService: MatchmakerService = req.app.get("matchmakerService");

    try {
        // ✅ Pass short names directly — types are consistent end-to-end
        // Translation to Prisma/QE enum happens in round.service.ts only
        const result = await matchmakerService.findOrCreateSession(parsed.data);
        return res.status(result.status === "MATCHED" ? 201 : 202).json({ data: result });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
});

export default router;
