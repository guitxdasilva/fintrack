import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const setPaidSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Selecione ao menos uma transação").max(500),
  paid: z.boolean(),
});

/** Sets the paid status of several transactions at once. */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = setPaidSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { ids, paid } = result.data;

    const updated = await prisma.transaction.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { paid, paidAt: paid ? new Date() : null },
    });

    return NextResponse.json({
      data: {
        count: updated.count,
        message: `${updated.count} transação(ões) atualizada(s)`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar status de pagamento" },
      { status: 500 }
    );
  }
}
