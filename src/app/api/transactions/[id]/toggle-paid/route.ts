import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    const newPaid = !existing.paid;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        paid: newPaid,
        paidAt: newPaid ? new Date() : null,
      },
      include: { category: true, card: true },
    });

    return NextResponse.json({ data: transaction });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar status de pagamento" },
      { status: 500 }
    );
  }
}
