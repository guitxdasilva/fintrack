"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PiggyBank, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { BudgetSummary } from "@/types";

interface BudgetOverviewProps {
  month: number;
  year: number;
  isLoading: boolean;
}

export function BudgetOverview({ month, year, isLoading: parentLoading }: BudgetOverviewProps) {
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/budget?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.data) {
        setBudgets(json.data.budgets);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const isPageLoading = parentLoading || loading;

  if (isPageLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) return null;

  const overBudget = budgets.filter((b) => b.percentage > 100);
  const warning = budgets.filter((b) => b.percentage > 80 && b.percentage <= 100);

  // Sort: over budget first, then warnings, then by percentage desc
  const sorted = [...budgets].sort((a, b) => {
    if (a.percentage > 100 && b.percentage <= 100) return -1;
    if (b.percentage > 100 && a.percentage <= 100) return 1;
    return b.percentage - a.percentage;
  });

  // Show top 5
  const displayed = sorted.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <PiggyBank className="h-4 w-4" />
            Orçamento
            {overBudget.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-normal text-red-500">
                <AlertTriangle className="h-3 w-3" />
                {overBudget.length} acima
              </span>
            )}
            {warning.length > 0 && overBudget.length === 0 && (
              <span className="flex items-center gap-1 text-xs font-normal text-amber-500">
                <AlertTriangle className="h-3 w-3" />
                {warning.length} atenção
              </span>
            )}
          </CardTitle>
          <Link
            href="/budget"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayed.map((item) => {
          const isOver = item.percentage > 100;
          const isWarning = item.percentage > 80 && item.percentage <= 100;

          return (
            <div key={item.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{item.categoryIcon || "📦"}</span>
                  <span className="truncate font-medium">{item.categoryName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium ${
                    isOver ? "text-red-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                  }`}>
                    {item.percentage}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver
                      ? "bg-red-500"
                      : isWarning
                        ? "bg-amber-500"
                        : ""
                  }`}
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: !isOver && !isWarning ? item.categoryColor : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
