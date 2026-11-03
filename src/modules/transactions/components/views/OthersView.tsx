"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { EmptyState } from "@/common/components/ui/empty-state";
import type { MonthValue } from "@/common/components/MonthNavigator";
import { useTransactions } from "@/modules/transactions/hooks/useTransactions";
import type { Transaction } from "@/types";
import { groupByCategory, summarize } from "../../lib/statement";
import { StatementView } from "../statement/StatementView";
import { SummaryStrip } from "../statement/SummaryStrip";

interface OthersViewProps {
  month: MonthValue;
  onEdit: (t: Transaction) => void;
}

/** Variable entries not paid with a card (PIX, cash, transfer, bank slip), by category. */
export function OthersView({ month, onEdit }: OthersViewProps) {
  const { data, isLoading } = useTransactions({
    month: String(month.month),
    year: String(month.year),
    isFixed: "false",
    nonCard: "true",
    limit: "200",
    sortBy: "date",
    sortOrder: "desc",
  });
  const transactions = useMemo(() => data?.data ?? [], [data]);
  const groups = useMemo(() => groupByCategory(transactions), [transactions]);
  const summary = summarize(transactions);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Lançamentos variáveis fora do cartão (PIX, dinheiro, transferência, boleto), por categoria.
      </p>

      <SummaryStrip
        items={[
          { label: "Receitas", value: summary.income, tone: "income" },
          { label: "Despesas", value: summary.expense },
          { label: "Pago", value: summary.paid, tone: "muted" },
          { label: "Pendente", value: summary.pending, tone: "muted" },
        ]}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <StatementView
          groups={groups}
          loading={isLoading}
          onEdit={onEdit}
          empty={
            <EmptyState
              icon={Wallet}
              title="Nada por aqui"
              description="Nenhum lançamento avulso fora do cartão neste mês"
            />
          }
        />
      </div>
    </div>
  );
}
