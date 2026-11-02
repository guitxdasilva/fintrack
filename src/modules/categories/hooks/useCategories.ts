import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys";
import type { Category, TransactionType } from "@/types";

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: queryKeys.categories(type),
    queryFn: () =>
      apiFetch<{ data: Category[] }>(
        type ? `/api/categories?type=${type}` : "/api/categories"
      ).then((r) => r.data),
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) =>
      apiFetch<{ data: Category }>(id ? `/api/categories/${id}` : "/api/categories", {
        method: id ? "PUT" : "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      return invalidateFinancialData(queryClient);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
}
