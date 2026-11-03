import { prisma } from "../prisma";
import { addMonthsClamped, monthRange } from "../dates";
import {
  RECURRENCE_LOOKBACK_MONTHS,
  getRecurrenceDetector,
  recurrenceKey,
  type RecurringSuggestion,
} from "./detect";

/** Months of fixed entries created when a suggestion is applied. */
export const RECURRENCE_SERIES_MONTHS = 12;

type TxType = "INCOME" | "EXPENSE";

const typeKey = (type: TxType, key: string) => `${type}:${key}`;

/**
 * Suggestions for the user, without dismissed ones and without those already
 * covered by a fixed series from this month on.
 */
export async function findRecurringSuggestions(userId: string, today: Date) {
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const from = monthRange(year, month - RECURRENCE_LOOKBACK_MONTHS + 1).start;
  const to = monthRange(year, month).end;

  const [transactions, futureFixed, dismissed] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        date: true,
        isFixed: true,
        installmentGroupId: true,
        categoryId: true,
      },
    }),
    prisma.transaction.findMany({
      where: { userId, isFixed: true, date: { gte: monthRange(year, month).start } },
      select: { description: true, type: true },
      distinct: ["description", "type"],
    }),
    prisma.recurrenceDismissal.findMany({ where: { userId }, select: { key: true, type: true } }),
  ]);

  const covered = new Set([
    ...futureFixed.map((t) => typeKey(t.type, recurrenceKey(t.description))),
    ...dismissed.map((d) => typeKey(d.type, d.key)),
  ]);

  return getRecurrenceDetector()(transactions, today).filter(
    (s) => !covered.has(typeKey(s.type, s.key))
  );
}

/** Suggestion plus what the UI shows about it. */
export async function describeSuggestions(suggestions: RecurringSuggestion[]) {
  if (suggestions.length === 0) return [];

  const lasts = await prisma.transaction.findMany({
    where: { id: { in: suggestions.map((s) => s.lastTransactionId) } },
    select: {
      id: true,
      category: { select: { name: true, icon: true } },
      card: { select: { name: true } },
    },
  });
  const byId = new Map(lasts.map((t) => [t.id, t]));

  return suggestions.map((s) => {
    const last = byId.get(s.lastTransactionId);
    return {
      key: s.key,
      type: s.type,
      description: s.description,
      amount: s.amount,
      amountRange: s.amountRange,
      monthsSeen: s.monthsSeen,
      occurrences: s.transactionIds.length,
      categoryName: last?.category.name ?? null,
      categoryIcon: last?.category.icon ?? null,
      cardName: last?.card?.name ?? null,
      lastDate: s.lastDate.toISOString(),
      firstNewDate: addMonthsClamped(s.lastDate, 1).toISOString(),
      seriesMonths: RECURRENCE_SERIES_MONTHS,
    };
  });
}

/**
 * Turns a suggestion into a fixed entry: marks its occurrences as fixed and
 * creates the next RECURRENCE_SERIES_MONTHS months, skipping months that
 * already have it. Recomputed server-side: the client only sends the key.
 * Returns null when there's no such suggestion (anymore).
 */
export async function applyRecurringSuggestion(
  userId: string,
  type: TxType,
  key: string,
  today: Date
) {
  const suggestion = (await findRecurringSuggestions(userId, today)).find(
    (s) => s.type === type && s.key === key
  );
  if (!suggestion) return null;

  const last = await prisma.transaction.findUniqueOrThrow({
    where: { id: suggestion.lastTransactionId },
  });

  const lastSeriesDate = addMonthsClamped(last.date, RECURRENCE_SERIES_MONTHS);
  const existing = await prisma.transaction.findMany({
    where: {
      userId,
      type,
      date: { gt: last.date, lte: monthRange(lastSeriesDate.getUTCFullYear(), lastSeriesDate.getUTCMonth()).end },
    },
    select: { description: true, date: true },
  });
  const takenMonths = new Set(
    existing
      .filter((t) => recurrenceKey(t.description) === key)
      .map((t) => t.date.getUTCFullYear() * 12 + t.date.getUTCMonth())
  );

  const groupId = globalThis.crypto.randomUUID();
  const series = Array.from({ length: RECURRENCE_SERIES_MONTHS }, (_, i) => i + 1)
    .map((i) => ({ i, date: addMonthsClamped(last.date, i) }))
    .filter(({ date }) => !takenMonths.has(date.getUTCFullYear() * 12 + date.getUTCMonth()))
    .map(({ i, date }) => ({
      amount: suggestion.amount,
      type,
      description: last.description,
      date,
      purchaseDate: last.purchaseDate ? addMonthsClamped(last.purchaseDate, i) : null,
      userId,
      categoryId: last.categoryId,
      paymentType: last.paymentType,
      cardId: last.cardId,
      cardType: last.cardType,
      installments: RECURRENCE_SERIES_MONTHS,
      currentInstallment: i,
      installmentGroupId: groupId,
      isFixed: true,
    }));

  const [marked, created] = await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { id: { in: suggestion.transactionIds }, userId },
      data: { isFixed: true },
    }),
    prisma.transaction.createMany({ data: series }),
  ]);

  return { marked: marked.count, created: created.count };
}

export async function dismissRecurringSuggestion(userId: string, type: TxType, key: string) {
  await prisma.recurrenceDismissal.upsert({
    where: { userId_type_key: { userId, type, key } },
    create: { userId, type, key },
    update: {},
  });
}
