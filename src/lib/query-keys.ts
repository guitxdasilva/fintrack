import type { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  transactions: ["transactions"] as const,
  transactionList: (params: Record<string, string>) =>
    ["transactions", "list", params] as const,
  dashboard: (month: number, year: number) => ["dashboard", month, year] as const,
  budget: (month: number, year: number) => ["budget", month, year] as const,
  invoice: (cardId: string, month: number, year: number) =>
    ["invoice", cardId, month, year] as const,
  categories: (type?: string) =>
    (type ? ["categories", type] : ["categories"]) as readonly string[],
  cards: ["cards"] as const,
  goals: ["goals"] as const,
  balance: ["balance"] as const,
  projection: (month: number, year: number, months: number, estimates: boolean) =>
    ["projection", month, year, months, estimates] as const,
};

/** Every query derived from transactions (lists, totals, invoices, budgets). */
export function invalidateFinancialData(queryClient: QueryClient) {
  return Promise.all(
    ["transactions", "dashboard", "budget", "invoice", "projection", "balance"].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    )
  );
}
