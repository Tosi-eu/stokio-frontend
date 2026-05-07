import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast.hook";
import { getAdminInsights } from "@/api/requests";
import type { InsightsData, AuditEvent } from "../types";

const SYSTEM_USER_IDS = new Set([1]);

function isSystemAuditEvent(e: AuditEvent): boolean {
  if (e.user_id != null && SYSTEM_USER_IDS.has(e.user_id)) return true;

  const path = (e.path ?? "").toLowerCase();
  if (
    path.includes("reposicao") ||
    path.includes("backfill") ||
    path.includes("price") ||
    path.includes("schedule") ||
    path.includes("temporal")
  ) {
    return true;
  }

  const resource = (e.resource ?? "").toLowerCase();
  if (
    resource.includes("pricing") ||
    resource.includes("reposicao") ||
    resource.includes("temporal") ||
    resource.includes("schedule")
  ) {
    return true;
  }

  return false;
}

export function useAdminInsights(isAdmin: boolean, enabled = true) {
  const [insightDays, setInsightDays] = useState(30);
  const [insightDaysInput, setInsightDaysInput] = useState("30");
  const [insightFilter, setInsightFilter] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [insightResourceFilter, setInsightResourceFilter] =
    useState<string>("");
  const [insightUserIdFilter, setInsightUserIdFilter] = useState<number | "">(
    "",
  );
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(25);
  const [auditCompareEvent, setAuditCompareEvent] = useState<AuditEvent | null>(
    null,
  );

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
      insightResourceFilter,
      insightUserIdFilter,
    ],
    queryFn: () =>
      getAdminInsights({
        days: insightDays,
        limit: eventsPageSize,
        page: eventsPage,
        operationType: insightFilter ?? undefined,
        resource: insightResourceFilter || undefined,
        userId: insightUserIdFilter === "" ? undefined : insightUserIdFilter,
      }),
    enabled: isAdmin && enabled,
  });

  const insights = useMemo(() => {
    if (!insightsData) return null;
    const rawEvents: AuditEvent[] = Array.isArray(insightsData.events)
      ? (insightsData.events as AuditEvent[])
      : [];
    const events = rawEvents.filter((e) => !isSystemAuditEvent(e));
    const removed = rawEvents.length - events.length;
    return {
      created: insightsData.created ?? 0,
      updated: insightsData.updated ?? 0,
      deleted: insightsData.deleted ?? 0,
      total: insightsData.total ?? 0,
      totalFiltered: Math.max(0, (insightsData.totalFiltered ?? 0) - removed),
      events,
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
    insightResourceFilter,
    setInsightResourceFilter,
    insightUserIdFilter,
    setInsightUserIdFilter,
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
