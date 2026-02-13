import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

/**
 * Edge-safe middleware – uses the shared auth config (no Prisma).
 * Auth.js reads the JWT cookie itself, so there's no salt / cookie-name mismatch.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/goals/:path*",
  ],
};
