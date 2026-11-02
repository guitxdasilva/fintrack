import { afterEach, describe, expect, it, vi } from "vitest";
import { getClientIp, rateLimit } from "../rate-limit";
import { isProtectedPath } from "../routes";
import { hashToken } from "../tokens";

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks after the limit and resets after the window", () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;

    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 1000).success).toBe(true);
    }
    const blocked = rateLimit(key, 3, 1000);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 3, 1000).success).toBe(true);
  });

  it("keeps keys independent", () => {
    const a = `a:${Math.random()}`;
    const b = `b:${Math.random()}`;
    expect(rateLimit(a, 1, 1000).success).toBe(true);
    expect(rateLimit(a, 1, 1000).success).toBe(false);
    expect(rateLimit(b, 1, 1000).success).toBe(true);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
    expect(getClientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("isProtectedPath", () => {
  it.each(["/dashboard", "/transactions", "/cards", "/budget", "/settings", "/goals/x"])(
    "%s is protected",
    (path) => expect(isProtectedPath(path)).toBe(true)
  );

  it.each(["/", "/login", "/register", "/reset-password", "/cardsfoo"])(
    "%s is public",
    (path) => expect(isProtectedPath(path)).toBe(false)
  );
});

describe("hashToken", () => {
  it("is deterministic sha256 hex and differs from the token", () => {
    const hash = hashToken("abc");
    expect(hash).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(hashToken("abc")).toBe(hash);
  });
});
