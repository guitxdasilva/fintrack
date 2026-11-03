import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { dateOnly, isDateOnlyString, parseDateOnly } from "@/lib/dates";

const cardRefundSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  description: z.string().trim().min(1).max(100).optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  /** Invoice (month/year) the credit goes to: the one being viewed. */
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2000).max(2100),
  /** When the refund happened (shown on the row). Defaults to none. */
  date: z.string().refine(isDateOnlyString, "Data inválida").optional(),
});

/**
 * A refund/credit on a card that isn't tied to a purchase, credited to the
 * given invoice: dated day 1 of the invoice month, like billed purchases.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const result = cardRefundSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    const { amount, description, categoryId, month, year, date } = result.data;

    const [card, category] = await Promise.all([
      prisma.card.findFirst({ where: { id, userId: session.user.id }, select: { id: true } }),
      prisma.category.findFirst({
        where: { id: categoryId, userId: session.user.id },
        select: { id: true },
      }),
    ]);
    if (!card) {
      return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
    }
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    const refund = await prisma.transaction.create({
      data: {
        amount,
        type: "INCOME",
        isRefund: true,
        description: description || "Reembolso",
        date: dateOnly(year, month, 1),
        purchaseDate: date ? parseDateOnly(date) : null,
        userId: session.user.id,
        categoryId,
        paymentType: "CARD",
        cardId: card.id,
        cardType: "CREDIT",
      },
    });

    return NextResponse.json({ data: refund, message: "Reembolso registrado" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao registrar reembolso" }, { status: 500 });
  }
}
