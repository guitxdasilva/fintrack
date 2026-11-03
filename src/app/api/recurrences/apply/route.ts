import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRecurringSuggestion } from "@/lib/recurrence/server";
import { recurrenceTargetSchema } from "../schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const result = recurrenceTargetSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: "Sugestão inválida" }, { status: 400 });
    }

    const applied = await applyRecurringSuggestion(
      session.user.id,
      result.data.type,
      result.data.key,
      new Date()
    );
    if (!applied) {
      return NextResponse.json(
        { error: "Sugestão não encontrada ou já aplicada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...applied,
        message: `Marcado como fixo: ${applied.created} lançamento(s) criado(s)`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao aplicar recorrência" },
      { status: 500 }
    );
  }
}
