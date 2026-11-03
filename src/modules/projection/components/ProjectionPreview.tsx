"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { useProjection } from "@/modules/dashboard/hooks/useDashboard";
import { hasBalance, lineValue, longMonth } from "../lib/format";

const PREVIEW_MONTHS = 4;

/**
 * Dashboard card: the current and next months from the projection. Uses the
 * same query as the projection page's default view, so both share the cache.
 */
export function ProjectionPreview() {
  const [now] = useState(() => new Date());
  const { data, isLoading } = useProjection(now.getMonth(), now.getFullYear(), 6, true);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: PREVIEW_MONTHS }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.months.some((m) => m.net !== 0)) return null;

  const months = data.months.slice(0, PREVIEW_MONTHS);
  const withBalance = hasBalance(months);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Próximos meses</CardTitle>
          <CardDescription>
            {withBalance
              ? "Saldo previsto no fim de cada mês"
              : "Resultado previsto de cada mês (informe seu saldo em Configurações para ver o saldo)"}
          </CardDescription>
        </div>
        <Link
          href="/projection"
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver projeção
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {months.map((m, i) => {
          const value = lineValue(m);
          const Icon = m.net >= 0 ? TrendingUp : TrendingDown;
          return (
            <div key={`${m.year}-${m.month}`} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                {longMonth(m)}
                {i === 0 && " · este mês"}
              </p>
              <p
                className={cn(
                  "mt-1 text-lg font-bold tabular-nums",
                  value < 0 && "text-red-600 dark:text-red-400"
                )}
              >
                {formatCurrency(value)}
              </p>
              {withBalance && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="h-3 w-3" aria-hidden />
                  <span className="sr-only">Resultado do mês:</span>
                  {formatCurrency(m.net)} no mês
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
