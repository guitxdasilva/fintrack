import { describe, expect, it } from "vitest";
import type { ProjectionMonth } from "@/lib/projection";
import { chartRows, hasBalance, lineValue, shortMonth } from "../format";

const month = (balance: number | null): ProjectionMonth => ({
  month: 10,
  year: 2026,
  income: { committed: 7700, estimated: 0 },
  expense: { installments: 3161.43, fixed: 0, variable: 0, estimated: 5102.84 },
  net: -564.27,
  cumulative: -564.27,
  balance,
});

describe("chartRows", () => {
  it("keeps the month's breakdown intact for the tooltip", () => {
    const [row] = chartRows([month(null)]);
    // regression: income/expense were once overwritten by totals → "R$ NaN"
    expect(row.income).toEqual({ committed: 7700, estimated: 0 });
    expect(row.expense.installments).toBe(3161.43);
    expect(row.label).toBe("Nov/26");
  });

  it("plots the balance when known, the cumulative otherwise", () => {
    expect(chartRows([month(null)])[0].line).toBe(-564.27);
    expect(chartRows([month(1200)])[0].line).toBe(1200);
  });
});

describe("helpers", () => {
  it("formats and detects balance", () => {
    expect(shortMonth({ month: 0, year: 2027 })).toBe("Jan/27");
    expect(hasBalance([month(10)])).toBe(true);
    expect(hasBalance([month(null)])).toBe(false);
    expect(hasBalance([])).toBe(false);
    expect(lineValue(month(0))).toBe(0);
  });
});
