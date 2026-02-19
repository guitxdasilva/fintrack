export interface ParsedTransaction {
  date: string; // ISO string
  description: string;
  amount: number; // sempre positivo
  type: "INCOME" | "EXPENSE";
}

export interface ParseResult {
  bank: string;
  transactions: ParsedTransaction[];
  errors: string[];
}

export type BankId =
  | "nubank"
  | "inter"
  | "itau"
  | "bradesco"
  | "c6"
  | "santander"
  | "bb"
  | "caixa"
  | "generic";

export interface BankParser {
  id: BankId;
  name: string;
  supportsCsv: boolean;
  supportsPdf: boolean;
  parseCsv?(content: string): ParseResult;
  parsePdf?(text: string): ParseResult;
}

export const BANK_OPTIONS: { id: BankId; name: string }[] = [
  { id: "nubank", name: "Nubank" },
  { id: "inter", name: "Inter" },
  { id: "itau", name: "Itaú" },
  { id: "bradesco", name: "Bradesco" },
  { id: "c6", name: "C6 Bank" },
  { id: "santander", name: "Santander" },
  { id: "bb", name: "Banco do Brasil" },
  { id: "caixa", name: "Caixa" },
  { id: "generic", name: "Outro (CSV genérico)" },
];
