import { describe, expect, it } from "vitest";
import { getParser } from "..";
import { matchCategory } from "../category-matcher";
import {
  detectCsvSeparator,
  parseBrazilianAmount,
  parseBrazilianDate,
  parseCsvLine,
} from "../utils";
import type { Category } from "@/types";

const day = (iso: string) => iso.slice(0, 10);

describe("parseBrazilianDate", () => {
  it("parses dd/MM/yyyy, dd-MM-yy and yyyy-MM-dd", () => {
    expect(parseBrazilianDate("10/03/2026")?.toISOString()).toBe("2026-03-10T12:00:00.000Z");
    expect(parseBrazilianDate("10-03-26")?.toISOString()).toBe("2026-03-10T12:00:00.000Z");
    expect(parseBrazilianDate("2026-03-10")?.toISOString()).toBe("2026-03-10T12:00:00.000Z");
  });

  it("rejects impossible dates instead of rolling over", () => {
    expect(parseBrazilianDate("31/02/2026")).toBeNull();
    expect(parseBrazilianDate("10/13/2026")).toBeNull();
    expect(parseBrazilianDate("ontem")).toBeNull();
  });
});

describe("parseBrazilianAmount", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["R$ 1.234,56", 1234.56],
    ["-45,90", -45.9],
    ["1,234.56", 1234.56],
    ["12.5", 12.5],
    ["100", 100],
  ])("%s → %d", (input, expected) => {
    expect(parseBrazilianAmount(input)).toBe(expected);
  });

  it("returns null for non-numbers", () => {
    expect(parseBrazilianAmount("abc")).toBeNull();
  });
});

describe("CSV helpers", () => {
  it("handles quoted fields with separators and escaped quotes", () => {
    expect(parseCsvLine('a,"b, c","d ""e"""')).toEqual(["a", "b, c", 'd "e"']);
  });

  it("detects the separator", () => {
    expect(detectCsvSeparator("a;b;c\n1;2;3")).toBe(";");
    expect(detectCsvSeparator("a\tb\tc\n1\t2\t3")).toBe("\t");
    expect(detectCsvSeparator("a,b,c\n1,2,3")).toBe(",");
  });
});

describe("Nubank parser", () => {
  const nubank = getParser("nubank")!;

  it("card CSV: positive amounts are expenses", () => {
    const csv = [
      "date,category,title,amount",
      "2026-02-19,alimentação,Market4u,23.90",
      "2026-02-20,outros,Estorno,-10.00",
    ].join("\n");

    const { transactions, errors } = nubank.parseCsv!(csv);

    expect(errors).toEqual([]);
    expect(transactions).toHaveLength(2);
    expect(transactions[0]).toMatchObject({
      description: "Market4u",
      amount: 23.9,
      type: "EXPENSE",
    });
    expect(day(transactions[0].date)).toBe("2026-02-19");
    expect(transactions[1]).toMatchObject({ amount: 10, type: "INCOME" });
  });

  it("account CSV: negative amounts are expenses", () => {
    const csv = [
      "Data,Valor,Identificador,Descrição",
      "19/02/2026,-50.00,abc,Pix enviado",
      "20/02/2026,1500.00,def,Salário",
    ].join("\n");

    const { transactions } = nubank.parseCsv!(csv);

    expect(transactions.map((t) => [day(t.date), t.amount, t.type])).toEqual([
      ["2026-02-19", 50, "EXPENSE"],
      ["2026-02-20", 1500, "INCOME"],
    ]);
  });

  it("reports invalid lines without aborting", () => {
    const csv = ["date,category,title,amount", "xx,a,b,1.00", "2026-02-19,a,Ok,2.00"].join("\n");
    const { transactions, errors } = nubank.parseCsv!(csv);
    expect(transactions).toHaveLength(1);
    expect(errors).toHaveLength(1);
  });

  it("PDF: parses both line formats", () => {
    const text = [
      "Fatura referente a 2026",
      "2026-02-19 Market4u 23,90",
      "19 FEV Uber Trip 15,50",
    ].join("\n");

    const { transactions } = nubank.parsePdf!(text);

    expect(transactions.map((t) => [day(t.date), t.description, t.amount])).toEqual([
      ["2026-02-19", "Market4u", 23.9],
      ["2026-02-19", "Uber Trip", 15.5],
    ]);
  });
});

describe("Inter parser", () => {
  it("parses semicolon CSV with Brazilian amounts", () => {
    const csv = [
      "Data Lançamento;Descrição;Valor;Saldo",
      "10/03/2026;Pix recebido;1.200,00;3.000,00",
      "11/03/2026;Compra débito;-35,50;2.964,50",
    ].join("\n");

    const { transactions, errors } = getParser("inter")!.parseCsv!(csv);

    expect(errors).toEqual([]);
    expect(transactions.map((t) => [day(t.date), t.description, t.amount, t.type])).toEqual([
      ["2026-03-10", "Pix recebido", 1200, "INCOME"],
      ["2026-03-11", "Compra débito", 35.5, "EXPENSE"],
    ]);
  });

  it("rejects unknown headers", () => {
    const { transactions, errors } = getParser("inter")!.parseCsv!("foo;bar\n1;2");
    expect(transactions).toEqual([]);
    expect(errors[0]).toMatch(/Cabeçalho/);
  });
});

describe("Generic parser", () => {
  it("finds columns by header name", () => {
    const csv = ["Valor,Histórico,Data", "-99.90,Conta de luz,05/03/2026"].join("\n");
    const { transactions } = getParser("generic")!.parseCsv!(csv);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({ amount: 99.9, type: "EXPENSE" });
    expect(day(transactions[0].date)).toBe("2026-03-05");
  });
});

describe("matchCategory", () => {
  const categories = [
    { id: "food", name: "Alimentação" },
    { id: "transport", name: "Transporte" },
    { id: "pets", name: "Pets" },
  ] as Category[];

  it("matches by keyword rules, ignoring case and accents", () => {
    expect(matchCategory("IFOOD *RESTAURANTE", categories)).toBe("food");
  });

  it("falls back to the category name inside the description", () => {
    expect(matchCategory("Loja de pets do bairro", categories)).toBe("pets");
  });

  it("returns null when nothing matches", () => {
    expect(matchCategory("XYZ123", categories)).toBeNull();
  });
});
