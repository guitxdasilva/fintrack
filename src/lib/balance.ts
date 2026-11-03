import { prisma } from "./prisma";
import { roundMoney } from "./money";
import { startOfNextDay } from "./dates";

/** Income minus expenses of the user's transactions dated in [from, to). */
export async function netBetween(userId: string, from: Date, to: Date): Promise<number> {
  if (to <= from) return 0;

  const totals = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: from, lt: to } },
    _sum: { amount: true },
  });

  const sum = (type: "INCOME" | "EXPENSE") =>
    totals.find((t) => t.type === type)?._sum.amount ?? 0;

  return roundMoney(sum("INCOME") - sum("EXPENSE"));
}

/**
 * The informed balance is the end-of-day balance of its date, so that day's
 * transactions are already in it: only later days move it.
 */
export function balanceCountsFrom(balanceDate: Date): Date {
  return startOfNextDay(balanceDate);
}

/**
 * The user's known balance moved to `at`: initial balance plus every
 * transaction after the balance date up to (not including) `at`.
 * Null when the user never informed a balance.
 */
export async function balanceAt(userId: string, at: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { initialBalance: true, initialBalanceDate: true },
  });

  if (!user?.initialBalanceDate) return null;

  const countsFrom = balanceCountsFrom(user.initialBalanceDate);
  return {
    since: user.initialBalanceDate,
    countsFrom,
    initialBalance: user.initialBalance,
    amount: roundMoney(user.initialBalance + (await netBetween(userId, countsFrom, at))),
  };
}
