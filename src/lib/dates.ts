/**
 * Calendar dates (transaction date, purchase date, goal deadline) have no
 * time-of-day meaning. They are stored at 12:00 UTC so that the calendar day
 * is the same on the server (UTC) and in any browser between UTC-11 and UTC+11.
 *
 * The client sends them as "yyyy-MM-dd"; the server only uses UTC getters.
 */

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date in "yyyy-MM-dd" (rejects 2026-02-31). */
export function isDateOnlyString(value: string): boolean {
  const match = value.match(DATE_ONLY_RE);
  if (!match) return false;
  return isValidDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** `month` is 0-based. */
export function isValidDate(year: number, month: number, day: number): boolean {
  return month >= 0 && month <= 11 && day >= 1 && day <= daysInMonth(year, month);
}

/** Builds a calendar date. `month` is 0-based and may overflow (e.g. 12 → next year). */
export function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 12));
}

/** Parses "yyyy-MM-dd" into a calendar date. Throws on invalid input. */
export function parseDateOnly(value: string): Date {
  const match = value.match(DATE_ONLY_RE);
  if (!match || !isDateOnlyString(value)) {
    throw new Error(`Invalid date-only string: ${value}`);
  }
  return dateOnly(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Serializes a Date using its *local* calendar day (client-side). */
export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Adds `months` to a calendar date, clamping the day (31/01 + 1 → 28/02). */
export function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, month));
  return dateOnly(year, month, day);
}

/** First day of the month `months` after the date's month. */
export function firstOfMonthAfter(date: Date, months: number): Date {
  return dateOnly(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

/** Inclusive UTC range covering the whole calendar month. */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1) - 1),
  };
}

/** 00:00 UTC of the day after the date's calendar day. */
export function startOfNextDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
}

/** Inclusive UTC range from the start of `from`'s day to the end of `to`'s day. */
export function dayRange(from: Date, to: Date): { start: Date; end: Date } {
  return {
    start: new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
    ),
    end: new Date(
      Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() + 1) - 1
    ),
  };
}
