import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [currentMonthTransactions, allTransactions, recentTransactions] =
      await Promise.all([
        prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          include: { category: true },
        }),
        prisma.transaction.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { date: "desc" },
        }),
        prisma.transaction.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { date: "desc" },
          take: 5,
        }),
      ]);

    const totalIncome = currentMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const expenseMap = new Map<string, { category: string; color: string; total: number }>();

    currentMonthTransactions
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
        percentage: totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
      }));

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez",
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      monthlyMap.set(key, { income: 0, expense: 0 });
    }

    allTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
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
      income: data.income,
      expense: data.expense,
    }));

    return NextResponse.json({
      data: {
        balance,
        totalIncome,
        totalExpense,
        recentTransactions,
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
