import { describe, expect, it } from "vitest";
import { parseDateOnly } from "../dates";
import {
  formatClosingDayDescription,
  getCreditCardMonthOffset,
  getEffectiveClosingDay,
  getInvoicePeriod,
} from "../invoice";
import { scheduleDate } from "../transactions/schedule";

describe("getEffectiveClosingDay", () => {
  it("FIXED clamps to the month's last day", () => {
    expect(getEffectiveClosingDay("FIXED", 10, 2, 2026)).toBe(10);
    expect(getEffectiveClosingDay("FIXED", 31, 1, 2026)).toBe(28);
    expect(getEffectiveClosingDay("FIXED", 31, 3, 2026)).toBe(30);
  });

  it("BEFORE_END counts back from the month's last day", () => {
    expect(getEffectiveClosingDay("BEFORE_END", 5, 0, 2026)).toBe(26);
    expect(getEffectiveClosingDay("BEFORE_END", 5, 1, 2026)).toBe(23);
    expect(getEffectiveClosingDay("BEFORE_END", 40, 1, 2026)).toBe(1);
  });
});

describe("getInvoicePeriod", () => {
  it("runs from the day after last month's closing to this month's closing", () => {
    const { start, end, effectiveClosing } = getInvoicePeriod("FIXED", 10, 3, 2026);
    expect(start.toISOString()).toBe("2026-03-11T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-04-10T23:59:59.999Z");
    expect(effectiveClosing).toBe(10);
  });

  it("wraps around January", () => {
    const { start } = getInvoicePeriod("FIXED", 10, 0, 2026);
    expect(start.toISOString()).toBe("2025-12-11T00:00:00.000Z");
  });
});

describe("getCreditCardMonthOffset", () => {
  it("bills next month when bought on or before the closing day", () => {
    expect(getCreditCardMonthOffset(parseDateOnly("2026-03-10"), "FIXED", 10)).toBe(1);
  });

  it("bills two months ahead when bought after the closing day", () => {
    expect(getCreditCardMonthOffset(parseDateOnly("2026-03-11"), "FIXED", 10)).toBe(2);
  });
});

describe("credit purchase → invoice", () => {
  // Card closing on day 10: a purchase is billed on day 1 of the invoice
  // month, and must fall inside that month's invoice period.
  it.each([
    ["2026-03-05", 3], // before closing → April invoice
    ["2026-03-10", 3], // on closing day → April invoice
    ["2026-03-11", 4], // after closing → May invoice
    ["2026-12-20", 1], // year rollover → February invoice
  ])("purchase on %s lands in invoice month %i", (purchase, invoiceMonth) => {
    const purchaseDate = parseDateOnly(purchase);
    const offset = getCreditCardMonthOffset(purchaseDate, "FIXED", 10);
    const billed = scheduleDate(purchaseDate, 0, offset);

    expect(billed.getUTCMonth()).toBe(invoiceMonth);

    const { start, end } = getInvoicePeriod("FIXED", 10, invoiceMonth, billed.getUTCFullYear());
    expect(billed >= start && billed <= end).toBe(true);
  });
});

describe("formatClosingDayDescription", () => {
  it("describes both closing types", () => {
    expect(formatClosingDayDescription("FIXED", 10)).toBe("Dia 10");
    expect(formatClosingDayDescription("BEFORE_END", 1)).toBe("1 dia antes do fim do mês");
    expect(formatClosingDayDescription("BEFORE_END", 5)).toBe("5 dias antes do fim do mês");
  });
});
