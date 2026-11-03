import { roundMoney, sumMoney } from "./money";

/**
 * Refunds are stored as INCOME (they bring money back) but are not income:
 * they reduce spending. Every total (invoice, dashboard, budget, category
 * charts, projection) goes through these helpers so they agree.
 */

interface Movement {
  type: "INCOME" | "EXPENSE";
  amount: number;
  isRefund?: boolean | null;
}

/** How much a movement adds to spending: expenses positive, refunds negative. */
export function spendingOf(t: Movement): number {
  if (t.type === "EXPENSE") return t.amount;
  return t.isRefund ? -t.amount : 0;
}

/** How much a movement adds to income (refunds don't). */
export function incomeOf(t: Movement): number {
  return t.type === "INCOME" && !t.isRefund ? t.amount : 0;
}

export const totalSpending = (items: Movement[]) => sumMoney(items, spendingOf);
export const totalIncome = (items: Movement[]) => sumMoney(items, incomeOf);

/** Amount still refundable on a purchase. */
export function refundableAmount(purchase: { amount: number }, refunds: { amount: number }[]) {
  return Math.max(0, roundMoney(purchase.amount - sumMoney(refunds, (r) => r.amount)));
}
