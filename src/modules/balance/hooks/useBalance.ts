import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { formatDateOnly } from "@/lib/dates";
import { queryKeys } from "@/lib/query-keys";

export interface BalanceData {
  initialBalance: number;
  /** "yyyy-MM-dd" */
  initialBalanceDate: string;
  currentBalance: number;
}

export function useBalance() {
  return useQuery({
    queryKey: queryKeys.balance,
    queryFn: () =>
      apiFetch<{ data: BalanceData | null }>(
        `/api/balance?date=${formatDateOnly(new Date())}`
      ).then((r) => r.data),
  });
}

export function useSaveBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { amount: number; date: string } | { amount: null }) =>
      apiFetch("/api/balance", { method: "PUT", body: payload }),
    onSuccess: () =>
      Promise.all(
        ["balance", "projection"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      ),
  });
}
