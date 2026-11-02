import { describe, expect, it } from "vitest";
import {
  addMonthsClamped,
  dateOnly,
  dayRange,
  daysInMonth,
  firstOfMonthAfter,
  formatDateOnly,
  isDateOnlyString,
  monthRange,
  parseDateOnly,
} from "../dates";

const iso = (d: Date) => d.toISOString();

describe("isDateOnlyString", () => {
  it("accepts real dates", () => {
    expect(isDateOnlyString("2026-02-28")).toBe(true);
    expect(isDateOnlyString("2028-02-29")).toBe(true);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isDateOnlyString("2026-02-29")).toBe(false);
    expect(isDateOnlyString("2026-13-01")).toBe(false);
    expect(isDateOnlyString("2026-00-10")).toBe(false);
    expect(isDateOnlyString("2026-1-5")).toBe(false);
    expect(isDateOnlyString("2026-03-10T03:00:00.000Z")).toBe(false);
  });
});

describe("parseDateOnly", () => {
  it("stores calendar dates at 12:00 UTC", () => {
    expect(iso(parseDateOnly("2026-03-31"))).toBe("2026-03-31T12:00:00.000Z");
  });

  it("throws on invalid input", () => {
    expect(() => parseDateOnly("2026-02-31")).toThrow();
    expect(() => parseDateOnly("31/03/2026")).toThrow();
  });
});

describe("dateOnly", () => {
  it("normalizes month overflow", () => {
    expect(iso(dateOnly(2026, 12, 1))).toBe("2027-01-01T12:00:00.000Z");
    expect(iso(dateOnly(2026, -1, 1))).toBe("2025-12-01T12:00:00.000Z");
  });
});

describe("formatDateOnly", () => {
  it("uses the local calendar day, even late at night", () => {
    expect(formatDateOnly(new Date(2026, 2, 31, 23, 30))).toBe("2026-03-31");
    expect(formatDateOnly(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });
});

describe("daysInMonth", () => {
  it("handles leap years", () => {
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(daysInMonth(2026, 3)).toBe(30);
  });
});

describe("addMonthsClamped", () => {
  const jan31 = parseDateOnly("2026-01-31");

  it("clamps to the last day of shorter months", () => {
    expect(iso(addMonthsClamped(jan31, 1))).toBe("2026-02-28T12:00:00.000Z");
    expect(iso(addMonthsClamped(jan31, 3))).toBe("2026-04-30T12:00:00.000Z");
  });

  it("keeps the original day when the month allows it", () => {
    expect(iso(addMonthsClamped(jan31, 2))).toBe("2026-03-31T12:00:00.000Z");
  });

  it("crosses year boundaries", () => {
    expect(iso(addMonthsClamped(parseDateOnly("2026-12-15"), 1))).toBe(
      "2027-01-15T12:00:00.000Z"
    );
  });
});

describe("firstOfMonthAfter", () => {
  it("returns day 1 of the target month", () => {
    expect(iso(firstOfMonthAfter(parseDateOnly("2026-11-30"), 2))).toBe(
      "2027-01-01T12:00:00.000Z"
    );
  });
});

describe("monthRange", () => {
  it("covers the whole month in UTC", () => {
    const { start, end } = monthRange(2026, 1);
    expect(iso(start)).toBe("2026-02-01T00:00:00.000Z");
    expect(iso(end)).toBe("2026-02-28T23:59:59.999Z");
  });

  it("contains every calendar date of the month and nothing else", () => {
    const { start, end } = monthRange(2026, 2);
    const inRange = (d: Date) => d >= start && d <= end;
    expect(inRange(parseDateOnly("2026-03-01"))).toBe(true);
    expect(inRange(parseDateOnly("2026-03-31"))).toBe(true);
    expect(inRange(parseDateOnly("2026-02-28"))).toBe(false);
    expect(inRange(parseDateOnly("2026-04-01"))).toBe(false);
  });
});

describe("dayRange", () => {
  it("spans from the start of the first day to the end of the last", () => {
    const { start, end } = dayRange(parseDateOnly("2026-03-10"), parseDateOnly("2026-03-12"));
    expect(iso(start)).toBe("2026-03-10T00:00:00.000Z");
    expect(iso(end)).toBe("2026-03-12T23:59:59.999Z");
  });
});
