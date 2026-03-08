import * as auditLogService from "../services/audit-log.service.js";
import * as riskScoringService from "../services/risk-scoring.service.js";

const TELEMETRY_EVENT_TYPES = [
  "PASTE_DETECTED",
  "FOCUS_LOST",
  "FOCUS_RESTORED",
  "KEYSTROKE_BURST",
  "MOUSE_INACTIVE",
  "SOLUTION_SUBMITTED",
  "FAST_SOLUTION",
] as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];

export function isTelemetryEventType(
  value: string
): value is TelemetryEventType {
  return TELEMETRY_EVENT_TYPES.includes(value as TelemetryEventType);
}

export interface TelemetryEventPayload {
  sessionId: string;
  candidateId: string;
  eventType: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}

export async function processTelemetryEvent(
  params: TelemetryEventPayload
): Promise<{ riskScore: number; flagLevel: string | null }> {
  await auditLogService.appendTelemetryEvent({
    sessionId: params.sessionId,
    candidateId: params.candidateId,
    eventType: params.eventType,
    payload: params.payload,
  });

  const result = await riskScoringService.updateRiskScore({
    sessionId: params.sessionId,
    candidateId: params.candidateId,
    eventType: params.eventType,
    payload: params.payload,
  });

  return {
    riskScore: result.riskScore,
    flagLevel: result.flagLevel,
  };
}

export type { Socket } from "socket.io";
export function registerTelemetryHandlers(
  socket: import("socket.io").Socket,
  _io: import("socket.io").Server
): void {
  const handle = (eventType: TelemetryEventType) => async (payload: unknown) => {
    const p = (payload as Record<string, unknown>) ?? {};
    const sessionId =
      (p.sessionId as string) ?? (socket.data?.sessionId as string);
    const candidateId =
      (p.candidateId as string) ?? (p.userId as string) ?? (socket.data?.userId as string);
    if (!sessionId || !candidateId) return;
    try {
      await processTelemetryEvent({
        sessionId,
        candidateId,
        eventType,
        timestamp: (p.timestamp as string) ?? new Date().toISOString(),
        payload: (p.payload as Record<string, unknown>) ?? undefined,
      });
    } catch (_err) {
      // log and ignore
    }
  };

  for (const eventType of TELEMETRY_EVENT_TYPES) {
    socket.on(eventType, handle(eventType));
  }
}
