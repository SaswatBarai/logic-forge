import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@logicforge/db";

export interface ActivityHeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized", data: [] }, { status: 401 });
    }

    const userId = session.user.email;
    const since = new Date();
    since.setDate(since.getDate() - 365);

    const rows = await db.$queryRaw<{ date: Date; count: number }[]>`
      SELECT ("createdAt"::date) AS date, COUNT(*)::int AS count
      FROM "MatchRecord"
      WHERE "userId" = ${userId} AND "createdAt" >= ${since}
      GROUP BY ("createdAt"::date)
      ORDER BY date ASC
    `;

    const data: ActivityHeatmapDay[] = rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      count: Number(r.count),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[activity-heatmap] Error:", err);
    return NextResponse.json(
      { error: "Failed to load activity heatmap", data: [] },
      { status: 500 }
    );
  }
}
