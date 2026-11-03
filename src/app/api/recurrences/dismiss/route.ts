import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dismissRecurringSuggestion } from "@/lib/recurrence/server";
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

    await dismissRecurringSuggestion(session.user.id, result.data.type, result.data.key);
    return NextResponse.json({ message: "Sugestão ignorada" });
  } catch {
    return NextResponse.json(
      { error: "Erro ao ignorar sugestão" },
      { status: 500 }
    );
  }
}
