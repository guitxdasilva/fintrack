import { prisma } from "./prisma";
import { roundMoney } from "./money";

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
 * The user's known balance moved to `at`: initial balance plus every
 * transaction from the balance date up to (not including) `at`.
 * Null when the user never informed a balance.
 */
export async function balanceAt(userId: string, at: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { initialBalance: true, initialBalanceDate: true },
  });

  if (!user?.initialBalanceDate) return null;

  const since = user.initialBalanceDate;
  return {
    since,
    initialBalance: user.initialBalance,
    amount: roundMoney(user.initialBalance + (await netBetween(userId, since, at))),
  };
}
