import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

/**
 * Edge-safe middleware – uses the shared auth config (no Prisma).
 * Auth.js reads the JWT cookie itself, so there's no salt / cookie-name mismatch.
 */
export default NextAuth(authConfig).auth;

/**
 * Next.js requires a static matcher, so it must mirror PROTECTED_PREFIXES
 * in lib/routes.ts. The `authorized` callback is the real gate.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/cards/:path*",
    "/budget/:path*",
    "/projection/:path*",
    "/goals/:path*",
    "/settings/:path*",
  ],
};
