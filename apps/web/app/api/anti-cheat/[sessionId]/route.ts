import { NextRequest, NextResponse } from "next/server";

const ANTI_CHEAT_URL =
  process.env.ANTI_CHEAT_URL || "http://localhost:3003";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const [scoreRes, flagsRes] = await Promise.all([
      fetch(`${ANTI_CHEAT_URL}/api/sessions/${sessionId}/risk-score`, {
        cache: "no-store",
      }),
      fetch(`${ANTI_CHEAT_URL}/api/sessions/${sessionId}/flags`, {
        cache: "no-store",
      }),
    ]);

    const riskScore = scoreRes.ok ? await scoreRes.json() : null;
    const flags = flagsRes.ok ? await flagsRes.json() : [];

    return NextResponse.json({
      riskScore: riskScore?.riskScore ?? 0,
      candidateId: riskScore?.candidateId ?? null,
      updatedAt: riskScore?.updatedAt ?? null,
      flags: Array.isArray(flags) ? flags : [],
    });
  } catch (err) {
    return NextResponse.json({ riskScore: 0, flags: [] });
  }
}
