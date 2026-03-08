import { db, type Prisma } from "@logicforge/db";

/** Append-only: never update or delete. */
export async function appendTelemetryEvent(params: {
  sessionId: string;
  candidateId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db.telemetryEvent.create({
    data: {
      sessionId: params.sessionId,
      candidateId: params.candidateId,
      eventType: params.eventType,
      payload: (params.payload ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
