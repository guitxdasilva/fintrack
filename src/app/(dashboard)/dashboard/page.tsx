"use client";

import { useEffect, useState, useCallback } from "react";
import { BalanceCard } from "@/modules/dashboard/components/BalanceCard";
import { ExpenseChart } from "@/modules/dashboard/components/ExpenseChart";
import { IncomeVsExpense } from "@/modules/dashboard/components/IncomeVsExpense";
import { RecentTransactions } from "@/modules/dashboard/components/RecentTransactions";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch {
      console.error("Erro ao carregar dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das suas finanças
        </p>
      </div>

      <BalanceCard
        balance={data?.balance ?? 0}
        totalIncome={data?.totalIncome ?? 0}
        totalExpense={data?.totalExpense ?? 0}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseChart
          data={data?.expensesByCategory ?? []}
          isLoading={isLoading}
        />
        <RecentTransactions
          transactions={data?.recentTransactions ?? []}
          isLoading={isLoading}
        />
      </div>

      <IncomeVsExpense
        data={data?.monthlyData ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
