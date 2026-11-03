import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys";
import type { Card, InvoiceData } from "@/types";

export function useCards() {
  return useQuery({
    queryKey: queryKeys.cards,
    queryFn: () => apiFetch<{ data: Card[] }>("/api/cards").then((r) => r.data),
  });
}

function fetchInvoice(cardId: string, month: number, year: number) {
  return apiFetch<{ data: InvoiceData }>(
    `/api/cards/${cardId}/invoice?month=${month}&year=${year}`
  ).then((r) => r.data);
}

export function useCardInvoice(
  cardId: string | undefined,
  month: number,
  year: number,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.invoice(cardId ?? "", month, year),
    queryFn: () => fetchInvoice(cardId!, month, year),
    enabled: enabled && !!cardId,
  });
}

/** Invoices for several cards, keyed by card id. */
export function useCardInvoices(cardIds: string[], month: number, year: number) {
  return useQueries({
    queries: cardIds.map((cardId) => ({
      queryKey: queryKeys.invoice(cardId, month, year),
      queryFn: () => fetchInvoice(cardId, month, year),
    })),
    combine: (results) => ({
      invoices: new Map(
        results.flatMap((r, i) => (r.data ? [[cardIds[i], r.data] as const] : []))
      ),
      isLoading: results.some((r) => r.isLoading),
    }),
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, month, year }: { cardId: string; month: number; year: number }) =>
      apiFetch<{ data: { count: number; message: string } }>(
        `/api/cards/${cardId}/invoice/pay?month=${month}&year=${year}`,
        { method: "POST" }
      ),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useSaveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) =>
      apiFetch<{ data: Card }>(id ? `/api/cards/${id}` : "/api/cards", {
        method: id ? "PUT" : "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards });
      return invalidateFinancialData(queryClient);
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/cards/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cards }),
  });
}

/** A refund on a card not tied to a purchase, credited to the given invoice. */
export function useCardRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      ...body
    }: {
      cardId: string;
      amount: number;
      categoryId: string;
      month: number;
      year: number;
      description?: string;
      date?: string;
    }) =>
      apiFetch<{ message: string }>(`/api/cards/${cardId}/refund`, { method: "POST", body }),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}
