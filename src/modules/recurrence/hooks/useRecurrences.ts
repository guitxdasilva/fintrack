import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys";

export interface RecurringSuggestion {
  key: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  amountRange: { min: number; max: number } | null;
  monthsSeen: number;
  occurrences: number;
  categoryName: string | null;
  categoryIcon: string | null;
  cardName: string | null;
  lastDate: string;
  firstNewDate: string;
  seriesMonths: number;
}

type Target = Pick<RecurringSuggestion, "type" | "key">;

export function useRecurringSuggestions() {
  return useQuery({
    queryKey: queryKeys.recurrences,
    queryFn: () =>
      apiFetch<{ data: RecurringSuggestion[] }>("/api/recurrences").then((r) => r.data),
  });
}

export function useApplyRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, key }: Target) =>
      apiFetch<{ data: { created: number; marked: number; message: string } }>(
        "/api/recurrences/apply",
        { method: "POST", body: { type, key } }
      ),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useDismissRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, key }: Target) =>
      apiFetch("/api/recurrences/dismiss", { method: "POST", body: { type, key } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.recurrences }),
  });
}
