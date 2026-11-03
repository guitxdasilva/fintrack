"use client";

import { useMemo } from "react";
import { Pin, Plus } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { EmptyState } from "@/common/components/ui/empty-state";
import type { MonthValue } from "@/common/components/MonthNavigator";
import { sumMoney } from "@/lib/money";
import { useTransactions } from "@/modules/transactions/hooks/useTransactions";
import type { Transaction } from "@/types";
import { summarize, type StatementGroup } from "../../lib/statement";
import { StatementView } from "../statement/StatementView";
import { SummaryStrip } from "../statement/SummaryStrip";
import type { TransactionDefaults } from "../TransactionForm";

interface FixedViewProps {
  month: MonthValue;
  onEdit: (t: Transaction) => void;
  onNew: (type: "EXPENSE" | "INCOME", defaults: TransactionDefaults) => void;
}

const byDueDate = (a: Transaction, b: Transaction) => a.date.localeCompare(b.date);

function group(key: string, title: string, items: Transaction[], sign: 1 | -1): StatementGroup {
  return { key, title, items: [...items].sort(byDueDate), total: sign * sumMoney(items, (t) => t.amount) };
}

/** The month's fixed bills and income as a checklist: tap the icon to mark as paid. */
export function FixedView({ month, onEdit, onNew }: FixedViewProps) {
  const { data, isLoading } = useTransactions({
    month: String(month.month),
    year: String(month.year),
    isFixed: "true",
    limit: "200",
    sortBy: "date",
    sortOrder: "asc",
  });
  const transactions = useMemo(() => data?.data ?? [], [data]);
  const summary = summarize(transactions);

  const groups = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "EXPENSE");
    const income = transactions.filter((t) => t.type === "INCOME");
    return [
      ...(expenses.length ? [group("expense", "Contas fixas", expenses, -1)] : []),
      ...(income.length ? [group("income", "Receitas fixas", income, 1)] : []),
    ];
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Toque no ícone para marcar uma conta como paga.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onNew("INCOME", { isFixed: true })}
          >
            <Plus className="h-3.5 w-3.5" />
            Receita fixa
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => onNew("EXPENSE", { isFixed: true })}>
            <Plus className="h-3.5 w-3.5" />
            Conta fixa
          </Button>
        </div>
      </div>

      <SummaryStrip
        items={[
          { label: "Contas fixas", value: summary.expense },
          { label: "Já pagas", value: summary.paid, tone: "muted" },
          { label: "Falta pagar", value: summary.pending },
          { label: "Receitas fixas", value: summary.income, tone: "income" },
        ]}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <StatementView
          groups={groups}
          loading={isLoading}
          onEdit={onEdit}
          iconAction="paid"
          empty={
            <EmptyState
              icon={Pin}
              title="Nenhuma conta fixa neste mês"
              description="Cadastre aluguel, internet, salário e outras entradas e saídas que se repetem"
            />
          }
        />
      </div>
    </div>
  );
}
