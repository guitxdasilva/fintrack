/**
 * Utilitários para cálculo de fechamento de fatura de cartão.
 *
 * Dois modos de fechamento:
 * - FIXED: dia fixo do mês (ex: sempre dia 15). Se o mês não tem esse dia, usa o último.
 * - BEFORE_END: X dias antes do último dia do mês (ex: Nubank = 3 → Jan(31)=28, Fev(28)=25)
 */

/**
 * Retorna o último dia de um mês/ano.
 */
export function getLastDayOfMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calcula o dia efetivo de fechamento para um mês/ano.
 *
 * @param closingDayType - "FIXED" ou "BEFORE_END"
 * @param closingDayValue - dia fixo (1-31) ou offset (1-10)
 * @param month - mês (0-indexed: 0=Jan, 11=Dez)
 * @param year - ano
 */
export function getEffectiveClosingDay(
  closingDayType: string,
  closingDayValue: number,
  month: number,
  year: number
): number {
  const lastDay = getLastDayOfMonth(month, year);

  if (closingDayType === "BEFORE_END") {
    // Ex: Nubank value=3 → Jan(31): 31-3=28, Fev(28): 28-3=25
    return Math.max(1, lastDay - closingDayValue);
  }

  // FIXED: usa o dia ou o último dia do mês se for menor
  return Math.min(closingDayValue, lastDay);
}

/**
 * Retorna o período da fatura (início e fim) para um mês/ano.
 *
 * Período: dia seguinte ao fechamento do mês anterior → dia de fechamento do mês atual.
 *
 * Exemplo Nubank (BEFORE_END, value=3):
 * - Fatura de Fev/2026: de 29/Jan até 25/Fev
 * - Fatura de Mar/2026: de 26/Fev até 28/Mar
 */
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

  // Mês anterior
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevEffectiveClosing = getEffectiveClosingDay(
    closingDayType,
    closingDayValue,
    prevMonth,
    prevYear
  );

  // Início: dia seguinte ao fechamento do mês anterior
  const start = new Date(prevYear, prevMonth, prevEffectiveClosing + 1);
  // Fim: dia do fechamento do mês atual (23:59:59)
  const end = new Date(year, month, effectiveClosing, 23, 59, 59, 999);

  return { start, end, effectiveClosing };
}

/**
 * Formata uma descrição legível do tipo de fechamento.
 */
export function formatClosingDayDescription(
  closingDayType: string,
  closingDayValue: number
): string {
  if (closingDayType === "BEFORE_END") {
    return `${closingDayValue} dia${closingDayValue > 1 ? "s" : ""} antes do fim do mês`;
  }
  return `Dia ${closingDayValue}`;
}
