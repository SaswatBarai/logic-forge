import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { getMongooseAuthAdapter } from "@logicforge/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
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