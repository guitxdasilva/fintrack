import { describe, expect, it } from "vitest";
import { dateOnly } from "../../dates";
import {
  detectRecurringHeuristic,
  recurrenceKey,
  type RecurrenceCandidate,
} from "../detect";

const TODAY = dateOnly(2026, 10, 15); // 15/Nov/2026

let seq = 0;
function tx(
  description: string,
  month: number,
  amount: number,
  extra: Partial<RecurrenceCandidate> = {}
): RecurrenceCandidate {
  seq++;
  return {
    id: `t${seq}`,
    description,
    amount,
    type: "EXPENSE",
    date: dateOnly(2026, month, 10),
    isFixed: false,
    installmentGroupId: null,
    categoryId: "cat",
    ...extra,
  };
}

const detect = (txs: RecurrenceCandidate[]) => detectRecurringHeuristic(txs, TODAY);

describe("recurrenceKey", () => {
  it("normalizes case, accents, digits and symbols", () => {
    expect(recurrenceKey("Ebn*Spotify")).toBe("ebn spotify");
    expect(recurrenceKey("Tim*51981736166")).toBe("tim");
    expect(recurrenceKey("Condomínio  Ed. Sol")).toBe("condominio ed sol");
  });
});

describe("detectRecurringHeuristic", () => {
  it("finds a monthly subscription and uses its latest occurrence", () => {
    const [s, ...rest] = detect([
      tx("Ebn*Spotify", 7, 21.9),
      tx("Ebn*Spotify", 8, 21.9),
      tx("EBN*SPOTIFY", 9, 23.9),
      tx("Ebn*Spotify", 10, 23.9),
    ]);

    expect(rest).toEqual([]);
    expect(s).toMatchObject({
      key: "ebn spotify",
      description: "Ebn*Spotify",
      amount: 23.9,
      monthsSeen: 4,
    });
    expect(s.transactionIds).toHaveLength(4);
  });

  it("ignores frequent shopping (several per month)", () => {
    const txs = [7, 8, 9, 10].flatMap((m) => [
      tx("Market4u", m, 20),
      tx("Market4u", m, 22),
      tx("Market4u", m, 25),
    ]);
    expect(detect(txs)).toEqual([]);
  });

  it("requires at least 3 distinct months", () => {
    expect(detect([tx("Netflix", 9, 39.9), tx("Netflix", 10, 39.9)])).toEqual([]);
  });

  it("ignores amounts that vary more than 2x", () => {
    expect(
      detect([tx("Energia", 8, 100), tx("Energia", 9, 250), tx("Energia", 10, 120)])
    ).toEqual([]);
  });

  it("suggests variable bills with the recent median", () => {
    const [s] = detect([tx("Luz", 7, 214.6), tx("Luz", 8, 141.57), tx("Luz", 9, 236.6), tx("Luz", 10, 236.24)]);
    expect(s.amount).toBe(236.24); // median of the last 3: 141.57, 236.24, 236.6
    expect(s.amountRange).toEqual({ min: 141.57, max: 236.6 });
  });

  it("uses the latest amount for small price changes", () => {
    const [s] = detect([tx("Netflix", 8, 39.9), tx("Netflix", 9, 39.9), tx("Netflix", 10, 44.9)]);
    expect(s).toMatchObject({ amount: 44.9, amountRange: null });
  });

  it("ignores stopped recurrences", () => {
    expect(
      detect([tx("Academia", 5, 99), tx("Academia", 6, 99), tx("Academia", 7, 99)])
    ).toEqual([]);
  });

  it("stays active with up to 2 months not registered yet", () => {
    const result = detect([tx("Aluguel", 6, 1500), tx("Aluguel", 7, 1500), tx("Aluguel", 8, 1500)]);
    expect(result.map((s) => s.key)).toEqual(["aluguel"]);
  });

  it("skips installments, fixed entries and installment-like text", () => {
    const g = { installmentGroupId: "g1" };
    expect(
      detect([
        ...[8, 9, 10].map((m) => tx("Notebook", m, 300, g)),
        ...[8, 9, 10].map((m) => tx("Seguro", m, 80, { isFixed: true })),
        ...[8, 9, 10].map((m, i) => tx(`Mercadolivre - Parcela ${i + 1}/4`, m, 50)),
      ])
    ).toEqual([]);
  });

  it("keeps income and expense with the same text apart", () => {
    const result = detect([
      ...[8, 9, 10].map((m) => tx("Pix Joao", m, 200)),
      ...[8, 9, 10].map((m) => tx("Pix Joao", m, 200, { type: "INCOME" })),
    ]);
    expect(result.map((s) => s.type).sort()).toEqual(["EXPENSE", "INCOME"]);
  });

  it("detects a salary entered as one-off income", () => {
    const [s] = detect(
      [8, 9, 10].map((m) => tx("Salário Empresa X", m, 7700, { type: "INCOME" }))
    );
    expect(s).toMatchObject({ type: "INCOME", amount: 7700, key: "salario empresa x" });
  });
});
