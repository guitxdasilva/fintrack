import { addMonthsClamped, dateOnly, daysInMonth, firstOfMonthAfter } from "../dates";
import { roundMoney } from "../money";

/**
 * Splits `total` into `count` installments rounded to cents.
 * The last installment absorbs the rounding difference so the sum is exact.
 */
export function splitInstallments(total: number, count: number): number[] {
  const base = roundMoney(total / count);
  const last = roundMoney(total - base * (count - 1));
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? last : base));
}

/**
 * Billing date of the i-th (0-based) occurrence of a calendar date.
 * - creditMonthOffset > 0: credit card purchase, billed on day 1 of the
 *   invoice month (purchase month + offset + i).
 * - otherwise: same day each month, clamped to the month's last day.
 */
export function scheduleDate(
  baseDate: Date,
  index: number,
  creditMonthOffset = 0
): Date {
  return creditMonthOffset > 0
    ? firstOfMonthAfter(baseDate, index + creditMonthOffset)
    : addMonthsClamped(baseDate, index);
}

/** "yyyy-MM" of a stored calendar date. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Moves a transaction to another month ("yyyy-MM"), e.g. an installment that
 * landed in the wrong invoice. Credit card charges are billed on day 1 of the
 * invoice month; anything else keeps its day (clamped to the month's length).
 */
export function moveToMonth(current: Date, month: string, creditBilled: boolean): Date {
  const [year, m] = month.split("-").map(Number);
  const day = creditBilled ? 1 : Math.min(current.getUTCDate(), daysInMonth(year, m - 1));
  return dateOnly(year, m - 1, day);
}
