import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Load .env from file into process.env (don't overwrite existing). No dotenv dependency.
function loadEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1).replace(/\\n/g, "\n");
      process.env[key] = value;
    }
  } catch {
    // File missing or unreadable – ignore
  }
}

// Load env from multiple possible locations (Next.js may run from source or compiled .next paths)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = __dirname;
const cwd = process.cwd();

loadEnvFile(path.resolve(appRoot, "../../.env"));
loadEnvFile(path.resolve(appRoot, ".env"));
// Fallback when running from monorepo root or when compiled path is under .next
loadEnvFile(path.resolve(cwd, ".env"));
loadEnvFile(path.resolve(cwd, "../../.env"));

if (process.env.NODE_ENV === "development" && !process.env.MONGO_URL) {
  console.warn(
    "[auth] MONGO_URL is missing. Set it in apps/web/.env or the repo root .env (e.g. MONGO_URL=mongodb://admin:password@localhost:27017/logicforge_auth?authSource=admin)"
  );
}
if (process.env.NODE_ENV === "development" && !process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn("[auth] AUTH_SECRET or NEXTAUTH_SECRET is missing. Set one in apps/web/.env or the repo root .env.");
}

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { getMongooseAuthAdapter } from "@logicforge/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: getMongooseAuthAdapter(),
  // NOTE: Do NOT set session.strategy here when using an adapter.
  // NextAuth defaults to "database" strategy when an adapter is provided,
  // which is required for OAuth providers to persist accounts correctly.
  // Forcing "jwt" with an adapter causes `error=Configuration` on OAuth callback.
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async session({ session }) {
      // With database sessions, user.id is populated from the adapter directly
      return session;
    },
  },
  logger: {
    error(error) {
      console.error("[NEXTAUTH_CRASH]:", error);
    },
    warn(code) {
      console.warn("[NEXTAUTH_WARN]:", code);
    },
    debug(code, metadata) {
      console.log("[NEXTAUTH_DEBUG]:", code, metadata);
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});