import { describe, expect, it } from "vitest";
import { parseDateOnly } from "../dates";
import { sumMoney, roundMoney } from "../money";
import { scheduleDate, splitInstallments } from "../transactions/schedule";

const day = (d: Date) => d.toISOString().slice(0, 10);

describe("splitInstallments", () => {
  it("splits evenly when possible", () => {
    expect(splitInstallments(300, 3)).toEqual([100, 100, 100]);
  });

  it("puts the rounding difference on the last installment", () => {
    expect(splitInstallments(100, 3)).toEqual([33.33, 33.33, 33.34]);
    expect(splitInstallments(10, 6)).toEqual([1.67, 1.67, 1.67, 1.67, 1.67, 1.65]);
  });

  it.each([
    [100, 3],
    [1999.99, 12],
    [0.1, 2],
    [12345.67, 48],
  ])("installments of %d in %i always sum to the total", (total, count) => {
    const parts = splitInstallments(total, count);
    expect(parts).toHaveLength(count);
    expect(sumMoney(parts, (p) => p)).toBe(total);
  });
});

describe("scheduleDate", () => {
  it("repeats the same day each month, clamped", () => {
    const base = parseDateOnly("2026-01-31");
    expect([0, 1, 2, 3].map((i) => day(scheduleDate(base, i)))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("bills credit purchases on day 1 starting at the invoice month", () => {
    const base = parseDateOnly("2026-11-20");
    expect([0, 1, 2].map((i) => day(scheduleDate(base, i, 2)))).toEqual([
      "2027-01-01",
      "2027-02-01",
      "2027-03-01",
    ]);
  });
});

describe("money helpers", () => {
  it("roundMoney removes float noise", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it("sumMoney sums in cents", () => {
    expect(sumMoney([0.1, 0.2, 0.3], (x) => x)).toBe(0.6);
    expect(sumMoney([], (x: number) => x)).toBe(0);
  });
});
