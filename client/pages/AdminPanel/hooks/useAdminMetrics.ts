import { useEffect, useState } from "react";
import { getAdminMetrics } from "@/api/requests";
import type { AdminMetricsResponse } from "@/api/requests";

export function useAdminMetrics(isAdmin: boolean) {
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    getAdminMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, [isAdmin]);

  return { metrics };
}
