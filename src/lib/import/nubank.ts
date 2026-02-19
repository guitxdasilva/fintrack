import type { BankParser, ParseResult, ParsedTransaction } from "./types";
import {
  parseBrazilianDate,
  parseBrazilianAmount,
  splitCsvLines,
  parseCsvLine,
  detectCsvSeparator,
} from "./utils";

const MONTH_MAP: Record<string, number> = {
  JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
  JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
};

function parseCsv(content: string): ParseResult {
  const lines = splitCsvLines(content);
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    return { bank: "Nubank", transactions: [], errors: ["Arquivo vazio ou sem dados"] };
  }

  const separator = detectCsvSeparator(content);
  const header = parseCsvLine(lines[0], separator).map((h) =>
    h.toLowerCase().replace(/[^\w]/g, "")
  );

  const isCardCsv = header.includes("title") || header.includes("category");
  const isAccountCsv = header.includes("descrio") || header.includes("identificador") || header.includes("descrição") || header.includes("data");

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i], separator);
    if (fields.length < 3) continue;

    try {
      if (isCardCsv) {
        const dateIdx = header.indexOf("date");
        const titleIdx = header.indexOf("title");
        const amountIdx = header.indexOf("amount");

        const dateStr = fields[dateIdx >= 0 ? dateIdx : 0];
        const description = fields[titleIdx >= 0 ? titleIdx : 2];
        const amountStr = fields[amountIdx >= 0 ? amountIdx : 3];

        const date = parseBrazilianDate(dateStr);
        const amount = parseBrazilianAmount(amountStr);

        if (!date || amount === null) {
          errors.push(`Linha ${i + 1}: formato inválido`);
          continue;
        }

        transactions.push({
          date: date.toISOString(),
          description: description || "Sem descrição",
          amount: Math.abs(amount),
          type: amount < 0 ? "INCOME" : "EXPENSE", // Nubank card CSV: positive = expense
        });
      } else if (isAccountCsv) {
        const dateIdx = header.findIndex((h) => h === "data");
        const valorIdx = header.findIndex((h) => h === "valor");
        const descIdx = header.findIndex((h) => h === "descrio" || h === "descrição" || h === "descricao");

        const dateStr = fields[dateIdx >= 0 ? dateIdx : 0];
        const amountStr = fields[valorIdx >= 0 ? valorIdx : 1];
        const description = fields[descIdx >= 0 ? descIdx : 3] || fields[2] || "Sem descrição";

        const date = parseBrazilianDate(dateStr);
        const amount = parseBrazilianAmount(amountStr);

        if (!date || amount === null) {
          errors.push(`Linha ${i + 1}: formato inválido`);
          continue;
        }

        transactions.push({
          date: date.toISOString(),
          description,
          amount: Math.abs(amount),
          type: amount >= 0 ? "INCOME" : "EXPENSE",
        });
      } else {
        const date = parseBrazilianDate(fields[0]);
        const amount = parseBrazilianAmount(fields[fields.length - 1]);
        const description = fields.slice(1, -1).join(" ").trim() || fields[1] || "Sem descrição";

        if (!date || amount === null) {
          errors.push(`Linha ${i + 1}: formato inválido`);
          continue;
        }

        transactions.push({
          date: date.toISOString(),
          description,
          amount: Math.abs(amount),
          type: amount >= 0 ? "INCOME" : "EXPENSE",
        });
      }
    } catch {
      errors.push(`Linha ${i + 1}: erro ao processar`);
    }
  }

  return { bank: "Nubank", transactions, errors };
}

function parsePdf(text: string): ParseResult {
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const tsvRegex = /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[\d.,]+)$/;
  const legacyRegex = /^(\d{1,2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(.+?)\s+([\d.,]+)$/i;

  let detectedYear = new Date().getFullYear();
  const yearMatch = text.match(/(?:fatura|extrato|referente|período).*?(\d{4})/i) ||
    text.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    detectedYear = parseInt(yearMatch[1]);
  }

  for (const line of lines) {
    if (/^date\s+title/i.test(line) || /^--\s*\d+/i.test(line)) continue;

    const tsvMatch = line.match(tsvRegex);
    if (tsvMatch) {
      const date = parseBrazilianDate(tsvMatch[1]);
      const description = tsvMatch[2].trim();
      const amount = parseBrazilianAmount(tsvMatch[3]);

      if (!date || amount === null || amount === 0) {
        errors.push(`Linha ignorada: ${line.substring(0, 50)}`);
        continue;
      }

      transactions.push({
        date: date.toISOString(),
        description,
        amount: Math.abs(amount),
        type: amount < 0 ? "INCOME" : "EXPENSE",
      });
      continue;
    }

    const legacyMatch = line.match(legacyRegex);
    if (legacyMatch) {
      const day = parseInt(legacyMatch[1]);
      const monthStr = legacyMatch[2].toUpperCase();
      const description = legacyMatch[3].trim();
      const amountStr = legacyMatch[4];

      const month = MONTH_MAP[monthStr];
      if (month === undefined) continue;

      const amount = parseBrazilianAmount(amountStr);
      if (amount === null || amount === 0) continue;

      const date = new Date(detectedYear, month, day);

      transactions.push({
        date: date.toISOString(),
        description,
        amount: Math.abs(amount),
        type: "EXPENSE",
      });
    }
  }

  if (transactions.length === 0) {
    errors.push("Nenhuma transação encontrada. Verifique se o PDF é uma fatura Nubank.");
  }

  return { bank: "Nubank", transactions, errors };
}

export const nubankParser: BankParser = {
  id: "nubank",
  name: "Nubank",
  supportsCsv: true,
  supportsPdf: true,
  parseCsv: parseCsv,
  parsePdf: parsePdf,
};
