/**
 * Simple fixed-window in-memory rate limiter.
 * On serverless each instance keeps its own counters, so this is best-effort;
 * swap for a shared store (e.g. Upstash Redis) for strict guarantees.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) {
        if (b.resetAt <= now) buckets.delete(k);
      }
    }
    return { success: true, retryAfter: 0 };
  }

  bucket.count++;
  if (bucket.count > limit) {
    return {
      success: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { success: true, retryAfter: 0 };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
