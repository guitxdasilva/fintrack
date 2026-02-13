import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkDuplicateSchema = z.object({
  transactionIds: z.array(z.string()).min(1, "Selecione ao menos uma transação"),
  month: z.number().min(0).max(11),
  year: z.number().min(2000).max(2100),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = bulkDuplicateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { transactionIds, month, year } = result.data;

    // Fetch all selected transactions (verify ownership)
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: session.user.id,
        // Exclude installment transactions — they auto-generate across months
        installmentGroupId: null,
      },
      include: { category: true },
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma transação encontrada" },
        { status: 404 }
      );
    }

    // Check all categories still exist
    const categoryIds = [...new Set(transactions.map((t) => t.categoryId))];
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        userId: session.user.id,
      },
      select: { id: true, name: true },
    });

    const existingCategoryIds = new Set(existingCategories.map((c) => c.id));
    const missingCategories = transactions
      .filter((t) => !existingCategoryIds.has(t.categoryId))
      .map((t) => t.category?.name || "Desconhecida");

    if (missingCategories.length > 0) {
      const uniqueMissing = [...new Set(missingCategories)];
      return NextResponse.json(
        {
          error: `Categorias não encontradas: ${uniqueMissing.join(", ")}. Edite as transações com categorias válidas antes de duplicar.`,
          missingCategories: uniqueMissing,
        },
        { status: 400 }
      );
    }

    // Create duplicated transactions
    const created = await prisma.transaction.createMany({
      data: transactions.map((t) => {
        const originalDate = new Date(t.date);
        const day = originalDate.getDate();
        const maxDay = new Date(year, month + 1, 0).getDate();
        const safeDay = Math.min(day, maxDay);

        return {
          amount: t.amount,
          type: t.type,
          description: t.description,
          date: new Date(year, month, safeDay),
          categoryId: t.categoryId,
          paymentType: t.paymentType,
          cardId: t.cardId,
          cardType: t.cardType,
          userId: session.user!.id!,
        };
      }),
    });

    return NextResponse.json({
      message: `${created.count} transação(ões) duplicada(s) com sucesso`,
      count: created.count,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao duplicar transações" },
      { status: 500 }
    );
  }
}
