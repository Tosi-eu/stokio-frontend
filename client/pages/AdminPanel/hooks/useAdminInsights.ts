import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast.hook";
import { getAdminInsights } from "@/api/requests";
import type { InsightsData, AuditEvent } from "../types";

export function useAdminInsights(isAdmin: boolean) {
  const [insightDays, setInsightDays] = useState(30);
  const [insightDaysInput, setInsightDaysInput] = useState("30");
  const [insightFilter, setInsightFilter] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(25);
  const [auditCompareEvent, setAuditCompareEvent] = useState<AuditEvent | null>(null);

  const {
    data: insightsData,
    isLoading: loadingInsights,
    isError: insightsError,
  } = useQuery({
    queryKey: [
      "admin",
      "insights",
      insightDays,
      eventsPage,
      eventsPageSize,
      insightFilter,
    ],
    queryFn: () =>
      getAdminInsights({
        days: insightDays,
        limit: eventsPageSize,
        page: eventsPage,
        operationType: insightFilter ?? undefined,
      }),
    enabled: isAdmin,
  });

  const insights = useMemo(() => {
    if (!insightsData) return null;
    return {
      created: insightsData.created ?? 0,
      updated: insightsData.updated ?? 0,
      deleted: insightsData.deleted ?? 0,
      total: insightsData.total ?? 0,
      totalFiltered: insightsData.totalFiltered ?? 0,
      events: insightsData.events ?? [],
    } as InsightsData;
  }, [insightsData]);

  useEffect(() => {
    if (insightsError) {
      toast({ title: "Erro ao carregar insights", variant: "error" });
    }
  }, [insightsError]);

  const applyInsightDays = () => {
    const n = Math.min(365, Math.max(1, Number(insightDaysInput) || 30));
    setInsightDaysInput(String(n));
    setInsightDays(n);
    setEventsPage(1);
  };

  const goToPage = (page: number) => {
    setEventsPage(Math.max(1, page));
  };

  const totalFiltered = insights?.totalFiltered ?? 0;
  const { totalPages, from, to } = useMemo(() => {
    const total = insights?.totalFiltered ?? 0;
    const pages = Math.max(1, Math.ceil(total / eventsPageSize));
    const fromVal = total === 0 ? 0 : (eventsPage - 1) * eventsPageSize + 1;
    const toVal = Math.min(eventsPage * eventsPageSize, total);
    return { totalPages: pages, from: fromVal, to: toVal };
  }, [insights?.totalFiltered, eventsPage, eventsPageSize]);

  return {
    insights,
    loadingInsights,
    insightsError,
    insightDays,
    insightDaysInput,
    setInsightDaysInput,
    insightFilter,
    setInsightFilter,
    eventsPage,
    setEventsPage,
    eventsPageSize,
    setEventsPageSize,
    applyInsightDays,
    goToPage,
    totalFiltered,
    totalPages,
    from,
    to,
    auditCompareEvent,
    setAuditCompareEvent,
  };
}
