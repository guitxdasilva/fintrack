import { daysInMonth } from "./dates";

export function getLastDayOfMonth(month: number, year: number): number {
  return daysInMonth(year, month);
}

export function getEffectiveClosingDay(
  closingDayType: string,
  closingDayValue: number,
  month: number,
  year: number
): number {
  const lastDay = getLastDayOfMonth(month, year);

  if (closingDayType === "BEFORE_END") {
    return Math.max(1, lastDay - closingDayValue);
  }

  return Math.min(closingDayValue, lastDay);
}

export function getInvoicePeriod(
  closingDayType: string,
  closingDayValue: number,
  month: number,
  year: number
) {
  const effectiveClosing = getEffectiveClosingDay(
    closingDayType,
    closingDayValue,
    month,
    year
  );

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevEffectiveClosing = getEffectiveClosingDay(
    closingDayType,
    closingDayValue,
    prevMonth,
    prevYear
  );

  const start = new Date(Date.UTC(prevYear, prevMonth, prevEffectiveClosing + 1));
  const end = new Date(Date.UTC(year, month, effectiveClosing + 1) - 1);

  return { start, end, effectiveClosing };
}

export function formatClosingDayDescription(
  closingDayType: string,
  closingDayValue: number
): string {
  if (closingDayType === "BEFORE_END") {
    return `${closingDayValue} dia${closingDayValue > 1 ? "s" : ""} antes do fim do mês`;
  }
  return `Dia ${closingDayValue}`;
}

/** `purchaseDate` must be a calendar date (see lib/dates.ts). */
export function getCreditCardMonthOffset(
  purchaseDate: Date,
  closingDayType: string,
  closingDayValue: number
): number {
  const month = purchaseDate.getUTCMonth();
  const year = purchaseDate.getUTCFullYear();
  const purchaseDay = purchaseDate.getUTCDate();

  const effectiveClosing = getEffectiveClosingDay(
    closingDayType,
    closingDayValue,
    month,
    year
  );

  if (purchaseDay <= effectiveClosing) {
    return 1;
  } else {
    return 2;
  }
}
