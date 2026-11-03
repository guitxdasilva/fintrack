import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { balanceAt } from "@/lib/balance";
import { dayRange, isDateOnlyString, parseDateOnly } from "@/lib/dates";

const balanceSchema = z.union([
  z.object({
    amount: z.number().finite().min(-1e9).max(1e9),
    date: z.string().refine(isDateOnlyString, "Data inválida"),
  }),
  /** Clears the known balance. */
  z.object({ amount: z.null() }),
]);

/**
 * Known balance and the balance at the end of `?date=yyyy-MM-dd` (the
 * client's today; defaults to the current UTC day).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const dateParam = new URL(request.url).searchParams.get("date");
    const today = dateParam && isDateOnlyString(dateParam) ? parseDateOnly(dateParam) : new Date();
    const endOfToday = new Date(dayRange(today, today).end.getTime() + 1);
    const balance = await balanceAt(session.user.id, endOfToday);

    return NextResponse.json({
      data: balance
        ? {
            initialBalance: balance.initialBalance,
            initialBalanceDate: balance.since.toISOString().slice(0, 10),
            currentBalance: balance.amount,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar saldo" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = balanceSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data:
        result.data.amount === null
          ? { initialBalance: 0, initialBalanceDate: null }
          : {
              initialBalance: result.data.amount,
              initialBalanceDate: parseDateOnly(result.data.date),
            },
    });

    return NextResponse.json({ message: "Saldo atualizado" });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar saldo" }, { status: 500 });
  }
}
