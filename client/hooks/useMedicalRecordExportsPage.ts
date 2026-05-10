"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast.hook";
import {
  type MedicalRecordExportAvailableRow,
  type MedicalRecordExportJobRow,
  createReportExportJob,
  fetchAdminMedicalRecordExportAvailable,
  fetchAdminMedicalRecordExportJobs,
  downloadReportExportBlob,
  waitForReportExportJob,
} from "@/api/requests";
import { MEDICAL_RECORD_EXPORT_PAGE_SIZE } from "@/components/medical-record-exports/medical-record-exports.constants";
import type { ExportFormat } from "@/components/medical-record-exports/medical-record-exports.shared";

export function useMedicalRecordExportsPage() {
  const { toast } = useToast();
  const pageSize = MEDICAL_RECORD_EXPORT_PAGE_SIZE;

  const [available, setAvailable] = useState<MedicalRecordExportAvailableRow[]>(
    [],
  );
  const [availableLoading, setAvailableLoading] = useState(true);

  const [rows, setRows] = useState<MedicalRecordExportJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [caselaFilter, setCaselaFilter] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [truncated, setTruncated] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [versionsModalRow, setVersionsModalRow] =
    useState<MedicalRecordExportAvailableRow | null>(null);
  const [busyCasela, setBusyCasela] = useState<string | null>(null);
  const [residentNameQuery, setResidentNameQuery] = useState("");
  const [versionFilterFrom, setVersionFilterFrom] = useState("");
  const [versionFilterTo, setVersionFilterTo] = useState("");

  const filteredAvailable = useMemo(() => {
    const q = residentNameQuery.trim().toLowerCase();
    if (!q) return available;
    return available.filter((r) => r.residentName.toLowerCase().includes(q));
  }, [available, residentNameQuery]);

  const filteredAvailableCount = filteredAvailable.length;
  const availableTotalPages = Math.max(
    1,
    Math.ceil(filteredAvailableCount / pageSize) || 1,
  );
  const availableFrom =
    filteredAvailableCount === 0 ? 0 : (availablePage - 1) * pageSize + 1;
  const availableTo = Math.min(
    availablePage * pageSize,
    filteredAvailableCount,
  );

  const paginatedAvailable = useMemo(() => {
    const start = (availablePage - 1) * pageSize;
    return filteredAvailable.slice(start, start + pageSize);
  }, [filteredAvailable, availablePage, pageSize]);

  const historyCaselaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of available) {
      const c = String(r.casela ?? "").trim();
      if (!c) continue;
      if (!map.has(c)) {
        map.set(c, `Casela ${c} — ${r.residentName}`);
      }
    }
    for (const row of rows) {
      const c = String(row.casela ?? "").trim();
      if (!c || map.has(c)) continue;
      map.set(c, `Casela ${c}`);
    }
    if (caselaFilter.trim() && !map.has(caselaFilter.trim())) {
      map.set(caselaFilter.trim(), `Casela ${caselaFilter.trim()}`);
    }
    return Array.from(map.entries())
      .map(([casela, label]) => ({ casela, label }))
      .sort((a, b) => {
        const na = Number(a.casela);
        const nb = Number(b.casela);
        if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
          return na - nb;
        }
        return a.casela.localeCompare(b.casela, undefined, { numeric: true });
      });
  }, [available, caselaFilter, rows]);

  useEffect(() => {
    setAvailablePage(1);
  }, [residentNameQuery]);

  useEffect(() => {
    setAvailablePage((p) => Math.min(p, availableTotalPages));
  }, [availableTotalPages]);

  const loadAvailable = useCallback(async () => {
    setAvailableLoading(true);
    try {
      const res = await fetchAdminMedicalRecordExportAvailable();
      setAvailable(res.data);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os prontuários disponíveis.";
      toast({
        title: "Erro",
        description: msg,
        variant: "error",
        duration: 5000,
      });
      setAvailable([]);
    } finally {
      setAvailableLoading(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetchAdminMedicalRecordExportJobs({
        page: historyPage,
        limit: pageSize,
        casela: caselaFilter.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.total);
      setTruncated(Boolean(res.truncated));
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Não foi possível carregar o histórico de exportações.";
      toast({
        title: "Erro",
        description: msg,
        variant: "error",
        duration: 5000,
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, pageSize, caselaFilter, toast]);

  useEffect(() => {
    void loadAvailable();
  }, [loadAvailable]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const historyTotalPages = Math.max(1, Math.ceil(total / pageSize));
  const historyFrom = total === 0 ? 0 : (historyPage - 1) * pageSize + 1;
  const historyTo = Math.min(historyPage * pageSize, total);

  const modalVersionsFiltered = useMemo(() => {
    const list = versionsModalRow?.versions ?? [];
    const fromD = versionFilterFrom.trim();
    const toD = versionFilterTo.trim();
    if (!fromD && !toD) return list;
    return list.filter((v) => {
      const day = v.generatedAt.slice(0, 10);
      if (fromD && day < fromD) return false;
      if (toD && day > toD) return false;
      return true;
    });
  }, [versionsModalRow?.versions, versionFilterFrom, versionFilterTo]);

  const handleDownloadByJobId = useCallback(
    async (
      jobId: string,
      casela: string,
      generatedAt: string | null | undefined,
      formatRaw: string | null | undefined,
    ) => {
      setDownloadingId(jobId);
      try {
        const lower = (formatRaw ?? "").trim().toLowerCase();
        const ext = lower === "xlsx" ? "xlsx" : lower === "csv" ? "csv" : "pdf";
        const safeCasela = casela.replace(/[^\w.-]+/g, "_") || "residente";
        const dateStamp =
          generatedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
        const blob = await downloadReportExportBlob(jobId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prontuario-${safeCasela}-${dateStamp}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        void loadAvailable();
        void loadHistory();
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Falha ao descarregar o ficheiro.";
        toast({
          title: "Descarregar",
          description: msg,
          variant: "error",
          duration: 5000,
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [loadAvailable, loadHistory, toast],
  );

  const handleSmartDownload = useCallback(
    async (row: MedicalRecordExportAvailableRow, format: ExportFormat) => {
      const want = format;
      const lastFmt = (row.format ?? "").trim().toLowerCase();
      setBusyCasela(row.casela);
      try {
        if (row.jobId && lastFmt === want) {
          await handleDownloadByJobId(
            row.jobId,
            row.casela,
            row.generatedAt,
            row.format,
          );
          return;
        }
        const res = await createReportExportJob("prontuario_residente", {
          casela: row.casela,
          format: want,
        });
        await waitForReportExportJob(res.jobId);
        await handleDownloadByJobId(
          res.jobId,
          row.casela,
          new Date().toISOString(),
          want,
        );
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : "Não foi possível descarregar o prontuário.";
        toast({
          title: "Erro",
          description: msg,
          variant: "error",
          duration: 6000,
        });
      } finally {
        setBusyCasela(null);
      }
    },
    [handleDownloadByJobId, toast],
  );

  const handleForceGenerate = useCallback(
    async (row: MedicalRecordExportAvailableRow, format: ExportFormat) => {
      setBusyCasela(row.casela);
      try {
        const res = await createReportExportJob("prontuario_residente", {
          casela: row.casela,
          format,
        });
        await waitForReportExportJob(res.jobId);
        await handleDownloadByJobId(
          res.jobId,
          row.casela,
          new Date().toISOString(),
          format,
        );
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Não foi possível gerar o ficheiro.";
        toast({
          title: "Erro ao gerar",
          description: msg,
          variant: "error",
          duration: 6000,
        });
      } finally {
        setBusyCasela(null);
      }
    },
    [handleDownloadByJobId, toast],
  );

  const handleDownloadHistoryRow = useCallback(
    async (row: MedicalRecordExportJobRow) => {
      if (row.status !== "succeeded") return;
      await handleDownloadByJobId(
        row.id,
        row.casela || "residente",
        row.finishedAt ?? row.createdAt,
        row.format,
      );
    },
    [handleDownloadByJobId],
  );

  const setCaselaFilterAndResetPage = useCallback((v: string) => {
    setCaselaFilter(v === "__all" ? "" : v);
    setHistoryPage(1);
  }, []);

  return {
    pageSize,
    loadAvailable,
    availableLoading,
    availableLength: available.length,
    filteredAvailable,
    filteredAvailableCount,
    paginatedAvailable,
    availablePage,
    setAvailablePage,
    availableTotalPages,
    availableFrom,
    availableTo,
    residentNameQuery,
    setResidentNameQuery,
    busyCasela,
    versionsModalRow,
    setVersionsModalRow,
    versionFilterFrom,
    setVersionFilterFrom,
    versionFilterTo,
    setVersionFilterTo,
    modalVersionsFiltered,
    handleSmartDownload,
    handleForceGenerate,
    downloadingId,
    handleDownloadByJobId,
    historyLoading,
    rows,
    total,
    historyPage,
    setHistoryPage,
    historyTotalPages,
    historyFrom,
    historyTo,
    caselaFilter,
    setCaselaFilterAndResetPage,
    historyCaselaOptions,
    truncated,
    handleDownloadHistoryRow,
  };
}
