import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

async function getHandlers() {
  const { handlers } = await import("@/auth");
  return handlers;
}

export async function GET(req: NextRequest) {
  try {
    const handlers = await getHandlers();
    return handlers.GET(req);
  } catch (error) {
    console.error("[auth] GET error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (isDev) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const handlers = await getHandlers();
    return handlers.POST(req);
  } catch (error) {
    console.error("[auth] POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (isDev) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
