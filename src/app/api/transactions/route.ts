import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCreditCardMonthOffset } from "@/lib/invoice";
import {
  addMonthsClamped,
  dayRange,
  firstOfMonthAfter,
  isDateOnlyString,
  monthRange,
  parseDateOnly,
} from "@/lib/dates";
import { roundMoney } from "@/lib/money";

const createTransactionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().refine(isDateOnlyString, "Data inválida"),
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
      const { start, end } = monthRange(parseInt(yearParam), parseInt(monthParam));
      where.date = { gte: start, lte: end };
    } else if (
      (startDate && isDateOnlyString(startDate)) ||
      (endDate && isDateOnlyString(endDate))
    ) {
      where.date = {};
      if (startDate && isDateOnlyString(startDate)) {
        (where.date as Record<string, unknown>).gte = dayRange(
          parseDateOnly(startDate),
          parseDateOnly(startDate)
        ).start;
      }
      if (endDate && isDateOnlyString(endDate)) {
        (where.date as Record<string, unknown>).lte = dayRange(
          parseDateOnly(endDate),
          parseDateOnly(endDate)
        ).end;
      }
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") || "10") || 10)
    );
    const skip = (page - 1) * limit;

    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const validSortFields: Record<string, unknown> = {
      date: { date: sortOrder },
      amount: { amount: sortOrder },
      description: { description: sortOrder },
      category: { category: { name: sortOrder } },
    };

    const orderBy = validSortFields[sortBy] || { date: "desc" };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, card: true },
        orderBy: orderBy as Record<string, unknown>,
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

    const baseDate = parseDateOnly(date);

    let creditMonthOffset = 0;
    if (cardType === "CREDIT" && card?.closingDayType && card?.closingDayValue) {
      creditMonthOffset = getCreditCardMonthOffset(
        baseDate,
        card.closingDayType,
        card.closingDayValue
      );
    }

    if (type === "EXPENSE" && installments && installments >= 2) {
      const installmentAmount = roundMoney(amount / installments);
      const lastInstallmentAmount = roundMoney(amount - installmentAmount * (installments - 1));
      const groupId = globalThis.crypto.randomUUID();

      const data = Array.from({ length: installments }, (_, i) => {
        const installmentDate =
          creditMonthOffset > 0
            ? firstOfMonthAfter(baseDate, i + creditMonthOffset)
            : addMonthsClamped(baseDate, i);

        return {
          amount: i === installments - 1 ? lastInstallmentAmount : installmentAmount,
          type: type as "INCOME" | "EXPENSE",
          description: `${description} (${i + 1}/${installments})`,
          date: installmentDate,
          purchaseDate: creditMonthOffset > 0 ? baseDate : null,
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

    if (isFixed && fixedMonths && fixedMonths >= 2) {
      const groupId = globalThis.crypto.randomUUID();

      const data = Array.from({ length: fixedMonths }, (_, i) => {
        const recurringDate = addMonthsClamped(baseDate, i);

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

    const transactionDate =
      creditMonthOffset > 0
        ? firstOfMonthAfter(baseDate, creditMonthOffset)
        : baseDate;

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        date: transactionDate,
        purchaseDate: creditMonthOffset > 0 ? baseDate : null,
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
