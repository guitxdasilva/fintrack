import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys";
import type { SeriesScope } from "@/lib/transactions/series";
import type { PaginationData, Transaction } from "@/types";

interface TransactionListResponse {
  data: Transaction[];
  pagination: PaginationData;
}

export function useTransactions(params: Record<string, string>, enabled = true) {
  return useQuery({
    enabled,
    queryKey: queryKeys.transactionList(params),
    queryFn: () =>
      apiFetch<TransactionListResponse>(
        `/api/transactions?${new URLSearchParams(params).toString()}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useSaveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) =>
      apiFetch<{ data?: Transaction; message?: string; count?: number }>(
        id ? `/api/transactions/${id}` : "/api/transactions",
        { method: id ? "PUT" : "POST", body: payload }
      ),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

/** Deletes one transaction, or part of its series (see lib/transactions/series). */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scope = "this" }: { id: string; scope?: SeriesScope }) =>
      apiFetch<{ message: string; count: number }>(
        `/api/transactions/${id}?scope=${scope}`,
        { method: "DELETE" }
      ),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ data: { count: number; message: string } }>("/api/transactions", {
        method: "DELETE",
        body: { ids },
      }),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

/**
 * Optimistically flips `paid` on every cached transaction (lists, dashboard,
 * invoices) and returns a function that restores the previous cache.
 */
function applyPaidOptimistically(
  queryClient: QueryClient,
  updates: Map<string, boolean>
) {
  const patch = (list: Transaction[]) =>
    list.map((t) => (updates.has(t.id) ? { ...t, paid: updates.get(t.id) } : t));

  const snapshots = queryClient.getQueriesData<{ transactions?: Transaction[]; data?: unknown }>({
    predicate: (q) => ["transactions", "dashboard", "invoice"].includes(q.queryKey[0] as string),
  });

  for (const [key, value] of snapshots) {
    if (!value) continue;
    if (Array.isArray(value.data)) {
      queryClient.setQueryData(key, { ...value, data: patch(value.data as Transaction[]) });
    } else if (Array.isArray(value.transactions)) {
      queryClient.setQueryData(key, { ...value, transactions: patch(value.transactions) });
    }
  }

  return () => {
    for (const [key, value] of snapshots) queryClient.setQueryData(key, value);
  };
}

/** Sets paid status per transaction id. Groups ids into at most two requests. */
export function useSetTransactionsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Map<string, boolean>) => {
      const toPaid = [...updates].filter(([, paid]) => paid).map(([id]) => id);
      const toUnpaid = [...updates].filter(([, paid]) => !paid).map(([id]) => id);

      await Promise.all(
        [
          [toPaid, true],
          [toUnpaid, false],
        ]
          .filter(([ids]) => (ids as string[]).length > 0)
          .map(([ids, paid]) =>
            apiFetch("/api/transactions/paid", { method: "PATCH", body: { ids, paid } })
          )
      );

      return updates.size;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries();
      return { rollback: applyPaidOptimistically(queryClient, updates) };
    },
    onError: (_error, _updates, context) => context?.rollback(),
    onSettled: () => invalidateFinancialData(queryClient),
  });
}
