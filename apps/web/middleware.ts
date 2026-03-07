// apps/web/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/arcade/:path*",
        "/lobby/:path*",
        "/story/:path*",
        "/settings/:path*",
        "/arena/:path*",
    ],
};
