// apps/web/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

// Cookie prefix matches auth.ts so the edge middleware can read the session cookie.
// Do NOT set a domain — keep it host-only (same as what auth.ts produces).
const isProd = process.env.NODE_ENV === "production";
const cookiePrefix = isProd ? "__Secure-" : "";

export const authConfig = {
    trustHost: true,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    providers: [Google, GitHub],

    cookies: {
        sessionToken: {
            name: `${cookiePrefix}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: isProd,
                // No `domain` — stay host-only to match what auth.ts sets at sign-in
            },
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedPaths = [
                "/dashboard",
                "/arcade",
                "/lobby",
                "/story",
                "/settings",
                "/arena",
            ];
            const isProtected = protectedPaths.some((p) =>
                nextUrl.pathname.startsWith(p)
            );

            if (isProtected && !isLoggedIn) {
                const loginUrl = new URL("/login", nextUrl);
                loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
                return Response.redirect(loginUrl);
            }
            return true;
        },
    },
} satisfies NextAuthConfig;
