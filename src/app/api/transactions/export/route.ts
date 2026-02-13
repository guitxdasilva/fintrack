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

    if (startDate || endDate) {
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

    const header = "Data,Tipo,Categoria,Pagamento,Cartão,Tipo Cartão,Parcela,Descrição,Valor,Pago";
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
      const category = t.category?.name || "";
      const paymentType = t.paymentType ? (paymentTypeLabels[t.paymentType] || t.paymentType) : "";
      const cardName = t.card?.name || "";
      const cardType = t.cardType === "CREDIT" ? "Crédito" : t.cardType === "DEBIT" ? "Débito" : "";
      const installment = t.installments ? `${t.currentInstallment}/${t.installments}` : "";
      const description = `"${t.description.replace(/"/g, '""')}"`;  
      const amount = t.amount.toFixed(2).replace(".", ",");
      const paid = t.paid ? "Sim" : "Não";
      return `${date},${type},${category},${paymentType},${cardName},${cardType},${installment},${description},${amount},${paid}`;
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
