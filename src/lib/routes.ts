/**
 * Single source of truth for authenticated page prefixes.
 * Edge-safe (no Node.js imports) – used by the Auth.js `authorized` callback.
 */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/categories",
  "/cards",
  "/budget",
  "/projection",
  "/goals",
  "/settings",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
