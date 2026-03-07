// apps/web/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

// export const authConfig = {
//     secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET, // ✅ ADD THIS

//     providers: [Google, GitHub],
//     pages: {
//         signIn: "/login",
//         error: "/login",
//     },
//     callbacks: {
//         authorized({ auth, request: { nextUrl } }) {
//             console.log("[MIDDLEWARE_DEBUG] auth object:", JSON.stringify(auth));
//             console.log("[MIDDLEWARE_DEBUG] isLoggedIn:", !!auth?.user);
//             const isLoggedIn = !!auth?.user;
//             const protectedPaths = ["/dashboard", "/arcade", "/lobby", "/story", "/settings", "/arena"];
//             const isProtected = protectedPaths.some(p => nextUrl.pathname.startsWith(p));

//             if (isProtected && !isLoggedIn) {
//                 console.warn("[AUTH_MIDDLEWARE] Redirecting unauthenticated user from", nextUrl.pathname, "to /login");
//                 const loginUrl = new URL("/login", nextUrl);
//                 loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
//                 return Response.redirect(loginUrl);
//             }
            
//             if (isProtected && isLoggedIn) {
//                 console.info("[AUTH_MIDDLEWARE] User authenticated, allowing access to", nextUrl.pathname);
//             }
            
//             return true;
//         },
//     },
// } satisfies NextAuthConfig;




export const authConfig = {
    trustHost: true, // ✅ THIS IS THE ROOT CAUSE
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    providers: [Google, GitHub],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            console.log("[MIDDLEWARE_DEBUG] auth object:", JSON.stringify(auth));
            const isLoggedIn = !!auth?.user;
            const protectedPaths = ["/dashboard", "/arcade", "/lobby", "/story", "/settings", "/arena"];
            const isProtected = protectedPaths.some(p => nextUrl.pathname.startsWith(p));

            if (isProtected && !isLoggedIn) {
                const loginUrl = new URL("/login", nextUrl);
                loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
                return Response.redirect(loginUrl);
            }
            return true;
        },
    },
} satisfies NextAuthConfig;
