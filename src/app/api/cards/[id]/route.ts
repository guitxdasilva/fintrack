import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres").optional(),
  icon: z.string().optional(),
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

    const existing = await prisma.card.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const result = updateCardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    if (result.data.name && result.data.name !== existing.name) {
      const duplicate = await prisma.card.findFirst({
        where: {
          name: result.data.name,
          userId: session.user.id,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Já existe um cartão com este nome" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.card.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar cartão" },
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

    const existing = await prisma.card.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cartão não encontrado" },
        { status: 404 }
      );
    }

    const transactionCount = await prisma.transaction.count({
      where: { cardId: id },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir. Existem ${transactionCount} transação(ões) usando este cartão.`,
        },
        { status: 400 }
      );
    }

    await prisma.card.delete({ where: { id } });

    return NextResponse.json({ message: "Cartão excluído com sucesso" });
  } catch {
    return NextResponse.json(
      { error: "Erro ao excluir cartão" },
      { status: 500 }
    );
  }
}
