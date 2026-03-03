import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMongooseAuthAdapter } from "@logicforge/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adapter = getMongooseAuthAdapter();
  
  // ✅ Non-null assertion since our adapter *does* implement these methods
  const user = await adapter.getUser!(session.user.id as string);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    displayName: (user as any).displayName || user.name || "",
    bio: (user as any).bio || "",
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { displayName, bio } = await req.json();

  if (typeof displayName !== "string" || typeof bio !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const adapter = getMongooseAuthAdapter();

  // ✅ Non-null assertion since our adapter *does* implement these methods
  await adapter.updateUser!({
    id: session.user.id as string,
    displayName: displayName.trim(),
    bio: bio.trim(),
  } as any);

  return NextResponse.json({ success: true });
}
