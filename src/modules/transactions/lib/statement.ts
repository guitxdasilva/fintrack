import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateOnly } from "@/lib/dates";
import { sumMoney } from "@/lib/money";
import type { Transaction } from "@/types";

export interface StatementGroup {
  key: string;
  title: string;
  /** Income minus expenses of the group. */
  total: number;
  items: Transaction[];
}

const signed = (t: Transaction) => (t.type === "INCOME" ? t.amount : -t.amount);

/** "yyyy-MM-dd" of a stored calendar date (12:00 UTC). */
const dayKey = (iso: string) => iso.slice(0, 10);

function dayTitle(key: string, today: Date): string {
  const todayKey = formatDateOnly(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (key === todayKey) return "Hoje";
  if (key === formatDateOnly(yesterday)) return "Ontem";
  const label = format(new Date(`${key}T12:00:00Z`), "EEE, dd 'de' MMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Bank-statement grouping: one group per day, newest first.
 * `dateOf` picks the date shown (a card's purchase date instead of its billing date).
 */
export function groupByDay(
  transactions: Transaction[],
  today: Date,
  dateOf: (t: Transaction) => string = (t) => t.date
): StatementGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = dayKey(dateOf(t));
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      key,
      title: dayTitle(key, today),
      total: sumMoney(items, signed),
      items,
    }));
}

/** One group per category, largest spending first. */
export function groupByCategory(transactions: Transaction[]): StatementGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    groups.set(t.categoryId, [...(groups.get(t.categoryId) ?? []), t]);
  }

  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      title: `${items[0].category?.icon ?? ""} ${items[0].category?.name ?? "Sem categoria"}`.trim(),
      total: sumMoney(items, signed),
      items,
    }))
    .sort((a, b) => a.total - b.total);
}

export interface StatementSummary {
  income: number;
  expense: number;
  paid: number;
  pending: number;
}

export function summarize(transactions: Transaction[]): StatementSummary {
  const expenses = transactions.filter((t) => t.type === "EXPENSE");
  return {
    income: sumMoney(
      transactions.filter((t) => t.type === "INCOME"),
      (t) => t.amount
    ),
    expense: sumMoney(expenses, (t) => t.amount),
    paid: sumMoney(
      expenses.filter((t) => t.paid),
      (t) => t.amount
    ),
    pending: sumMoney(
      expenses.filter((t) => !t.paid),
      (t) => t.amount
    ),
  };
}
