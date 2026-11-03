import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Projection } from "@/lib/projection";
import type { BudgetData, DashboardData } from "@/types";

export function useDashboard(month: number, year: number) {
  return useQuery({
    queryKey: queryKeys.dashboard(month, year),
    queryFn: () =>
      apiFetch<{ data: DashboardData }>(`/api/dashboard?month=${month}&year=${year}`).then(
        (r) => r.data
      ),
    placeholderData: keepPreviousData,
  });
}

export function useBudget(month: number, year: number) {
  return useQuery({
    queryKey: queryKeys.budget(month, year),
    queryFn: () =>
      apiFetch<{ data: BudgetData }>(`/api/budget?month=${month}&year=${year}`).then(
        (r) => r.data
      ),
    placeholderData: keepPreviousData,
  });
}

export function useProjection(month: number, year: number, months: number, estimates: boolean) {
  return useQuery({
    queryKey: queryKeys.projection(month, year, months, estimates),
    queryFn: () =>
      apiFetch<{ data: Projection }>(
        `/api/projection?month=${month}&year=${year}&months=${months}&estimates=${estimates}`
      ).then((r) => r.data),
    placeholderData: keepPreviousData,
  });
}
