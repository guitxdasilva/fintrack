import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCreditCardMonthOffset } from "@/lib/invoice";
import { firstOfMonthAfter, isDateOnlyString, parseDateOnly } from "@/lib/dates";
import {
  SERIES_SCOPES,
  hasInstallmentSuffix,
  seriesWhere,
  stripInstallmentSuffix,
  withInstallmentSuffix,
  type SeriesScope,
} from "@/lib/transactions/series";

const updateTransactionSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo").optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  description: z.string().min(1, "Descrição é obrigatória").optional(),
  date: z.string().refine(isDateOnlyString, "Data inválida").optional(),
  purchaseDate: z.string().refine(isDateOnlyString, "Data inválida").nullable().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória").optional(),
  paymentType: z.enum(["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"]).nullable().optional(),
  cardId: z.string().nullable().optional(),
  cardType: z.enum(["CREDIT", "DEBIT"]).nullable().optional(),
  isFixed: z.boolean().optional(),
  /** For installments/fixed series: which members to update. Dates only change with "this". */
  scope: z.enum(SERIES_SCOPES).optional().default("this"),
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

    if (result.data.cardId) {
      const card = await prisma.card.findFirst({
        where: { id: result.data.cardId, userId: session.user.id },
        select: { id: true },
      });
      if (!card) {
        return NextResponse.json(
          { error: "Cartão não encontrado" },
          { status: 404 }
        );
      }
    }

    const scope: SeriesScope = existing.installmentGroupId ? result.data.scope : "this";

    const data: Record<string, unknown> = {};
    if (result.data.amount !== undefined) data.amount = result.data.amount;
    if (result.data.type !== undefined) data.type = result.data.type;
    if (result.data.description !== undefined)
      data.description = result.data.description;

    if (result.data.purchaseDate !== undefined && scope === "this") {
      data.purchaseDate = result.data.purchaseDate ? parseDateOnly(result.data.purchaseDate) : null;
    }

    const effectiveCardType = result.data.cardType !== undefined ? result.data.cardType : existing.cardType;
    const effectiveCardId = result.data.cardId !== undefined ? result.data.cardId : existing.cardId;

    if (result.data.date !== undefined && scope === "this") {
      const newDate = parseDateOnly(result.data.date);

      if (effectiveCardType === "CREDIT" && effectiveCardId) {
        const card = await prisma.card.findFirst({
          where: { id: effectiveCardId, userId: session.user.id },
          select: { closingDayType: true, closingDayValue: true },
        });
        if (card?.closingDayType && card?.closingDayValue) {
          data.purchaseDate = newDate;
          const offset = getCreditCardMonthOffset(newDate, card.closingDayType, card.closingDayValue);
          const installmentShift = existing.currentInstallment && existing.currentInstallment > 1
            ? existing.currentInstallment - 1
            : 0;
          data.date = firstOfMonthAfter(newDate, offset + installmentShift);
        } else {
          data.date = newDate;
        }
      } else {
        data.date = newDate;
        data.purchaseDate = null;
      }
    }
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

    if (scope === "this") {
      const transaction = await prisma.transaction.update({
        where: { id },
        data,
        include: { category: true, card: true },
      });

      return NextResponse.json({ data: transaction, count: 1 });
    }

    // Series update: shared fields go to every member; the description keeps
    // each member's own "(n/total)" suffix when the series uses one.
    const { description, ...shared } = data;
    const members = await prisma.transaction.findMany({
      where: seriesWhere(existing, scope),
      select: { id: true, currentInstallment: true, installments: true },
    });
    const usesSuffix = hasInstallmentSuffix(
      existing.description,
      existing.currentInstallment,
      existing.installments
    );
    const baseDescription =
      typeof description === "string" ? stripInstallmentSuffix(description) : undefined;

    await prisma.$transaction(
      members.map((m) =>
        prisma.transaction.update({
          where: { id: m.id },
          data: {
            ...shared,
            ...(baseDescription !== undefined && {
              description:
                usesSuffix && m.currentInstallment && m.installments
                  ? withInstallmentSuffix(baseDescription, m.currentInstallment, m.installments)
                  : baseDescription,
            }),
          },
        })
      )
    );

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true, card: true },
    });

    return NextResponse.json({ data: transaction, count: members.length });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const scopeParam = new URL(request.url).searchParams.get("scope");
    const scope: SeriesScope = SERIES_SCOPES.includes(scopeParam as SeriesScope)
      ? (scopeParam as SeriesScope)
      : "this";

    const deleted = await prisma.transaction.deleteMany({
      where: seriesWhere(existing, scope),
    });

    return NextResponse.json({
      message:
        deleted.count > 1
          ? `${deleted.count} transações excluídas com sucesso`
          : "Transação excluída com sucesso",
      count: deleted.count,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir transação" },
      { status: 500 }
    );
  }
}
