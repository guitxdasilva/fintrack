import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import { isDateOnlyString, parseDateOnly } from "@/lib/dates";
import { refundableAmount } from "@/lib/refunds";

const refundSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  /** When the refund happened (shown on the purchase). Defaults to today. */
  date: z.string().refine(isDateOnlyString, "Data inválida").optional(),
});

/**
 * Refunds a purchase, fully or partially. The refund is an INCOME row linked
 * to the purchase and dated like it, so it is credited to the same invoice.
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
    const result = refundSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const purchase = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
      include: { refunds: { select: { amount: true } } },
    });

    if (!purchase || purchase.type !== "EXPENSE") {
      return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
    }

    const available = refundableAmount(purchase, purchase.refunds);
    if (result.data.amount > available) {
      return NextResponse.json(
        {
          error:
            available > 0
              ? `O reembolso máximo para esta compra é ${formatCurrency(available)}`
              : "Esta compra já foi totalmente reembolsada",
        },
        { status: 400 }
      );
    }

    const refund = await prisma.transaction.create({
      data: {
        amount: result.data.amount,
        type: "INCOME",
        isRefund: true,
        refundOfId: purchase.id,
        description: `Reembolso: ${purchase.description}`,
        date: purchase.date,
        purchaseDate: result.data.date ? parseDateOnly(result.data.date) : null,
        userId: session.user.id,
        categoryId: purchase.categoryId,
        paymentType: purchase.paymentType,
        cardId: purchase.cardId,
        cardType: purchase.cardType,
      },
    });

    return NextResponse.json(
      {
        data: refund,
        message:
          result.data.amount === available
            ? "Compra reembolsada"
            : `Reembolso de ${formatCurrency(result.data.amount)} registrado`,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erro ao registrar reembolso" }, { status: 500 });
  }
}
