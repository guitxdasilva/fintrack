import { roundMoney } from "../money";

/**
 * Heuristic detection of recurring transactions (subscriptions, bills,
 * salary) entered as one-off ones. No AI: a future AI detector can implement
 * `RecurrenceDetector` and replace this one without changing callers.
 */

export interface RecurrenceCandidate {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  isFixed: boolean;
  installmentGroupId: string | null;
  categoryId: string;
}

export interface RecurringSuggestion {
  /** Normalized description; identifies the suggestion (apply / dismiss). */
  key: string;
  type: "INCOME" | "EXPENSE";
  /** Description and category of the most recent occurrence. */
  description: string;
  /** Latest amount, or the recent median when the amount varies (utility bills). */
  amount: number;
  /** Set when recent amounts vary beyond small price changes. */
  amountRange: { min: number; max: number } | null;
  categoryId: string;
  /** Distinct months it appeared in, within the lookback window. */
  monthsSeen: number;
  transactionIds: string[];
  lastTransactionId: string;
  lastDate: Date;
}

export type RecurrenceDetector = (
  transactions: RecurrenceCandidate[],
  today: Date
) => RecurringSuggestion[];

export const RECURRENCE_LOOKBACK_MONTHS = 6;
const MIN_MONTHS = 3;
/** Entries are often registered late: a gap of up to this many months still counts as active. */
const ACTIVE_WITHIN_MONTHS = 2;
/** Recent amounts within this ratio (max / min) are one price; the latest is used. */
const STABLE_SPREAD = 1.3;
/** Up to this ratio it is a variable bill (power, water); the median is used. Beyond, no suggestion. */
const MAX_SPREAD = 2;
/** More than this per month on average is shopping, not a bill (iFood, market). */
const MAX_PER_MONTH = 1.5;

const INSTALLMENT_TEXT = /\bparcela\b|\(\d+\/\d+\)|\b\d+\/\d+\b/i;

/** "Ebn*Spotify" → "ebn spotify"; "Tim*51981736166" → "tim". */
export function recurrenceKey(description: string): string {
  return description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\d+/g, " ")
    .replace(/[^a-z]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : roundMoney((sorted[mid - 1] + sorted[mid]) / 2);
}

const monthIndex = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

export const detectRecurringHeuristic: RecurrenceDetector = (transactions, today) => {
  const currentIdx = monthIndex(today);
  const oldestIdx = currentIdx - RECURRENCE_LOOKBACK_MONTHS + 1;

  const groups = new Map<string, RecurrenceCandidate[]>();
  for (const t of transactions) {
    if (t.isFixed || t.installmentGroupId) continue;
    if (INSTALLMENT_TEXT.test(t.description)) continue;
    const idx = monthIndex(t.date);
    if (idx < oldestIdx || idx > currentIdx) continue;

    const key = recurrenceKey(t.description);
    if (key.length < 3) continue;
    const groupKey = `${t.type}:${key}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), t]);
  }

  const suggestions: RecurringSuggestion[] = [];

  for (const items of groups.values()) {
    const months = new Set(items.map((t) => monthIndex(t.date)));
    if (months.size < MIN_MONTHS) continue;
    if (items.length / months.size > MAX_PER_MONTH) continue;

    const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
    const last = sorted[sorted.length - 1];
    if (monthIndex(last.date) < currentIdx - ACTIVE_WITHIN_MONTHS) continue; // stopped

    const recent = sorted.slice(-MIN_MONTHS).map((t) => t.amount);
    const min = Math.min(...recent);
    const max = Math.max(...recent);
    if (max > min * MAX_SPREAD) continue;
    const stable = max <= min * STABLE_SPREAD;

    suggestions.push({
      key: recurrenceKey(last.description),
      type: last.type,
      description: last.description,
      amount: stable ? last.amount : median(recent),
      amountRange: stable ? null : { min, max },
      categoryId: last.categoryId,
      monthsSeen: months.size,
      transactionIds: sorted.map((t) => t.id),
      lastTransactionId: last.id,
      lastDate: last.date,
    });
  }

  return suggestions.sort((a, b) => b.amount - a.amount);
};

/**
 * The detector in use. An AI-backed one (behind ANTHROPIC_API_KEY) can be
 * returned here later; callers only depend on `RecurrenceDetector`.
 */
export function getRecurrenceDetector(): RecurrenceDetector {
  return detectRecurringHeuristic;
}
