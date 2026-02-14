"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { ArrowDownCircle, ArrowUpCircle, Wallet, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalPaid: number;
  totalPending: number;
  isLoading?: boolean;
}

export function BalanceCard({
  balance,
  totalIncome,
  totalExpense,
  totalPaid,
  totalPending,
  isLoading,
}: BalanceCardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Saldo Atual",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-emerald-500" : "text-red-500",
      iconColor: "text-indigo-500",
      description: "Balanço do mês atual",
    },
    {
      title: "Receitas",
      value: totalIncome,
      icon: ArrowUpCircle,
      color: "text-emerald-500",
      iconColor: "text-emerald-500",
      description: "Total de receitas no mês",
    },
    {
      title: "Despesas",
      value: totalExpense,
      icon: ArrowDownCircle,
      color: "text-red-500",
      iconColor: "text-red-500",
      description: "Total de despesas no mês",
    },
    {
      title: "Pago",
      value: totalPaid,
      icon: CheckCircle2,
      color: "text-emerald-500",
      iconColor: "text-emerald-500",
      description: "Despesas já pagas",
    },
    {
      title: "Pendente",
      value: totalPending,
      icon: Clock,
      color: "text-amber-500",
      iconColor: "text-amber-500",
      description: "Despesas a pagar",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          className={`transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
            index === 0
              ? "border-indigo-200 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-background dark:from-indigo-950/20 dark:to-card"
              : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-1.5 ${index === 0 ? "bg-indigo-500/10" : ""}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${card.color}`}>
              {formatCurrency(card.value)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
