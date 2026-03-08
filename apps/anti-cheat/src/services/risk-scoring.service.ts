import { db } from "@logicforge/db";

const WEIGHTS: Record<string, number> = {
  FOCUS_LOST: 10,
  FOCUS_RESTORED: 0,
  PASTE_DETECTED: 25,
  KEYSTROKE_BURST: 5,
  MOUSE_INACTIVE: 5,
  SOLUTION_SUBMITTED: 0,
  FAST_SOLUTION: 30,
};

const THRESHOLD_MEDIUM = 60;
const THRESHOLD_HIGH = 80;

export type FlagLevel = "MEDIUM" | "HIGH";

export async function updateRiskScore(params: {
  sessionId: string;
  candidateId: string;
  eventType: string;
  payload?: Record<string, unknown>;
}): Promise<{ riskScore: number; flagLevel: FlagLevel | null }> {
  const weight = WEIGHTS[params.eventType] ?? 0;
  if (weight <= 0) {
    const existing = await db.sessionRiskState.findUnique({
      where: { sessionId: params.sessionId },
    });
    return {
      riskScore: existing?.riskScore ?? 0,
      flagLevel: null,
    };
  }

  const existing = await db.sessionRiskState.findUnique({
    where: { sessionId: params.sessionId },
  });

  const previousScore = existing?.riskScore ?? 0;
  const newScore = Math.min(100, previousScore + weight);

  await db.sessionRiskState.upsert({
    where: { sessionId: params.sessionId },
    create: {
      sessionId: params.sessionId,
      candidateId: params.candidateId,
      riskScore: newScore,
    },
    update: {
      candidateId: params.candidateId,
      riskScore: newScore,
    },
  });

  let flagLevel: FlagLevel | null = null;
  if (newScore >= THRESHOLD_HIGH && previousScore < THRESHOLD_HIGH) {
    flagLevel = "HIGH";
  } else if (newScore >= THRESHOLD_MEDIUM && previousScore < THRESHOLD_MEDIUM) {
    flagLevel = "MEDIUM";
  }

  if (flagLevel) {
    await db.sessionFlag.create({
      data: {
        sessionId: params.sessionId,
        candidateId: params.candidateId,
        riskScore: newScore,
        flagLevel,
        events: { eventTypes: [params.eventType], ...(params.payload ?? {}) },
      },
    });
  }

  return { riskScore: newScore, flagLevel };
}
