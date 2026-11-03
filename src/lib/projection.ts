import { roundMoney } from "./money";

/**
 * Month-by-month cash projection.
 *
 * Committed = what is already registered for the month (installments, fixed
 * income/expenses, card bills, anything entered in advance).
 * Estimated = fills what is usually there but not registered yet, from the
 * average of the months before the projection starts:
 *   - variable expenses: average minus what is already registered that month;
 *   - income: the average of non-fixed income, only for months with no
 *     income registered at all (avoids double counting a salary that was
 *     later registered as fixed).
 */

export interface ProjectionTransaction {
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: Date;
  isFixed: boolean;
  installmentGroupId: string | null;
}

export interface ProjectionMonth {
  month: number;
  year: number;
  income: { committed: number; estimated: number };
  expense: { installments: number; fixed: number; variable: number; estimated: number };
  net: number;
  cumulative: number;
}

export interface Projection {
  months: ProjectionMonth[];
  averages: { variableExpense: number; variableIncome: number; historyMonths: number };
}

export const PROJECTION_HISTORY_MONTHS = 3;

type Kind = "installments" | "fixed" | "variable";

function kindOf(t: ProjectionTransaction): Kind {
  if (t.isFixed) return "fixed";
  if (t.installmentGroupId) return "installments";
  return "variable";
}

function monthIndex(year: number, month: number) {
  return year * 12 + month;
}

/**
 * @param transactions every transaction from `PROJECTION_HISTORY_MONTHS`
 *   before the start month through the last projected month.
 */
export function buildProjection(
  transactions: ProjectionTransaction[],
  start: { month: number; year: number },
  monthCount: number,
  includeEstimates: boolean
): Projection {
  const startIdx = monthIndex(start.year, start.month);

  const empty = () => ({
    income: { committed: 0, estimated: 0, variable: 0 },
    expense: { installments: 0, fixed: 0, variable: 0, estimated: 0 },
  });
  const buckets = new Map<number, ReturnType<typeof empty>>();
  for (let i = -PROJECTION_HISTORY_MONTHS; i < monthCount; i++) {
    buckets.set(startIdx + i, empty());
  }

  for (const t of transactions) {
    const bucket = buckets.get(monthIndex(t.date.getUTCFullYear(), t.date.getUTCMonth()));
    if (!bucket) continue;
    if (t.type === "INCOME") {
      bucket.income.committed += t.amount;
      if (!t.isFixed) bucket.income.variable += t.amount;
    } else {
      bucket.expense[kindOf(t)] += t.amount;
    }
  }

  let historyExpense = 0;
  let historyIncome = 0;
  for (let i = -PROJECTION_HISTORY_MONTHS; i < 0; i++) {
    const b = buckets.get(startIdx + i)!;
    historyExpense += b.expense.variable;
    historyIncome += b.income.variable;
  }
  const variableExpense = roundMoney(historyExpense / PROJECTION_HISTORY_MONTHS);
  const variableIncome = roundMoney(historyIncome / PROJECTION_HISTORY_MONTHS);

  let cumulative = 0;
  const months: ProjectionMonth[] = [];

  for (let i = 0; i < monthCount; i++) {
    const b = buckets.get(startIdx + i)!;
    const idx = startIdx + i;

    const estimatedExpense = includeEstimates
      ? roundMoney(Math.max(0, variableExpense - b.expense.variable))
      : 0;
    const estimatedIncome =
      includeEstimates && b.income.committed === 0 ? variableIncome : 0;

    const income = { committed: roundMoney(b.income.committed), estimated: estimatedIncome };
    const expense = {
      installments: roundMoney(b.expense.installments),
      fixed: roundMoney(b.expense.fixed),
      variable: roundMoney(b.expense.variable),
      estimated: estimatedExpense,
    };

    const net = roundMoney(
      income.committed +
        income.estimated -
        expense.installments -
        expense.fixed -
        expense.variable -
        expense.estimated
    );
    cumulative = roundMoney(cumulative + net);

    months.push({
      month: idx % 12,
      year: Math.floor(idx / 12),
      income,
      expense,
      net,
      cumulative,
    });
  }

  return {
    months,
    averages: { variableExpense, variableIncome, historyMonths: PROJECTION_HISTORY_MONTHS },
  };
}
