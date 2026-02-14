"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyData } from "@/types";
import { BarChart3 } from "lucide-react";

interface IncomeVsExpenseProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export function IncomeVsExpense({ data, isLoading }: IncomeVsExpenseProps) {
  const chartData = useMemo(() => data, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receitas vs Despesas</CardTitle>
          <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="Sem dados"
            description="Nenhuma transação registrada nos últimos 6 meses"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas vs Despesas</CardTitle>
        <CardDescription>Comparativo dos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                className="text-xs"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="mb-1 text-sm font-medium">{label}</p>
                      {payload.map((item) => (
                        <div
                          key={item.dataKey}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">
                            {item.dataKey === "income" ? "Receitas" : "Despesas"}:
                          </span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Despesas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
