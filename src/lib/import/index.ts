import type { BankId, BankParser } from "./types";
import { nubankParser } from "./nubank";
import { interParser } from "./inter";
import { genericParser } from "./generic";

export { BANK_OPTIONS } from "./types";
export type { BankId, ParseResult, ParsedTransaction } from "./types";

const parsers: Record<string, BankParser> = {
  nubank: nubankParser,
  inter: interParser,
  itau: { ...genericParser, id: "itau" as BankId, name: "Itaú" },
  bradesco: { ...genericParser, id: "bradesco" as BankId, name: "Bradesco" },
  c6: { ...genericParser, id: "c6" as BankId, name: "C6 Bank" },
  santander: { ...genericParser, id: "santander" as BankId, name: "Santander" },
  bb: { ...genericParser, id: "bb" as BankId, name: "Banco do Brasil" },
  caixa: { ...genericParser, id: "caixa" as BankId, name: "Caixa" },
  generic: genericParser,
};

export function getParser(bankId: string): BankParser | null {
  return parsers[bankId] || null;
}

export function getAllParsers(): BankParser[] {
  return Object.values(parsers);
}
