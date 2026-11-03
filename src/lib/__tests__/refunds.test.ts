import { describe, expect, it } from "vitest";
import { incomeOf, refundableAmount, spendingOf, totalIncome, totalSpending } from "../refunds";

const expense = (amount: number) => ({ type: "EXPENSE" as const, amount });
const income = (amount: number) => ({ type: "INCOME" as const, amount });
const refund = (amount: number) => ({ type: "INCOME" as const, amount, isRefund: true });

describe("refunds", () => {
  it("reduce spending instead of counting as income", () => {
    expect(spendingOf(refund(30))).toBe(-30);
    expect(incomeOf(refund(30))).toBe(0);
    expect(spendingOf(income(30))).toBe(0);
    expect(incomeOf(income(30))).toBe(30);
  });

  it("net the totals", () => {
    const items = [expense(100), expense(50.1), refund(20.05), income(1000)];
    expect(totalSpending(items)).toBe(130.05);
    expect(totalIncome(items)).toBe(1000);
  });

  it("limits what is still refundable", () => {
    expect(refundableAmount({ amount: 100 }, [])).toBe(100);
    expect(refundableAmount({ amount: 100 }, [{ amount: 30 }, { amount: 20.5 }])).toBe(49.5);
    expect(refundableAmount({ amount: 100 }, [{ amount: 100 }])).toBe(0);
  });
});
