import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTransactionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo").optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  description: z.string().min(1, "Descrição é obrigatória").optional(),
  date: z.string().min(1, "Data é obrigatória").optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória").optional(),
  paymentType: z.enum(["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"]).nullable().optional(),
  cardId: z.string().nullable().optional(),
  cardType: z.enum(["CREDIT", "DEBIT"]).nullable().optional(),
  isFixed: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateTransactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (result.data.amount !== undefined) data.amount = result.data.amount;
    if (result.data.type !== undefined) data.type = result.data.type;
    if (result.data.description !== undefined)
      data.description = result.data.description;
    if (result.data.date !== undefined) data.date = new Date(result.data.date);
    if (result.data.categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: { id: result.data.categoryId, userId: session.user.id },
      });
      if (!category) {
        return NextResponse.json(
          { error: "Categoria não encontrada" },
          { status: 404 }
        );
      }
      data.categoryId = result.data.categoryId;
    }

    if (result.data.paymentType !== undefined) {
      data.paymentType = result.data.paymentType;
    }

    if (result.data.cardId !== undefined) {
      data.cardId = result.data.cardId;
    }

    if (result.data.cardType !== undefined) {
      data.cardType = result.data.cardType;
    }

    if (result.data.isFixed !== undefined) {
      data.isFixed = result.data.isFixed;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: { category: true, card: true },
    });

    return NextResponse.json({ data: transaction });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ message: "Transação excluída com sucesso" });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir transação" },
      { status: 500 }
    );
  }
}
