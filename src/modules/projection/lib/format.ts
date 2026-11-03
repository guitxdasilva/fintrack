import type { ProjectionMonth } from "@/lib/projection";

const SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "Nov/26" */
export function shortMonth(m: Pick<ProjectionMonth, "month" | "year">): string {
  return `${SHORT[m.month]}/${String(m.year).slice(2)}`;
}

/** "Novembro 2026" */
export function longMonth(m: Pick<ProjectionMonth, "month" | "year">): string {
  return `${LONG[m.month]} ${m.year}`;
}

export function totalIncome(m: ProjectionMonth): number {
  return m.income.committed + m.income.estimated;
}

export function totalExpense(m: ProjectionMonth): number {
  const e = m.expense;
  return e.installments + e.fixed + e.variable + e.estimated;
}

/** Validated pair (CVD-safe, light & dark): positive / negative result, cumulative line. */
export const PROJECTION_COLORS = {
  positive: "#0d9488",
  negative: "#dc2626",
  cumulative: "#6366f1",
};
