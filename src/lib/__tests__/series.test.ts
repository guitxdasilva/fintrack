import { describe, expect, it } from "vitest";
import {
  hasInstallmentSuffix,
  seriesWhere,
  stripInstallmentSuffix,
  withInstallmentSuffix,
} from "../transactions/series";

const member = {
  id: "t3",
  userId: "u1",
  installmentGroupId: "g1",
  currentInstallment: 3,
};

describe("seriesWhere", () => {
  it("'this' targets only the transaction", () => {
    expect(seriesWhere(member, "this")).toEqual({ id: "t3", userId: "u1" });
  });

  it("'future' targets this and later installments of the group", () => {
    expect(seriesWhere(member, "future")).toEqual({
      userId: "u1",
      installmentGroupId: "g1",
      currentInstallment: { gte: 3 },
    });
  });

  it("'all' targets the whole group", () => {
    expect(seriesWhere(member, "all")).toEqual({ userId: "u1", installmentGroupId: "g1" });
  });

  it("falls back to the single transaction when there is no group", () => {
    const single = { ...member, installmentGroupId: null };
    expect(seriesWhere(single, "all")).toEqual({ id: "t3", userId: "u1" });
    expect(seriesWhere(single, "future")).toEqual({ id: "t3", userId: "u1" });
  });
});

describe("installment suffix", () => {
  it("strips the trailing (n/m)", () => {
    expect(stripInstallmentSuffix("Notebook (2/10)")).toBe("Notebook");
    expect(stripInstallmentSuffix("Notebook")).toBe("Notebook");
    expect(stripInstallmentSuffix("Aluguel (casa) (1/3)")).toBe("Aluguel (casa)");
  });

  it("detects only this transaction's own suffix", () => {
    expect(hasInstallmentSuffix("Notebook (2/10)", 2, 10)).toBe(true);
    expect(hasInstallmentSuffix("Notebook (2/10)", 3, 10)).toBe(false);
    expect(hasInstallmentSuffix("Aluguel", 2, 12)).toBe(false);
  });

  it("builds the suffix", () => {
    expect(withInstallmentSuffix("Notebook", 4, 10)).toBe("Notebook (4/10)");
  });
});
