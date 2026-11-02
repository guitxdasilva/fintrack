import { describe, expect, it } from "vitest";
import type { Card, Category, Transaction } from "@/types";
import { categoryBreakdown, groupByCard, togglePaidUpdates } from "../month-transactions";

const food = { id: "food", name: "Alimentação", icon: "🍔", color: "#f00" } as Category;
const fun = { id: "fun", name: "Lazer", icon: "🎮", color: "#0f0" } as Category;
const nubank = { id: "nu", name: "Nubank", icon: "💜", closingDayType: "FIXED" } as Card;
const inter = { id: "inter", name: "Inter", closingDayType: null } as Card;

let seq = 0;
function tx(partial: Partial<Transaction>): Transaction {
  seq++;
  return {
    id: `t${seq}`,
    amount: 10,
    type: "EXPENSE",
    description: `tx ${seq}`,
    date: "2026-03-10T12:00:00.000Z",
    category: food,
    categoryId: food.id,
    paid: false,
    ...partial,
  } as Transaction;
}

describe("groupByCard", () => {
  it("groups card payments and keeps the rest as individual items", () => {
    const cash = tx({ paymentType: "CASH" });
    const nu1 = tx({ paymentType: "CARD", card: nubank, amount: 30.1 });
    const nu2 = tx({ paymentType: "CARD", card: nubank, amount: 20.2 });
    const refund = tx({ paymentType: "CARD", card: nubank, amount: 5, type: "INCOME" });
    const in1 = tx({ paymentType: "CARD", card: inter, amount: 100 });

    const { individualItems, cardGroups } = groupByCard([cash, nu1, nu2, refund, in1]);

    expect(individualItems).toEqual([cash]);
    expect(cardGroups.map((g) => [g.cardId, g.total, g.transactions.length])).toEqual([
      ["inter", 100, 1],
      ["nu", 45.3, 3],
    ]);
    expect(cardGroups[1]).toMatchObject({ cardIcon: "💜", hasClosingDay: true });
    expect(cardGroups[0]).toMatchObject({ cardIcon: "💳", hasClosingDay: false });
  });

  it("treats CARD payments without a card as individual", () => {
    const orphan = tx({ paymentType: "CARD", card: null });
    expect(groupByCard([orphan]).individualItems).toEqual([orphan]);
  });
});

describe("categoryBreakdown", () => {
  it("sums expenses per category, ignores income, sorts and computes percentages", () => {
    const slices = categoryBreakdown([
      tx({ amount: 25 }),
      tx({ amount: 50, category: fun, categoryId: fun.id }),
      tx({ amount: 25 }),
      tx({ amount: 999, type: "INCOME" }),
    ]);

    expect(slices).toEqual([
      { name: "🍔 Alimentação", color: "#f00", value: 50, percentage: 50 },
      { name: "🎮 Lazer", color: "#0f0", value: 50, percentage: 50 },
    ]);
  });

  it("returns an empty list without expenses", () => {
    expect(categoryBreakdown([tx({ type: "INCOME" })])).toEqual([]);
  });
});

describe("togglePaidUpdates", () => {
  it("flips each selected transaction and skips unknown ids", () => {
    const unpaid = tx({ paid: false });
    const paid = tx({ paid: true });

    const updates = togglePaidUpdates([unpaid.id, paid.id, "missing"], [unpaid, paid]);

    expect([...updates]).toEqual([
      [unpaid.id, true],
      [paid.id, false],
    ]);
  });
});
