import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCardSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  icon: z.string().optional(),
  closingDayType: z.enum(["FIXED", "BEFORE_END"]).nullable().optional(),
  closingDayValue: z.number().int().min(1).max(31).nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cards = await prisma.card.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: cards });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar cartões" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = createCardSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.card.findFirst({
      where: {
        name: result.data.name,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um cartão com este nome" },
        { status: 400 }
      );
    }

    const card = await prisma.card.create({
      data: {
        name: result.data.name,
        icon: result.data.icon || "💳",
        closingDayType: result.data.closingDayType || null,
        closingDayValue: result.data.closingDayValue ?? null,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ data: card }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar cartão" },
      { status: 500 }
    );
  }
}
