import { handlers } from "@/auth";

// This catch-all route delegates ALL /api/auth/* requests to NextAuth v5
export const { GET, POST } = handlers;
