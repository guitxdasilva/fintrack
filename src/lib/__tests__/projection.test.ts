import { describe, expect, it } from "vitest";
import { dateOnly } from "../dates";
import { buildProjection, type ProjectionTransaction } from "../projection";

const START = { month: 10, year: 2026 }; // Nov/2026; history = Aug–Oct

function tx(
  month: number,
  year: number,
  amount: number,
  type: "INCOME" | "EXPENSE",
  kind: "variable" | "fixed" | "installments" = "variable"
): ProjectionTransaction {
  return {
    amount,
    type,
    date: dateOnly(year, month, 10),
    isFixed: kind === "fixed",
    installmentGroupId: kind === "installments" ? "g1" : null,
  };
}

// History: variable spending 900/600/300 (avg 600), salary as variable income 3000 x3
const history = [
  tx(7, 2026, 900, "EXPENSE"),
  tx(8, 2026, 600, "EXPENSE"),
  tx(9, 2026, 300, "EXPENSE"),
  tx(7, 2026, 3000, "INCOME"),
  tx(8, 2026, 3000, "INCOME"),
  tx(9, 2026, 3000, "INCOME"),
];

describe("buildProjection", () => {
  it("returns the requested months in order, crossing the year", () => {
    const { months } = buildProjection([], START, 4, false);
    expect(months.map((m) => [m.month, m.year])).toEqual([
      [10, 2026],
      [11, 2026],
      [0, 2027],
      [1, 2027],
    ]);
  });

  it("splits committed expenses into installments, fixed and variable", () => {
    const { months } = buildProjection(
      [
        tx(10, 2026, 200, "EXPENSE", "installments"),
        tx(10, 2026, 1000, "EXPENSE", "fixed"),
        tx(10, 2026, 50.5, "EXPENSE"),
        tx(10, 2026, 4000, "INCOME", "fixed"),
      ],
      START,
      1,
      false
    );

    expect(months[0]).toMatchObject({
      income: { committed: 4000, estimated: 0 },
      expense: { installments: 200, fixed: 1000, variable: 50.5, estimated: 0 },
      net: 2749.5,
      cumulative: 2749.5,
    });
  });

  it("computes averages from the months before the start", () => {
    const { averages } = buildProjection(history, START, 1, true);
    expect(averages).toEqual({ variableExpense: 600, variableIncome: 3000, historyMonths: 3 });
  });

  it("estimates only the variable spending not yet registered", () => {
    const { months } = buildProjection(
      [...history, tx(10, 2026, 250, "EXPENSE"), tx(11, 2026, 900, "EXPENSE")],
      START,
      2,
      true
    );
    expect(months[0].expense.estimated).toBe(350); // 600 avg - 250 registered
    expect(months[1].expense.estimated).toBe(0); // already above the average
  });

  it("estimates income only for months without any registered income", () => {
    const { months } = buildProjection(
      [...history, tx(10, 2026, 5000, "INCOME", "fixed")],
      START,
      2,
      true
    );
    expect(months[0].income).toEqual({ committed: 5000, estimated: 0 });
    expect(months[1].income).toEqual({ committed: 0, estimated: 3000 });
  });

  it("ignores estimates when disabled and accumulates the net", () => {
    const { months } = buildProjection(
      [
        ...history,
        tx(10, 2026, 1000, "EXPENSE", "installments"),
        tx(11, 2026, 1000, "EXPENSE", "installments"),
      ],
      START,
      2,
      false
    );
    expect(months.map((m) => [m.net, m.cumulative])).toEqual([
      [-1000, -1000],
      [-1000, -2000],
    ]);
  });

  it("ignores transactions outside the window", () => {
    const { months } = buildProjection([tx(3, 2030, 999, "EXPENSE")], START, 1, false);
    expect(months[0].net).toBe(0);
  });
});
