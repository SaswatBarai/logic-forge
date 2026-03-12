// apps/web/middleware.ts
// Edge runtime cannot reliably decrypt NextAuth JWT with custom cookie domain (.saswat.app).
// We only check for the physical presence of the session cookie here; real verification
// happens in Node.js (Server Components, API routes, and the Express gateway).
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const hasSessionCookie =
        request.cookies.has("next-auth.session-token") ||
        request.cookies.has("__Secure-next-auth.session-token") ||
        request.cookies.has("authjs.session-token") ||
        request.cookies.has("__Secure-authjs.session-token");

    const protectedPaths = [
        "/dashboard",
        "/arcade",
        "/lobby",
        "/story",
        "/settings",
        "/arena",
    ];
    const isProtected = protectedPaths.some((p) =>
        request.nextUrl.pathname.startsWith(p)
    );

    if (isProtected && !hasSessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
