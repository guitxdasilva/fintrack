import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/dates";
import { roundMoney, sumMoney } from "@/lib/money";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const paramMonth = searchParams.get("month");
    const paramYear = searchParams.get("year");

    const now = new Date();
    const targetYear = paramYear ? parseInt(paramYear) : now.getUTCFullYear();
    const targetMonth = paramMonth ? parseInt(paramMonth) : now.getUTCMonth();

    const { start: startOfMonth, end: endOfMonth } = monthRange(targetYear, targetMonth);

    // Last 6 months range for the chart (relative to selected month)
    const chartStart = monthRange(targetYear, targetMonth - 5).start;
    const chartEnd = endOfMonth;

    const [chartTransactions, selectedMonthTransactions] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: chartStart, lte: chartEnd },
          },
          include: { category: true },
          orderBy: { date: "desc" },
        }),
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          include: { category: true, card: true },
          orderBy: { date: "desc" },
        }),
      ]);

    const amount = (t: { amount: number }) => t.amount;

    const totalIncome = sumMoney(
      selectedMonthTransactions.filter((t) => t.type === "INCOME"),
      amount
    );

    const totalExpense = sumMoney(
      selectedMonthTransactions.filter((t) => t.type === "EXPENSE"),
      amount
    );

    const totalPaid = sumMoney(
      selectedMonthTransactions.filter((t) => t.type === "EXPENSE" && t.paid),
      amount
    );

    const totalPending = sumMoney(
      selectedMonthTransactions.filter((t) => t.type === "EXPENSE" && !t.paid),
      amount
    );

    const balance = roundMoney(totalIncome - totalExpense);

    const expenseMap = new Map<string, { category: string; color: string; total: number }>();

    selectedMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const key = t.category.name;
        const existing = expenseMap.get(key);
        if (existing) {
          existing.total += t.amount;
        } else {
          expenseMap.set(key, {
            category: key,
            color: t.category.color,
            total: t.amount,
          });
        }
      });

    const expensesByCategory = Array.from(expenseMap.values())
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        ...item,
        total: roundMoney(item.total),
        percentage: totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
      }));

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(targetYear, targetMonth - i, 1));
      const key = `${monthNames[d.getUTCMonth()]}/${d.getUTCFullYear().toString().slice(2)}`;
      monthlyMap.set(key, { income: 0, expense: 0 });
    }

    chartTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${monthNames[d.getUTCMonth()]}/${d.getUTCFullYear().toString().slice(2)}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        if (t.type === "INCOME") {
          entry.income += t.amount;
        } else {
          entry.expense += t.amount;
        }
      }
    });

    const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      income: roundMoney(data.income),
      expense: roundMoney(data.expense),
    }));

    return NextResponse.json({
      data: {
        balance,
        totalIncome,
        totalExpense,
        totalPaid,
        totalPending,
        transactions: selectedMonthTransactions,
        expensesByCategory,
        monthlyData,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
