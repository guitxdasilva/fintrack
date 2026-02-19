import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoicePeriod } from "@/lib/invoice";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const month = parseInt(
      searchParams.get("month") || String(new Date().getMonth())
    );
    const year = parseInt(
      searchParams.get("year") || String(new Date().getFullYear())
    );

    const card = await prisma.card.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    let start: Date;
    let end: Date;

    if (card.closingDayType && card.closingDayValue) {
      const period = getInvoicePeriod(
        card.closingDayType,
        card.closingDayValue,
        month,
        year
      );
      start = period.start;
      end = period.end;
    } else {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }

    const result = await prisma.transaction.updateMany({
      where: {
        userId: session.user.id,
        cardId: id,
        type: "EXPENSE",
        paid: false,
        date: { gte: start, lte: end },
      },
      data: {
        paid: true,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      data: {
        count: result.count,
        message: `${result.count} transação(ões) marcada(s) como paga(s)`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao pagar fatura" },
      { status: 500 }
    );
  }
}
