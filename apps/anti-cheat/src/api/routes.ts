import { Router, type Request, type Response } from "express";
import { db } from "@logicforge/db";
import { createLogger } from "@logicforge/logger";
import {
  processTelemetryEvent,
  isTelemetryEventType,
  type TelemetryEventPayload,
} from "../handlers/telemetry.handler.js";

const logger = createLogger({ service: "anti-cheat-api" });
const router: ReturnType<typeof Router> = Router();

router.get("/sessions/:id/risk-score", async (req: Request, res: Response) => {
  try {
    const state = await db.sessionRiskState.findUnique({
      where: { sessionId: req.params.id },
    });
    if (!state) {
      return res.status(404).json({ error: "Session risk state not found" });
    }
    res.json({
      sessionId: state.sessionId,
      candidateId: state.candidateId,
      riskScore: state.riskScore,
      updatedAt: state.updatedAt,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch risk score" });
  }
});

router.get("/sessions/:id/flags", async (req: Request, res: Response) => {
  try {
    const flags = await db.sessionFlag.findMany({
      where: { sessionId: req.params.id },
      orderBy: { timestamp: "desc" },
    });
    res.json(flags);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch flags" });
  }
});

router.post("/ingest", async (req: Request, res: Response) => {
  const body = req.body as unknown;
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as TelemetryEventPayload).sessionId !== "string" ||
    typeof (body as TelemetryEventPayload).candidateId !== "string" ||
    typeof (body as TelemetryEventPayload).eventType !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid body: sessionId, candidateId, eventType required",
    });
  }

  const payload = body as TelemetryEventPayload;
  if (!isTelemetryEventType(payload.eventType)) {
    return res.status(400).json({
      error: `Invalid eventType: ${payload.eventType}`,
    });
  }

  try {
    const result = await processTelemetryEvent(payload);
    logger.info({
      eventType: payload.eventType,
      sessionId: payload.sessionId,
      candidateId: payload.candidateId,
      riskScore: result.riskScore,
      flagLevel: result.flagLevel,
    }, "Telemetry ingested");
    res.status(200).json({
      riskScore: result.riskScore,
      flagLevel: result.flagLevel,
    });
  } catch (e) {
    logger.error({ err: e, payload }, "Ingest failed");
    res.status(500).json({ error: "Ingest failed" });
  }
});

export default router;
