import { describe, expect, it } from "vitest";
import type { Category, Transaction } from "@/types";
import { groupByCategory, groupByDay, summarize, withoutLinkedRefunds } from "../statement";

const food = { id: "food", name: "Alimentação", icon: "🍔" } as Category;
const home = { id: "home", name: "Moradia", icon: "🏠" } as Category;

let seq = 0;
function tx(day: string, amount: number, extra: Partial<Transaction> = {}): Transaction {
  seq++;
  return {
    id: `t${seq}`,
    amount,
    type: "EXPENSE",
    description: `tx ${seq}`,
    date: `${day}T12:00:00.000Z`,
    category: food,
    categoryId: food.id,
    paid: false,
    ...extra,
  } as Transaction;
}

const TODAY = new Date(2026, 10, 3, 15, 0); // 03/Nov/2026 15:00 local

describe("groupByDay", () => {
  it("groups by calendar day, newest first, with the day's net total", () => {
    const groups = groupByDay(
      [
        tx("2026-11-01", 50),
        tx("2026-11-03", 20),
        tx("2026-11-03", 100, { type: "INCOME" }),
        tx("2026-10-30", 10.1),
        tx("2026-10-30", 0.2),
      ],
      TODAY
    );

    expect(groups.map((g) => [g.key, g.total, g.items.length])).toEqual([
      ["2026-11-03", 80, 2],
      ["2026-11-01", -50, 1],
      ["2026-10-30", -10.3, 2],
    ]);
  });

  it("labels today and yesterday, other days in pt-BR", () => {
    const titles = groupByDay(
      [tx("2026-11-03", 1), tx("2026-11-02", 1), tx("2026-10-30", 1)],
      TODAY
    ).map((g) => g.title);

    expect(titles[0]).toBe("Hoje");
    expect(titles[1]).toBe("Ontem");
    expect(titles[2]).toMatch(/^Sexta, 30 de out/);
  });

  it("can group by a different date (card purchases)", () => {
    const billed = tx("2026-11-01", 30, { purchaseDate: "2026-10-15T12:00:00.000Z" });
    const [group] = groupByDay([billed], TODAY, (t) => t.purchaseDate ?? t.date);
    expect(group.key).toBe("2026-10-15");
  });
});

describe("groupByCategory", () => {
  it("groups per category, largest spending first", () => {
    const groups = groupByCategory([
      tx("2026-11-01", 50),
      tx("2026-11-02", 900, { category: home, categoryId: home.id }),
      tx("2026-11-03", 25),
    ]);

    expect(groups.map((g) => [g.title, g.total])).toEqual([
      ["🏠 Moradia", -900],
      ["🍔 Alimentação", -75],
    ]);
  });
});

describe("summarize", () => {
  it("splits income, expense, paid and pending", () => {
    expect(
      summarize([
        tx("2026-11-01", 100, { paid: true }),
        tx("2026-11-01", 40),
        tx("2026-11-01", 1000, { type: "INCOME" }),
      ])
    ).toEqual({ income: 1000, expense: 140, refunds: 0, paid: 100, pending: 40 });
  });

  it("nets refunds from spending and keeps them out of income", () => {
    expect(
      summarize([
        tx("2026-11-01", 100),
        tx("2026-11-01", 30, { type: "INCOME", isRefund: true }),
        tx("2026-11-01", 500, { type: "INCOME" }),
      ])
    ).toEqual({ income: 500, expense: 70, refunds: 30, paid: 0, pending: 100 });
  });
});

describe("refunds in the statement", () => {
  const purchase = tx("2026-11-01", 100, {
    id: "p1",
    refunds: [{ id: "r1", amount: 40, purchaseDate: null }],
  });
  const linked = tx("2026-11-01", 40, { id: "r1", type: "INCOME", isRefund: true, refundOfId: "p1" });
  const orphan = tx("2026-11-01", 15, { type: "INCOME", isRefund: true, refundOfId: "elsewhere" });

  it("hides refunds shown on their purchase, keeps the others", () => {
    expect(withoutLinkedRefunds([purchase, linked, orphan]).map((t) => t.id)).toEqual([
      "p1",
      orphan.id,
    ]);
  });

  it("leaves refunded amounts out of paid and pending", () => {
    const summary = summarize([purchase, linked, tx("2026-11-02", 20, { paid: true })]);
    expect(summary).toMatchObject({ expense: 80, refunds: 40, pending: 60, paid: 20 });
  });

  it("nets a purchase's refunds into the day total", () => {
    const [day] = groupByDay(withoutLinkedRefunds([purchase, linked]), TODAY);
    expect(day.total).toBe(-60);
  });
});
