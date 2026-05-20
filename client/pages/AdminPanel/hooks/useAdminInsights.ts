import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast.hook";
import { getAdminInsights } from "@/api/requests";
import type { InsightsData, AuditEvent } from "../types";

const SYSTEM_USER_IDS = new Set([1]);

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultAuditDateRange(): { fromDate: string; toDate: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { fromDate: formatDateInput(from), toDate: formatDateInput(to) };
}

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

export type AuditActionFilter = "" | "create" | "update" | "delete";

export type AuditFiltersApplied = {
  fromDate: string;
  toDate: string;
  actionFilter: AuditActionFilter;
  resourceFilter: string;
  operatorUserId: number | "";
};

export function useAdminInsights(isAdmin: boolean, enabled = true) {
  const defaults = useMemo(() => defaultAuditDateRange(), []);

  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [actionFilter, setActionFilter] = useState<AuditActionFilter>("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [operatorUserId, setOperatorUserId] = useState<number | "">("");
  const [applied, setApplied] = useState<AuditFiltersApplied>({
    fromDate: defaults.fromDate,
    toDate: defaults.toDate,
    actionFilter: "",
    resourceFilter: "",
    operatorUserId: "",
  });

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
      applied.fromDate,
      applied.toDate,
      applied.actionFilter,
      applied.resourceFilter,
      applied.operatorUserId,
      eventsPage,
      eventsPageSize,
    ],
    queryFn: () =>
      getAdminInsights({
        fromDate: applied.fromDate,
        toDate: applied.toDate,
        limit: eventsPageSize,
        page: eventsPage,
        operationType: applied.actionFilter || undefined,
        resource: applied.resourceFilter || undefined,
        userId:
          applied.operatorUserId === "" ? undefined : applied.operatorUserId,
      }),
    enabled: isAdmin && enabled && Boolean(applied.fromDate && applied.toDate),
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

  const applyFilters = () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Informe o intervalo de datas",
        variant: "error",
      });
      return;
    }
    if (fromDate > toDate) {
      toast({
        title: "Data inicial deve ser anterior à final",
        variant: "error",
      });
      return;
    }
    setApplied({
      fromDate,
      toDate,
      actionFilter,
      resourceFilter,
      operatorUserId,
    });
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
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    actionFilter,
    setActionFilter,
    resourceFilter,
    setResourceFilter,
    operatorUserId,
    setOperatorUserId,
    applyFilters,
    eventsPage,
    setEventsPage,
    eventsPageSize,
    setEventsPageSize,
    goToPage,
    totalFiltered,
    totalPages,
    from,
    to,
    auditCompareEvent,
    setAuditCompareEvent,
  };
}
