"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDownCircle, Pin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Badge } from "@/common/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { CategorySummary, Transaction } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS } from "@/types";
import type { PaymentType } from "@/types";
import { PieChartIcon } from "lucide-react";
import { EmptyState } from "@/common/components/ui/empty-state";

interface ExpenseChartProps {
  data: CategorySummary[];
  transactions?: Transaction[];
  isLoading?: boolean;
}

export function ExpenseChart({ data, transactions = [], isLoading }: ExpenseChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        name: item.category,
        value: item.total,
        color: item.color,
        percentage: item.percentage,
      })),
    [data]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-[250px] w-[250px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
          <CardDescription>Distribuição dos gastos do mês</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={PieChartIcon}
            title="Sem despesas"
            description="Nenhuma despesa registrada neste mês"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Distribuição dos gastos do mês</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div className="h-[250px] w-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                  style={{ cursor: "pointer" }}
                  onClick={(_: unknown, index: number) => {
                    const item = chartData[index];
                    if (item) setSelectedCategory(item.name);
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.value as number)}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            {chartData.map((item) => (
              <button
                key={item.name}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60 text-left"
                onClick={() => setSelectedCategory(item.name)}
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(item.value)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    <CategoryDetailModal
      categoryName={selectedCategory}
      transactions={transactions}
      chartData={chartData}
      onClose={() => setSelectedCategory(null)}
    />
    </>
  );
}

function CategoryDetailModal({
  categoryName,
  transactions,
  chartData,
  onClose,
}: {
  categoryName: string | null;
  transactions: Transaction[];
  chartData: { name: string; value: number; color: string; percentage: number }[];
  onClose: () => void;
}) {
  const category = chartData.find((c) => c.name === categoryName);

  const categoryTransactions = useMemo(() => {
    if (!categoryName) return [];
    return transactions
      .filter(
        (t) => t.type === "EXPENSE" && t.category?.name === categoryName
      )
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [categoryName, transactions]);

  return (
    <Dialog open={!!categoryName} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: (category?.color || "#6366f1") + "20" }}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: category?.color || "#6366f1" }}
              />
            </div>
            {categoryName}
            <Badge variant="outline" className="ml-auto font-semibold text-red-500">
              -{formatCurrency(category?.value ?? 0)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(category?.value ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total gasto</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-2xl font-bold">{categoryTransactions.length}</p>
            <p className="text-xs text-muted-foreground">Transações</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-2xl font-bold">{category?.percentage ?? 0}%</p>
            <p className="text-xs text-muted-foreground">Do total</p>
          </div>
        </div>

        <div className="space-y-2">
          {categoryTransactions.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${t.paid ? "opacity-60" : ""}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate" title={t.description}>
                    {t.description.length > 40 ? t.description.slice(0, 40) + "…" : t.description}
                  </p>
                  {t.isFixed && (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
                    >
                      <Pin className="h-3 w-3" />
                      Fixa
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {t.paymentType && (
                    <span className="text-xs text-muted-foreground">
                      {PAYMENT_TYPE_ICONS[t.paymentType as PaymentType]}{" "}
                      {PAYMENT_TYPE_LABELS[t.paymentType as PaymentType]}
                    </span>
                  )}
                  {t.card && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {t.card.icon || "💳"} {t.card.name}
                    </Badge>
                  )}
                  {t.installments && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {t.currentInstallment}/{t.installments}
                    </Badge>
                  )}
                  {t.paid && (
                    <Badge variant="outline" className="text-xs font-normal text-emerald-600 border-emerald-200">
                      Pago
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(t.date), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <p className="text-sm font-semibold text-red-500 whitespace-nowrap">
                -{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
