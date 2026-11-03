import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { describeSuggestions, findRecurringSuggestions } from "@/lib/recurrence/server";

/** Transactions that look recurring but aren't fixed yet. */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const suggestions = await findRecurringSuggestions(session.user.id, new Date());
    return NextResponse.json({ data: await describeSuggestions(suggestions) });
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar recorrências" },
      { status: 500 }
    );
  }
}
