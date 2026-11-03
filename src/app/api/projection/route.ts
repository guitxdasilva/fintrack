import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/dates";
import { balanceAt } from "@/lib/balance";
import { PROJECTION_HISTORY_MONTHS, buildProjection } from "@/lib/projection";

const ALLOWED_MONTHS = [3, 6, 12];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getUTCMonth()));
    const year = parseInt(searchParams.get("year") ?? String(now.getUTCFullYear()));
    const requested = parseInt(searchParams.get("months") ?? "6");
    const monthCount = ALLOWED_MONTHS.includes(requested) ? requested : 6;
    const includeEstimates = searchParams.get("estimates") !== "false";

    if (isNaN(month) || isNaN(year) || month < 0 || month > 11) {
      return NextResponse.json({ error: "Mês inválido" }, { status: 400 });
    }

    const windowStart = monthRange(year, month).start;
    const from = monthRange(year, month - PROJECTION_HISTORY_MONTHS).start;
    const to = monthRange(year, month + monthCount - 1).end;

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id, date: { gte: from, lte: to } },
      select: {
        amount: true,
        type: true,
        date: true,
        isFixed: true,
        installmentGroupId: true,
      },
    });

    // Informed before the window: moved to its start. Informed inside it: used
    // as is, and the window's transactions dated before it are skipped.
    const known = await balanceAt(session.user.id, windowStart);
    const opening = known
      ? { amount: known.amount, since: known.since > windowStart ? known.since : windowStart }
      : undefined;

    return NextResponse.json({
      data: buildProjection(transactions, { month, year }, monthCount, includeEstimates, opening),
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao calcular projeção" },
      { status: 500 }
    );
  }
}
