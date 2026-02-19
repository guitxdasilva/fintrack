import type { BankParser, ParseResult, ParsedTransaction } from "./types";
import {
  parseBrazilianDate,
  parseBrazilianAmount,
  splitCsvLines,
  parseCsvLine,
  detectCsvSeparator,
} from "./utils";

function parseCsv(content: string): ParseResult {
  const lines = splitCsvLines(content);
  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  if (lines.length < 2) {
    return { bank: "Inter", transactions: [], errors: ["Arquivo vazio ou sem dados"] };
  }

  const separator = detectCsvSeparator(content);
  const header = parseCsvLine(lines[0], separator).map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]/g, "")
  );

  const dateIdx = header.findIndex((h) => h.includes("data"));
  const descIdx = header.findIndex((h) => h.includes("descri") || h.includes("historic"));
  const valorIdx = header.findIndex((h) => h.includes("valor"));

  if (dateIdx < 0 || valorIdx < 0) {
    return { bank: "Inter", transactions: [], errors: ["Cabeçalho não reconhecido como Inter"] };
  }

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i], separator);
    if (fields.length < 3) continue;

    try {
      const date = parseBrazilianDate(fields[dateIdx]);
      const amount = parseBrazilianAmount(fields[valorIdx]);
      const description = fields[descIdx >= 0 ? descIdx : 1] || "Sem descrição";

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
    } catch {
      errors.push(`Linha ${i + 1}: erro ao processar`);
    }
  }

  return { bank: "Inter", transactions, errors };
}

export const interParser: BankParser = {
  id: "inter",
  name: "Inter",
  supportsCsv: true,
  supportsPdf: false,
  parseCsv: parseCsv,
};
