"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Wallet, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { BudgetSummary } from "@/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface BudgetData {
  budgets: BudgetSummary[];
  totalBudget: number;
  totalSpent: number;
}

export default function BudgetPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/budget?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch {
      toast.error("Erro ao carregar orçamentos");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  function handlePrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const totalPercentage =
    data && data.totalBudget > 0
      ? Math.round((data.totalSpent / data.totalBudget) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seus gastos por categoria
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        </div>
      ) : !data || data.budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum orçamento definido</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Defina um orçamento mensal nas suas categorias de despesa para acompanhar seus gastos.
              Vá em <strong>Categorias</strong> e edite uma categoria para adicionar um orçamento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orçamento Total</p>
                    <p className="text-lg font-bold">{formatCurrency(data.totalBudget)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    totalPercentage > 100 ? "bg-red-500/10" : totalPercentage > 80 ? "bg-amber-500/10" : "bg-emerald-500/10"
                  }`}>
                    <TrendingUp className={`h-5 w-5 ${
                      totalPercentage > 100 ? "text-red-500" : totalPercentage > 80 ? "text-amber-500" : "text-emerald-500"
                    }`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                    <p className="text-lg font-bold">{formatCurrency(data.totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    data.totalBudget - data.totalSpent < 0 ? "bg-red-500/10" : "bg-emerald-500/10"
                  }`}>
                    {data.totalBudget - data.totalSpent < 0 ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Disponível</p>
                    <p className={`text-lg font-bold ${
                      data.totalBudget - data.totalSpent < 0 ? "text-red-500" : "text-emerald-500"
                    }`}>
                      {formatCurrency(data.totalBudget - data.totalSpent)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className={`text-sm font-bold ${
                  totalPercentage > 100 ? "text-red-500" : totalPercentage > 80 ? "text-amber-500" : "text-emerald-500"
                }`}>
                  {totalPercentage}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalPercentage > 100
                      ? "bg-red-500"
                      : totalPercentage > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(data.totalSpent)} gasto
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(data.totalBudget)} orçamento
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Category budgets */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Por Categoria</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.budgets.map((item) => (
                <BudgetCard key={item.categoryId} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BudgetCard({ item }: { item: BudgetSummary }) {
  const remaining = item.budget - item.spent;
  const isOver = remaining < 0;
  const isWarning = item.percentage > 80 && item.percentage <= 100;

  return (
    <Card className={`relative overflow-hidden ${
      isOver ? "border-red-500/30" : isWarning ? "border-amber-500/30" : ""
    }`}>
      {isOver && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
      )}
      {isWarning && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
            style={{ backgroundColor: item.categoryColor + "20" }}
          >
            {item.categoryIcon || "📦"}
          </div>
          <span className="truncate">{item.categoryName}</span>
          {isOver && (
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 ml-auto" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">
            {formatCurrency(item.spent)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {formatCurrency(item.budget)}
          </span>
        </div>

        <div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOver
                  ? "bg-red-500"
                  : isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(item.percentage, 100)}%`,
                backgroundColor: !isOver && !isWarning ? item.categoryColor : undefined,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs font-medium ${
              isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
            }`}>
              {item.percentage}% utilizado
            </span>
            <span className={`text-xs font-medium ${
              isOver ? "text-red-500" : "text-emerald-600"
            }`}>
              {isOver ? `${formatCurrency(Math.abs(remaining))} acima` : `${formatCurrency(remaining)} restante`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
