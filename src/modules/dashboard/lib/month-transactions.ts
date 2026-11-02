import { roundMoney } from "@/lib/money";
import type { Transaction } from "@/types";

export interface CardGroup {
  cardId: string;
  cardName: string;
  cardIcon: string;
  hasClosingDay: boolean;
  total: number;
  transactions: Transaction[];
}

export interface CategorySlice {
  name: string;
  color: string;
  value: number;
  percentage: number;
}

/**
 * Splits the month's transactions into card groups (paid with a card) and
 * individual items. Groups are sorted by total, highest first.
 */
export function groupByCard(transactions: Transaction[]) {
  const individualItems: Transaction[] = [];
  const groups = new Map<string, CardGroup>();

  for (const t of transactions) {
    if (t.paymentType !== "CARD" || !t.card) {
      individualItems.push(t);
      continue;
    }

    const signed = t.type === "EXPENSE" ? t.amount : -t.amount;
    const group = groups.get(t.card.id);

    if (group) {
      group.total = roundMoney(group.total + signed);
      group.transactions.push(t);
    } else {
      groups.set(t.card.id, {
        cardId: t.card.id,
        cardName: t.card.name,
        cardIcon: t.card.icon || "💳",
        hasClosingDay: !!t.card.closingDayType,
        total: signed,
        transactions: [t],
      });
    }
  }

  return {
    individualItems,
    cardGroups: Array.from(groups.values()).sort((a, b) => b.total - a.total),
  };
}

/** Expense totals per category, sorted by value, with whole percentages. */
export function categoryBreakdown(transactions: Transaction[]): CategorySlice[] {
  const byCategory = new Map<string, { name: string; color: string; value: number }>();

  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const key = t.category?.name || "Outros";
    const slice = byCategory.get(key);
    if (slice) {
      slice.value = roundMoney(slice.value + t.amount);
    } else {
      byCategory.set(key, {
        name: `${t.category?.icon || ""} ${key}`.trim(),
        color: t.category?.color || "#6366f1",
        value: t.amount,
      });
    }
  }

  const slices = Array.from(byCategory.values()).sort((a, b) => b.value - a.value);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return slices.map((s) => ({
    ...s,
    percentage: total > 0 ? Math.round((s.value / total) * 100) : 0,
  }));
}

/** Toggle map for the selected ids: each one flips its current paid status. */
export function togglePaidUpdates(
  ids: Iterable<string>,
  transactions: Transaction[]
): Map<string, boolean> {
  const byId = new Map(transactions.map((t) => [t.id, t]));
  const updates = new Map<string, boolean>();
  for (const id of ids) {
    const t = byId.get(id);
    if (t) updates.set(id, !t.paid);
  }
  return updates;
}
