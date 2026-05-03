import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/api/requests";
import type { DashboardSummaryResponse } from "@/api/types";
import { APP_CONFIG } from "@/constants/app.constants";
import { useTenant } from "@/hooks/use-tenant.hook";
import { getPreviewDashboardSummary } from "@/helpers/preview-mock-data";
import { getEnabledSectors } from "@/helpers/tenant-sectors.helper";
import { useMemo } from "react";

export function useDashboardSummary(expiringDays?: number) {
  const { previewMode, modules, tenantId } = useTenant();
  const previewSummary = useMemo(() => getPreviewDashboardSummary(), []);
  const sectorsKey = useMemo(
    () => getEnabledSectors(modules).join(","),
    [modules],
  );
  const { data, isLoading, error, refetch } =
    useQuery<DashboardSummaryResponse>({
      queryKey: ["dashboard-summary", expiringDays, sectorsKey, tenantId],
      queryFn: () =>
        getDashboardSummary(
          expiringDays != null ? { expiringDays } : undefined,
        ),
      staleTime: (APP_CONFIG.CACHE_TTL.DASHBOARD ?? 60) * 1000,
      enabled: !previewMode,
    });

  return {
    summary: previewMode ? previewSummary : data,
    isLoading: previewMode ? false : isLoading,
    error: previewMode ? null : error,
    refetch,
  };
}
