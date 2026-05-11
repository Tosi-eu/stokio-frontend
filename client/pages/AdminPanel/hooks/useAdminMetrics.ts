import { useEffect, useState } from "react";
import { getAdminMetrics } from "@/api/requests";
import type { AdminMetricsResponse } from "@/api/requests";
import { useTenant } from "@/hooks/use-tenant.hook";

export function useAdminMetrics(isAdmin: boolean, enabled = true) {
  const { tenantId } = useTenant();
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);

  useEffect(() => {
    if (!isAdmin || !enabled) return;
    getAdminMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, [isAdmin, enabled, tenantId]);

  return { metrics };
}
