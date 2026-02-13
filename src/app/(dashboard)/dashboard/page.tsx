"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { BalanceCard } from "@/modules/dashboard/components/BalanceCard";
import { ExpenseChart } from "@/modules/dashboard/components/ExpenseChart";
import { IncomeVsExpense } from "@/modules/dashboard/components/IncomeVsExpense";
import { MonthTransactions } from "@/modules/dashboard/components/MonthTransactions";
import type { DashboardData } from "@/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  function goToPreviousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToCurrentMonth() {
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  }

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch {
      console.error("Erro ao carregar dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das suas finanças
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 rounded-lg border px-4 py-2 min-w-[180px] justify-center">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {MONTH_NAMES[month]} {year}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToCurrentMonth}
              className="text-xs"
            >
              Hoje
            </Button>
          )}
        </div>
      </div>

      <BalanceCard
        balance={data?.balance ?? 0}
        totalIncome={data?.totalIncome ?? 0}
        totalExpense={data?.totalExpense ?? 0}
        totalPaid={data?.totalPaid ?? 0}
        totalPending={data?.totalPending ?? 0}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpenseChart
          data={data?.expensesByCategory ?? []}
          isLoading={isLoading}
        />
        <MonthTransactions
          transactions={data?.transactions ?? []}
          month={month}
          year={year}
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
