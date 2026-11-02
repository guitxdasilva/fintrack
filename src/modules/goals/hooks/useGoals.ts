import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Goal } from "@/types";

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => apiFetch<{ data: Goal[] }>("/api/goals").then((r) => r.data),
  });
}

export function useSaveGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: Record<string, unknown> }) =>
      apiFetch<{ data: Goal }>(id ? `/api/goals/${id}` : "/api/goals", {
        method: id ? "PUT" : "POST",
        body: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}
