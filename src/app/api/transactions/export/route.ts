import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const cardId = searchParams.get("cardId");
    const paid = searchParams.get("paid");
    const isFixed = searchParams.get("isFixed");
    const paymentType = searchParams.get("paymentType");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (type && (type === "INCOME" || type === "EXPENSE")) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    if (cardId) {
      where.cardId = cardId;
    }

    if (paid === "true" || paid === "false") {
      where.paid = paid === "true";
    }

    if (isFixed === "true" || isFixed === "false") {
      where.isFixed = isFixed === "true";
    }

    if (paymentType && ["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"].includes(paymentType)) {
      where.paymentType = paymentType;
    }

    if (monthParam !== null && yearParam !== null) {
      const m = parseInt(monthParam);
      const y = parseInt(yearParam);
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, card: true },
      orderBy: { date: "desc" },
    });

    const header = "Data,Tipo,Tipo Despesa,Categoria,Pagamento,Cartão,Tipo Cartão,Parcela,Descrição,Valor,Pago";
    const paymentTypeLabels: Record<string, string> = {
      CASH: "Dinheiro",
      PIX: "PIX",
      CARD: "Cartão",
      TRANSFER: "Transferência",
      BANK_SLIP: "Boleto",
    };
    const rows = transactions.map((t) => {
      const date = new Date(t.date).toLocaleDateString("pt-BR");
      const type = t.type === "INCOME" ? "Receita" : "Despesa";
      const expenseType = t.type === "EXPENSE" ? (t.isFixed ? "Fixa" : "Variável") : "";
      const category = t.category?.name || "";
      const paymentType = t.paymentType ? (paymentTypeLabels[t.paymentType] || t.paymentType) : "";
      const cardName = t.card?.name || "";
      const cardType = t.cardType === "CREDIT" ? "Crédito" : t.cardType === "DEBIT" ? "Débito" : "";
      const installment = t.installments ? `${t.currentInstallment}/${t.installments}` : "";
      const description = `"${t.description.replace(/"/g, '""')}"`;  
      const amount = t.amount.toFixed(2).replace(".", ",");
      const paid = t.paid ? "Sim" : "Não";
      return `${date},${type},${expenseType},${category},${paymentType},${cardName},${cardType},${installment},${description},${amount},${paid}`;
    });

    const csv = [header, ...rows].join("\n");
    const bom = "\uFEFF";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fintrack-transacoes-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao exportar transações" },
      { status: 500 }
    );
  }
}
