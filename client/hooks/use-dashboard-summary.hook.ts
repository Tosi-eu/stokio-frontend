import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/api/requests";
import type { DashboardSummaryResponse } from "@/api/types";
import { APP_CONFIG } from "@/constants/app.constants";

export function useDashboardSummary(expiringDays?: number) {
  const { data, isLoading, error, refetch } = useQuery<DashboardSummaryResponse>({
    queryKey: ["dashboard-summary", expiringDays],
    queryFn: () => getDashboardSummary(expiringDays != null ? { expiringDays } : undefined),
    staleTime: (APP_CONFIG.CACHE_TTL.DASHBOARD ?? 60) * 1000,
  });

  return {
    summary: data,
    isLoading,
    error,
    refetch,
  };
}
