import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInvoicePeriod } from "@/lib/invoice";

export async function GET(
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
    let effectiveClosing: number | null = null;

    if (card.closingDayType && card.closingDayValue) {
      const period = getInvoicePeriod(
        card.closingDayType,
        card.closingDayValue,
        month,
        year
      );
      start = period.start;
      end = period.end;
      effectiveClosing = period.effectiveClosing;
    } else {
      // Sem dia de fechamento configurado: usa o mês calendário
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        cardId: id,
        date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    const total = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const formatDate = (d: Date) =>
      `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

    return NextResponse.json({
      data: {
        transactions,
        total,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
          label: `${formatDate(start)} - ${formatDate(end)}`,
        },
        effectiveClosing,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar fatura" },
      { status: 500 }
    );
  }
}
