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
    return { bank: "Genérico", transactions: [], errors: ["Arquivo vazio ou sem dados"] };
  }

  const separator = detectCsvSeparator(content);
  const rawHeader = parseCsvLine(lines[0], separator);
  const header = rawHeader.map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]/g, "")
  );

  let dateIdx = header.findIndex((h) =>
    /^(data|date|dt|datalancamento|datamovimentacao)$/.test(h)
  );
  let descIdx = header.findIndex((h) =>
    /^(descricao|description|desc|historico|memo|titulo|title|lancamento)$/.test(h)
  );
  let valorIdx = header.findIndex((h) =>
    /^(valor|value|amount|quantia|vlr)$/.test(h)
  );

  if (dateIdx < 0) dateIdx = 0;
  if (valorIdx < 0) valorIdx = rawHeader.length - 1;
  if (descIdx < 0) descIdx = dateIdx === 0 ? 1 : 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i], separator);
    if (fields.length < 2) continue;

    try {
      const date = parseBrazilianDate(fields[dateIdx] || "");

      let amount = parseBrazilianAmount(fields[valorIdx] || "");

      if (amount === null && fields.length > valorIdx + 1) {
        amount = parseBrazilianAmount(fields[valorIdx + 1] || "") ||
          parseBrazilianAmount(fields[valorIdx - 1] || "");
      }

      const descParts: string[] = [];
      if (descIdx < fields.length) descParts.push(fields[descIdx]);
      if (descIdx + 1 < fields.length && descIdx + 1 !== valorIdx) {
        descParts.push(fields[descIdx + 1]);
      }
      const description = descParts.filter(Boolean).join(" - ") || "Sem descrição";

      if (!date || amount === null) {
        errors.push(`Linha ${i + 1}: não foi possível interpretar data ou valor`);
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

  return { bank: "Genérico", transactions, errors };
}

export const genericParser: BankParser = {
  id: "generic",
  name: "Genérico",
  supportsCsv: true,
  supportsPdf: false,
  parseCsv: parseCsv,
};
