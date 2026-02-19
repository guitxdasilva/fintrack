import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getParser } from "@/lib/import";
import type { ParseResult } from "@/lib/import";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const action = (formData.get("action") as string) || "preview";
    const bankId = formData.get("bank") as string;

    if (!bankId) {
      return NextResponse.json(
        { error: "Selecione um banco" },
        { status: 400 }
      );
    }

    const parser = getParser(bankId);
    if (!parser) {
      return NextResponse.json(
        { error: "Banco não suportado" },
        { status: 400 }
      );
    }

    if (action === "confirm") {
      const transactionsJson = formData.get("transactions") as string;
      const cardId = formData.get("cardId") as string | null;
      const cardType = formData.get("cardType") as string | null;

      if (!transactionsJson) {
        return NextResponse.json(
          { error: "Dados incompletos para importação" },
          { status: 400 }
        );
      }

      const { prisma } = await import("@/lib/prisma");

      const selectedTransactions = JSON.parse(transactionsJson) as {
        date: string;
        description: string;
        amount: number;
        type: "INCOME" | "EXPENSE";
        categoryId: string;
      }[];

      if (selectedTransactions.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma transação selecionada" },
          { status: 400 }
        );
      }

      const categoryIds = [...new Set(selectedTransactions.map((t) => t.categoryId))];

      if (categoryIds.some((id) => !id)) {
        return NextResponse.json(
          { error: "Todas as transações precisam de uma categoria" },
          { status: 400 }
        );
      }

      const userCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds }, userId: session.user.id },
        select: { id: true },
      });

      const validIds = new Set(userCategories.map((c: { id: string }) => c.id));
      const invalidIds = categoryIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: "Uma ou mais categorias não encontradas" },
          { status: 404 }
        );
      }

      const data = selectedTransactions.map((t) => ({
        amount: t.amount,
        type: t.type as "INCOME" | "EXPENSE",
        description: t.description,
        date: new Date(t.date),
        userId: session.user!.id!,
        categoryId: t.categoryId,
        paymentType: cardId ? "CARD" : null,
        cardId: cardId || null,
        cardType: cardType || null,
        isFixed: false,
      }));

      const created = await prisma.transaction.createMany({ data });

      return NextResponse.json({
        data: {
          count: created.count,
          message: `${created.count} transação(ões) importada(s) com sucesso`,
        },
      });
    }

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Envie um arquivo" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith(".pdf");
    const isCsv = fileName.endsWith(".csv") || fileName.endsWith(".txt");

    if (!isPdf && !isCsv) {
      return NextResponse.json(
        { error: "Formato não suportado. Use PDF ou CSV." },
        { status: 400 }
      );
    }

    let result: ParseResult;

    if (isPdf) {
      if (!parser.supportsPdf || !parser.parsePdf) {
        return NextResponse.json(
          { error: `O parser de ${parser.name} não suporta PDF. Use CSV.` },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      result = parser.parsePdf(pdfData.text);
    } else {
      if (!parser.supportsCsv || !parser.parseCsv) {
        return NextResponse.json(
          { error: `O parser de ${parser.name} não suporta CSV.` },
          { status: 400 }
        );
      }

      const text = await file.text();
      result = parser.parseCsv(text);
    }

    return NextResponse.json({
      data: {
        bank: result.bank,
        transactions: result.transactions,
        errors: result.errors,
        totalFound: result.transactions.length,
      },
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Erro ao processar arquivo" },
      { status: 500 }
    );
  }
}
