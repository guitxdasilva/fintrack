"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { EmptyState } from "@/common/components/ui/empty-state";
import type { MonthValue } from "@/common/components/MonthNavigator";
import { useTransactions } from "@/modules/transactions/hooks/useTransactions";
import type { Transaction } from "@/types";
import { groupByDay, summarize, withoutLinkedRefunds } from "../../lib/statement";
import { StatementView } from "../statement/StatementView";
import { SummaryStrip } from "../statement/SummaryStrip";
import { TransactionFilters, type FilterValues } from "../TransactionFilters";

/** Up to this many transactions are listed for a month (API maximum per page). */
const MONTH_LIMIT = 200;

/** API query params for the active filters (empty filters are omitted). */
export function filterParams(filters: FilterValues | null, { month, year }: MonthValue) {
  const params: Record<string, string> = { month: String(month), year: String(year) };
  if (!filters) return params;
  if (filters.type !== "ALL") params.type = filters.type;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.search) params.search = filters.search;
  if (filters.cardId) params.cardId = filters.cardId;
  if (filters.paid) params.paid = filters.paid;
  if (filters.isFixed) params.isFixed = filters.isFixed;
  if (filters.paymentType) params.paymentType = filters.paymentType;
  return params;
}

interface AllViewProps {
  month: MonthValue;
  onEdit: (t: Transaction) => void;
  onFiltersChange: (filters: FilterValues) => void;
}

/** Every transaction of the month, bank-statement style (grouped by day). */
export function AllView({ month, onEdit, onFiltersChange }: AllViewProps) {
  const [filters, setFilters] = useState<FilterValues | null>(null);
  const [today] = useState(() => new Date());

  const handleFilters = useCallback(
    (next: FilterValues) => {
      setFilters(next);
      onFiltersChange(next);
    },
    [onFiltersChange]
  );

  const { data, isLoading } = useTransactions({
    ...filterParams(filters, month),
    limit: String(MONTH_LIMIT),
    sortBy: "date",
    sortOrder: "desc",
  });
  const transactions = useMemo(() => data?.data ?? [], [data]);
  const groups = useMemo(
    () => groupByDay(withoutLinkedRefunds(transactions), today),
    [transactions, today]
  );
  const summary = summarize(transactions);
  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <TransactionFilters onFilterChange={handleFilters} />
      </div>

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
              icon={ArrowLeftRight}
              title="Nenhuma transação encontrada"
              description="Nenhuma transação neste mês com os filtros atuais"
            />
          }
        />
        {total > MONTH_LIMIT && (
          <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
            Mostrando {MONTH_LIMIT} de {total} transações. Use os filtros para refinar.
          </p>
        )}
      </div>
    </div>
  );
}
