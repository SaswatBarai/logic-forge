import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function getHandlers() {
  const { handlers } = await import("@/auth");
  return handlers;
}

export async function GET(req: NextRequest) {
  const handlers = await getHandlers();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  const handlers = await getHandlers();
  return handlers.POST(req);
}
