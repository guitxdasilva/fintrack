import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCreditCardMonthOffset } from "@/lib/invoice";

const createTransactionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  paymentType: z.enum(["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"]).optional(),
  cardId: z.string().optional(),
  cardType: z.enum(["CREDIT", "DEBIT"]).optional(),
  installments: z.number().int().min(2).max(48).optional(),
  isFixed: z.boolean().optional(),
  fixedMonths: z.number().int().min(2).max(60).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const cardId = searchParams.get("cardId");
    const paid = searchParams.get("paid");
    const isFixed = searchParams.get("isFixed");
    const paymentType = searchParams.get("paymentType");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (type && (type === "INCOME" || type === "EXPENSE")) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    if (cardId) {
      where.cardId = cardId;
    }

    if (paid === "true" || paid === "false") {
      where.paid = paid === "true";
    }

    if (isFixed === "true" || isFixed === "false") {
      where.isFixed = isFixed === "true";
    }

    if (paymentType && ["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"].includes(paymentType)) {
      where.paymentType = paymentType;
    }

    if (monthParam !== null && yearParam !== null) {
      const m = parseInt(monthParam);
      const y = parseInt(yearParam);
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, card: true },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = createTransactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, type, description, date, categoryId, paymentType, cardId, cardType, installments, isFixed, fixedMonths } = result.data;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Validate card belongs to user if provided
    let card: { id: string; closingDayType: string | null; closingDayValue: number | null } | null = null;
    if (cardId) {
      card = await prisma.card.findFirst({
        where: { id: cardId, userId: session.user.id },
        select: { id: true, closingDayType: true, closingDayValue: true },
      });
      if (!card) {
        return NextResponse.json(
          { error: "Cartão não encontrado" },
          { status: 404 }
        );
      }
    }

    // Calculate month offset for credit card purchases based on closing date
    // E.g.: purchase before closing → billed next month (+1)
    //        purchase after closing  → billed in 2 months (+2)
    let creditMonthOffset = 0;
    if (cardType === "CREDIT" && card?.closingDayType && card?.closingDayValue) {
      creditMonthOffset = getCreditCardMonthOffset(
        new Date(date),
        card.closingDayType,
        card.closingDayValue
      );
    }

    // Handle installment creation
    if (type === "EXPENSE" && installments && installments >= 2) {
      const installmentAmount = Math.round((amount / installments) * 100) / 100;
      // Last installment absorbs rounding difference so total matches original amount
      const lastInstallmentAmount = Math.round((amount - installmentAmount * (installments - 1)) * 100) / 100;
      const groupId = globalThis.crypto.randomUUID();
      const baseDate = new Date(date);

      const data = Array.from({ length: installments }, (_, i) => {
        const installmentDate = new Date(baseDate);
        // creditMonthOffset shifts dates to the billing month (e.g., +1 if before closing)
        installmentDate.setMonth(installmentDate.getMonth() + i + creditMonthOffset);
        // Handle month overflow (e.g., Jan 31 -> Feb 28)
        const maxDay = new Date(
          installmentDate.getFullYear(),
          installmentDate.getMonth() + 1,
          0
        ).getDate();
        if (installmentDate.getDate() > maxDay) {
          installmentDate.setDate(maxDay);
        }

        return {
          amount: i === installments - 1 ? lastInstallmentAmount : installmentAmount,
          type: type as "INCOME" | "EXPENSE",
          description: `${description} (${i + 1}/${installments})`,
          date: installmentDate,
          userId: session.user!.id!,
          categoryId,
          paymentType: paymentType || null,
          cardId: cardId || null,
          cardType: cardType || null,
          installments,
          currentInstallment: i + 1,
          installmentGroupId: groupId,
          isFixed: isFixed || false,
        };
      });

      const created = await prisma.transaction.createMany({ data });

      return NextResponse.json(
        { message: `${created.count} parcelas criadas com sucesso`, count: created.count },
        { status: 201 }
      );
    }

    // Handle fixed recurring expense creation
    if (isFixed && fixedMonths && fixedMonths >= 2) {
      const groupId = globalThis.crypto.randomUUID();
      const baseDate = new Date(date);

      const data = Array.from({ length: fixedMonths }, (_, i) => {
        const recurringDate = new Date(baseDate);
        recurringDate.setMonth(recurringDate.getMonth() + i);
        const maxDay = new Date(
          recurringDate.getFullYear(),
          recurringDate.getMonth() + 1,
          0
        ).getDate();
        if (recurringDate.getDate() > maxDay) {
          recurringDate.setDate(maxDay);
        }

        return {
          amount,
          type: type as "INCOME" | "EXPENSE",
          description,
          date: recurringDate,
          userId: session.user!.id!,
          categoryId,
          paymentType: null as string | null,
          cardId: null as string | null,
          cardType: null as string | null,
          installments: fixedMonths,
          currentInstallment: i + 1,
          installmentGroupId: groupId,
          isFixed: true,
        };
      });

      const created = await prisma.transaction.createMany({ data });

      return NextResponse.json(
        { message: `Despesa fixa criada para ${created.count} meses`, count: created.count },
        { status: 201 }
      );
    }

    // For credit card purchases, shift the date to the billing month
    const transactionDate = new Date(date);
    if (creditMonthOffset > 0) {
      transactionDate.setMonth(transactionDate.getMonth() + creditMonthOffset);
      const maxDay = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth() + 1,
        0
      ).getDate();
      if (transactionDate.getDate() > maxDay) {
        transactionDate.setDate(maxDay);
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        date: transactionDate,
        userId: session.user.id,
        categoryId,
        paymentType: paymentType || null,
        cardId: cardId || null,
        cardType: cardType || null,
        isFixed: isFixed || false,
      },
      include: { category: true, card: true },
    });

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    );
  }
}
