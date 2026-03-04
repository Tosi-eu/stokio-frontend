import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  getMedicines,
  getInputs,
  getResidentsCount,
  getCabinetsCount,
  getDrawersCount,
  getResidents,
  getCabinets,
  getDrawers,
} from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import type { ExecutiveSummary } from "../types";

export type SummaryListKind =
  | "residents"
  | "medicines"
  | "inputs"
  | "cabinets"
  | "drawers";

export function useAdminSummary(isAdmin: boolean) {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState<SummaryListKind | null>(
    null,
  );
  const [summaryListData, setSummaryListData] = useState<
    Record<string, unknown>[]
  >([]);
  const [loadingSummaryList, setLoadingSummaryList] = useState(false);

  async function loadSummary() {
    setLoadingSummary(true);
    try {
      const [medRes, inpRes, residentsRes, cabinetsRes, drawersRes] =
        await Promise.all([
          getMedicines(1, 1).then((r: { total?: number }) => r.total ?? 0),
          getInputs(1, 1).then((r: { total?: number }) => r.total ?? 0),
          getResidentsCount().then((r: { count?: number }) => r.count ?? 0),
          getCabinetsCount().then((r: { count?: number }) => r.count ?? 0),
          getDrawersCount().then((r: { count?: number }) => r.count ?? 0),
        ]);
      setSummary({
        residents: residentsRes,
        medicines: medRes,
        inputs: inpRes,
        cabinets: cabinetsRes,
        drawers: drawersRes,
      });
    } catch {
      toast({ title: "Erro ao carregar resumo", variant: "error" });
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadSummaryList(kind: SummaryListKind) {
    if (expandedSummary === kind) {
      setExpandedSummary(null);
      return;
    }
    setExpandedSummary(kind);
    setLoadingSummaryList(true);
    setSummaryListData([]);
    try {
      const limit = 500;
      const toList = (
        r: { data?: unknown[]; hasNext?: boolean; total?: number },
        page: number,
      ): { data: Record<string, unknown>[]; hasNext: boolean } => ({
        data: (r.data ?? []) as Record<string, unknown>[],
        hasNext: r.hasNext ?? (r.total != null && page * limit < r.total),
      });
      let list: Record<string, unknown>[];
      if (kind === "residents") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) =>
            getResidents(p, l).then((r) => ({
              data: (r.data ?? []) as Record<string, unknown>[],
              hasNext: r.hasNext ?? false,
            })),
          limit,
        );
      } else if (kind === "medicines") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getMedicines(p, l).then((r) => toList(r, p)),
          limit,
        );
      } else if (kind === "inputs") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getInputs(p, l).then((r) => toList(r, p)),
          limit,
        );
      } else if (kind === "cabinets") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getCabinets(p, l).then((r) => toList(r, p)),
          limit,
        );
      } else {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getDrawers(p, l).then((r) => toList(r, p)),
          limit,
        );
      }
      setSummaryListData(Array.isArray(list) ? list : []);
    } catch {
      toast({ title: "Erro ao carregar lista", variant: "error" });
      setSummaryListData([]);
    } finally {
      setLoadingSummaryList(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadSummary();
  }, [isAdmin]);

  return {
    summary,
    loadingSummary,
    expandedSummary,
    setExpandedSummary,
    summaryListData,
    loadingSummaryList,
    loadSummary,
    loadSummaryList,
  };
}
