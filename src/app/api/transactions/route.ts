import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTransactionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().min(1, "Data é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
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

    if (startDate || endDate) {
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
        include: { category: true },
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

    const { amount, type, description, date, categoryId } = result.data;

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: session.user.id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        description,
        date: new Date(date),
        userId: session.user.id,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar transação" },
      { status: 500 }
    );
  }
}
