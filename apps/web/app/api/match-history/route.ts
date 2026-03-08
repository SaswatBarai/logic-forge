
import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { db }           from "@logicforge/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized", records: [], globalScore: 0 }, { status: 401 });
    }

    // game-api stores email as userId (from WS IDENTIFY), NOT the MongoDB _id
    const userId = session.user.email;

    console.log("[match-history] querying for userId:", userId);

    const [records, userScore] = await Promise.all([
      db.matchRecord.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        take:    50,
      }),
      db.userScore.findUnique({ where: { userId } }),
    ]);

    console.log("[match-history] found records:", records.length, "globalScore:", userScore?.globalScore);

    return NextResponse.json({
      records,
      globalScore: userScore?.globalScore ?? 0,
    });
  } catch (err) {
    console.error("[match-history] Error:", err);
    return NextResponse.json(
      { error: "Failed to load match history", records: [], globalScore: 0 },
      { status: 500 }
    );
  }
}
