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

    // Get all expense categories with a budget set
    const categories = await prisma.category.findMany({
      where: {
        userId,
        type: "EXPENSE",
        budget: { not: null },
      },
      orderBy: { name: "asc" },
    });

    if (categories.length === 0) {
      return NextResponse.json({ data: { budgets: [], totalBudget: 0, totalSpent: 0 } });
    }

    // Get all expenses for the month grouped by category
    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth },
        categoryId: { in: categories.map((c) => c.id) },
      },
      select: {
        categoryId: true,
        amount: true,
      },
    });

    // Sum expenses per category
    const spentMap = new Map<string, number>();
    expenses.forEach((e) => {
      spentMap.set(e.categoryId, (spentMap.get(e.categoryId) || 0) + e.amount);
    });

    const budgets = categories.map((cat) => {
      const spent = roundMoney(spentMap.get(cat.id) || 0);
      const budget = cat.budget!;
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        budget,
        spent,
        percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      };
    });

    const totalBudget = sumMoney(budgets, (b) => b.budget);
    const totalSpent = sumMoney(budgets, (b) => b.spent);

    return NextResponse.json({
      data: { budgets, totalBudget, totalSpent },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar orçamentos" },
      { status: 500 }
    );
  }
}
