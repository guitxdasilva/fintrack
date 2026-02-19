import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  BANK_SLIP: "Boleto",
};

function buildWhere(searchParams: URLSearchParams, userId: string) {
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

  const where: Record<string, unknown> = { userId };

  if (type && (type === "INCOME" || type === "EXPENSE")) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.description = { contains: search, mode: "insensitive" };
  if (cardId) where.cardId = cardId;
  if (paid === "true" || paid === "false") where.paid = paid === "true";
  if (isFixed === "true" || isFixed === "false") where.isFixed = isFixed === "true";
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
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  return where;
}

interface TransactionRow {
  date: string;
  type: string;
  expenseType: string;
  category: string;
  paymentType: string;
  cardName: string;
  cardType: string;
  installment: string;
  description: string;
  amount: number;
  paid: string;
}

function mapTransactions(
  transactions: {
    date: Date;
    type: string;
    isFixed: boolean;
    category?: { name: string } | null;
    paymentType?: string | null;
    card?: { name: string } | null;
    cardType?: string | null;
    installments?: number | null;
    currentInstallment?: number | null;
    description: string;
    amount: number;
    paid: boolean;
  }[]
): TransactionRow[] {
  return transactions.map((t) => ({
    date: new Date(t.date).toLocaleDateString("pt-BR"),
    type: t.type === "INCOME" ? "Receita" : "Despesa",
    expenseType: t.type === "EXPENSE" ? (t.isFixed ? "Fixa" : "Variável") : "",
    category: t.category?.name || "",
    paymentType: t.paymentType ? (PAYMENT_LABELS[t.paymentType] || t.paymentType) : "",
    cardName: t.card?.name || "",
    cardType: t.cardType === "CREDIT" ? "Crédito" : t.cardType === "DEBIT" ? "Débito" : "",
    installment: t.installments ? `${t.currentInstallment}/${t.installments}` : "",
    description: t.description,
    amount: t.amount,
    paid: t.paid ? "Sim" : "Não",
  }));
}

function buildCsv(rows: TransactionRow[]): string {
  const header = "Data,Tipo,Tipo Despesa,Categoria,Pagamento,Cartão,Tipo Cartão,Parcela,Descrição,Valor,Pago";
  const csvRows = rows.map((r) => {
    const desc = `"${r.description.replace(/"/g, '""')}"`;
    const amount = r.amount.toFixed(2).replace(".", ",");
    return `${r.date},${r.type},${r.expenseType},${r.category},${r.paymentType},${r.cardName},${r.cardType},${r.installment},${desc},${amount},${r.paid}`;
  });
  return "\uFEFF" + [header, ...csvRows].join("\n");
}

function buildPdf(rows: TransactionRow[], monthLabel: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text("Finplanix - Relatório de Transações", { align: "center" });
    doc.fontSize(10).font("Helvetica").text(monthLabel, { align: "center" });
    doc.moveDown(0.5);

    const totalIncome = rows.filter((r) => r.type === "Receita").reduce((s, r) => s + r.amount, 0);
    const totalExpense = rows.filter((r) => r.type === "Despesa").reduce((s, r) => s + r.amount, 0);
    const balance = totalIncome - totalExpense;

    doc.fontSize(9).font("Helvetica");
    doc.text(`Total Receitas: R$ ${totalIncome.toFixed(2).replace(".", ",")}   |   Total Despesas: R$ ${totalExpense.toFixed(2).replace(".", ",")}   |   Saldo: R$ ${balance.toFixed(2).replace(".", ",")}`, { align: "center" });
    doc.moveDown(0.5);

    const cols = [
      { label: "Data", width: 60 },
      { label: "Tipo", width: 50 },
      { label: "Categoria", width: 80 },
      { label: "Descrição", width: 200 },
      { label: "Pagamento", width: 65 },
      { label: "Cartão", width: 75 },
      { label: "Parcela", width: 45 },
      { label: "Valor", width: 70 },
      { label: "Pago", width: 35 },
    ];

    const tableLeft = doc.page.margins.left;
    const rowHeight = 18;
    let y = doc.y;

    function drawHeaderRow() {
      doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), rowHeight).fill("#1e293b");
      let x = tableLeft;
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");
      for (const col of cols) {
        doc.text(col.label, x + 4, y + 5, { width: col.width - 8, ellipsis: true });
        x += col.width;
      }
      doc.fillColor("#000000");
      y += rowHeight;
    }

    drawHeaderRow();

    for (let i = 0; i < rows.length; i++) {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow();
      }

      const r = rows[i];
      const bgColor = i % 2 === 0 ? "#f8fafc" : "#ffffff";
      doc.rect(tableLeft, y, cols.reduce((s, c) => s + c.width, 0), rowHeight).fill(bgColor);

      const amountStr = `R$ ${r.amount.toFixed(2).replace(".", ",")}`;
      const textColor = r.type === "Receita" ? "#16a34a" : "#dc2626";
      const values = [r.date, r.type, r.category, r.description, r.paymentType, r.cardName, r.installment, amountStr, r.paid];

      let x = tableLeft;
      doc.font("Helvetica").fontSize(7.5);
      for (let j = 0; j < cols.length; j++) {
        doc.fillColor(j === 7 ? textColor : "#334155");
        doc.text(values[j], x + 4, y + 5, { width: cols[j].width - 8, ellipsis: true });
        x += cols[j].width;
      }

      y += rowHeight;
    }

    doc.fillColor("#64748b").fontSize(7);
    const footerY = doc.page.height - doc.page.margins.bottom + 10;
    doc.text(
      `Gerado por Finplanix em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      tableLeft,
      footerY,
      { align: "center", width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
    );

    doc.end();
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const where = buildWhere(searchParams, session.user.id);

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, card: true },
      orderBy: { date: "desc" },
    });

    const rows = mapTransactions(transactions);
    const dateStr = new Date().toISOString().split("T")[0];

    if (format === "pdf") {
      const monthParam = searchParams.get("month");
      const yearParam = searchParams.get("year");
      let monthLabel = "";
      if (monthParam !== null && yearParam !== null) {
        const monthNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
        ];
        monthLabel = `${monthNames[parseInt(monthParam)]} de ${yearParam}`;
      }

      const pdfBuffer = await buildPdf(rows, monthLabel);

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="finplanix-transacoes-${dateStr}.pdf"`,
        },
      });
    }

    const csv = buildCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="finplanix-transacoes-${dateStr}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao exportar transações" },
      { status: 500 }
    );
  }
}
