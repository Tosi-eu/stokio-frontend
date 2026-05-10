import { useEffect, useMemo, useState } from "react";
import {
  getAdminActiveUsersThisMonth,
  getAdminMovementsThisMonth,
} from "@/api/requests";
import type {
  AdminActiveUserThisMonth,
  StockHistoryEntry,
} from "@/api/requests";

export function useAdminTabResumoMetrics() {
  const [metricsDialog, setMetricsDialog] = useState<
    null | "activeUsers" | "movements"
  >(null);
  const [metricsPage, setMetricsPage] = useState(1);
  const [metricsLimit, setMetricsLimit] = useState(25);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [activeUsersRows, setActiveUsersRows] = useState<
    AdminActiveUserThisMonth[]
  >([]);
  const [activeUsersTotal, setActiveUsersTotal] = useState(0);

  const [movementsRows, setMovementsRows] = useState<StockHistoryEntry[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);

  const metricsTotalPages = useMemo(() => {
    const total =
      metricsDialog === "activeUsers" ? activeUsersTotal : movementsTotal;
    return Math.max(1, Math.ceil(total / metricsLimit));
  }, [activeUsersTotal, movementsTotal, metricsLimit, metricsDialog]);

  useEffect(() => {
    if (!metricsDialog) return;
    const id = setTimeout(() => setMetricsPage(1), 0);
    return () => clearTimeout(id);
  }, [metricsDialog]);

  useEffect(() => {
    if (!metricsDialog) return;
    let cancelled = false;
    const timeoutId = setTimeout(() => setMetricsLoading(true), 0);

    (metricsDialog === "activeUsers"
      ? getAdminActiveUsersThisMonth({ page: metricsPage, limit: metricsLimit })
      : getAdminMovementsThisMonth({ page: metricsPage, limit: metricsLimit })
    )
      .then((res) => {
        if (cancelled) return;
        if (metricsDialog === "activeUsers") {
          setActiveUsersRows(Array.isArray(res?.data) ? res.data : []);
          setActiveUsersTotal(Number(res?.total) || 0);
        } else {
          setMovementsRows(Array.isArray(res?.data) ? res.data : []);
          setMovementsTotal(Number(res?.total) || 0);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (metricsDialog === "activeUsers") {
          setActiveUsersRows([]);
          setActiveUsersTotal(0);
        } else {
          setMovementsRows([]);
          setMovementsTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setMetricsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [metricsDialog, metricsPage, metricsLimit]);

  return {
    metricsDialog,
    setMetricsDialog,
    metricsPage,
    setMetricsPage,
    metricsLimit,
    setMetricsLimit,
    metricsLoading,
    metricsTotalPages,
    activeUsersRows,
    movementsRows,
  };
}
