import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  getResidents,
  buildAdminExportParams,
  createReportExportJob,
  downloadReportExportBlob,
  getReportExportJob,
} from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { MovementPeriod, MovementsParams } from "@/components/StockReporter";
import { parseYearMonthToDate } from "@/helpers/dates.helper";
import type { ResidentOption } from "../types";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import { compareResidentsByNameThenCasela } from "@/helpers/resident-sort.helper";
import { matchesResidentCaselaSearch } from "@/helpers/resident-casela-autocomplete.helper";

async function waitForReportExportJob(jobId: string): Promise<void> {
  const startedAt = Date.now();
  while (true) {
    const j = (await getReportExportJob(jobId)) as {
      status?: string;
      error?: string | null;
    };
    const s = String(j?.status ?? "");
    if (s === "succeeded") return;
    if (s === "failed") {
      throw new Error(j?.error ?? "Falha ao gerar planilha");
    }
    if (Date.now() - startedAt > 5 * 60_000) {
      throw new Error("Geração demorando demais. Tente novamente.");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

export function useAdminReports(enabled = true) {
  const { uiDisplay } = useTenant();
  const [selectedReportType, setSelectedReportType] = useState("");
  const [reportResidents, setReportResidents] = useState<ResidentOption[]>([]);
  const [selectedReportResident, setSelectedReportResident] = useState<
    number | null
  >(null);
  const [reportMovementPeriod, setReportMovementPeriod] =
    useState<MovementPeriod>(MovementPeriod.DIARIO);
  const [reportMovementDate, setReportMovementDate] = useState<Date | null>(
    null,
  );
  const [reportMovementMonth, setReportMovementMonth] = useState("");
  const [reportStartDate, setReportStartDate] = useState<Date | null>(null);
  const [reportEndDate, setReportEndDate] = useState<Date | null>(null);
  const [reportTransferDate, setReportTransferDate] = useState<Date | null>(
    null,
  );
  const [reportTransferPeriod, setReportTransferPeriod] =
    useState<MovementPeriod>(MovementPeriod.DIARIO);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [reportPreviewLoading, setReportPreviewLoading] = useState(false);
  const [loadingReportResidents, setLoadingReportResidents] = useState(false);
  const [reportResidentSearch, setReportResidentSearch] = useState("");

  const showReportResidentSelector =
    selectedReportType === "residente_consumo" ||
    selectedReportType === "medicamentos_residente";
  const showReportMovementFilters = selectedReportType === "movimentacoes";
  const showReportTransferFilters = selectedReportType === "transferencias";

  const filteredReportResidents = useMemo(
    () =>
      reportResidents
        .filter((r) => matchesResidentCaselaSearch(r, reportResidentSearch))
        .sort(compareResidentsByNameThenCasela),
    [reportResidents, reportResidentSearch],
  );

  async function loadReportResidents() {
    setLoadingReportResidents(true);
    try {
      const list = await fetchAllPaginated<ResidentOption>((p, l) =>
        getResidents(p, l).then((r) => ({
          data: ((r.data ?? []) as Array<Record<string, unknown>>).map((x) => ({
            casela: Number(x.casela),
            name: String(x.name ?? ""),
            cpf: x.cpf != null ? String(x.cpf) : null,
            data_nascimento:
              x.data_nascimento != null ? String(x.data_nascimento) : null,
            idade:
              typeof x.idade === "number" && Number.isFinite(x.idade)
                ? x.idade
                : null,
          })),
          hasNext: r.hasNext ?? false,
        })),
      );
      setReportResidents(list ?? []);
    } catch {
      setReportResidents([]);
    } finally {
      setLoadingReportResidents(false);
    }
  }

  useEffect(() => {
    if (enabled && showReportResidentSelector) void loadReportResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional deps
  }, [enabled, selectedReportType]);

  function buildReportExportJobPayload(): Record<string, string> | null {
    const tipo = selectedReportType;
    if (!tipo) return null;

    if (tipo === "movimentacoes") {
      let movementParams: MovementsParams;
      if (reportMovementPeriod === MovementPeriod.DIARIO) {
        if (!reportMovementDate) {
          toast({ title: "Selecione a data", variant: "error" });
          return null;
        }
        movementParams = {
          periodo: MovementPeriod.DIARIO,
          data: reportMovementDate.toISOString().split("T")[0],
        };
      } else if (reportMovementPeriod === MovementPeriod.MENSAL) {
        if (!reportMovementMonth) {
          toast({ title: "Selecione o mês", variant: "error" });
          return null;
        }
        movementParams = {
          periodo: MovementPeriod.MENSAL,
          mes: reportMovementMonth,
        };
      } else {
        if (!reportStartDate || !reportEndDate) {
          toast({
            title: "Selecione o intervalo de datas",
            variant: "error",
          });
          return null;
        }
        movementParams = {
          periodo: MovementPeriod.INTERVALO,
          data_inicial: reportStartDate.toISOString().split("T")[0],
          data_final: reportEndDate.toISOString().split("T")[0],
        };
      }
      return buildAdminExportParams("movimentacoes", undefined, movementParams);
    }

    if (tipo === "transferencias") {
      let transferParams: MovementsParams;
      if (reportTransferPeriod === MovementPeriod.DIARIO) {
        if (!reportTransferDate) {
          toast({
            title: "Selecione a data da transferência",
            variant: "error",
          });
          return null;
        }
        transferParams = {
          periodo: MovementPeriod.DIARIO,
          data: reportTransferDate.toISOString().split("T")[0],
        };
      } else {
        if (!reportStartDate || !reportEndDate) {
          toast({
            title: "Selecione o intervalo de datas",
            variant: "error",
          });
          return null;
        }
        transferParams = {
          periodo: MovementPeriod.INTERVALO,
          data_inicial: reportStartDate.toISOString().split("T")[0],
          data_final: reportEndDate.toISOString().split("T")[0],
        };
      }
      return buildAdminExportParams(
        "transferencias",
        undefined,
        transferParams,
      );
    }

    const casela =
      tipo === "residente_consumo" || tipo === "medicamentos_residente"
        ? (selectedReportResident ?? undefined)
        : undefined;
    return buildAdminExportParams(tipo, casela);
  }

  async function handleGenerateReport() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    const tipo = selectedReportType;
    const fmt = uiDisplay.defaultReportFormat ?? "pdf";
    setReportStatus("loading");
    try {
      const built = buildReportExportJobPayload();
      if (!built) {
        setReportStatus("idle");
        return;
      }
      const { type, ...jobParams } = built;
      const job = await createReportExportJob(type, {
        ...jobParams,
        format: fmt === "pdf" ? "pdf" : "xlsx",
      });
      await waitForReportExportJob(job.jobId);
      const blob = await downloadReportExportBlob(job.jobId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${tipo}.${fmt === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      URL.revokeObjectURL(url);
      setReportStatus("success");
      toast({
        title: fmt === "pdf" ? "Relatório gerado" : "Planilha gerada",
        variant: "success",
      });
    } catch (e) {
      console.error(e);
      setReportStatus("error");
      toast({ title: "Erro ao gerar relatório", variant: "error" });
    }
  }

  async function handlePreviewReport() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    setReportPreviewLoading(true);
    try {
      const built = buildReportExportJobPayload();
      if (!built) return;
      const { type, ...jobParams } = built;
      const job = await createReportExportJob(type, {
        ...jobParams,
        format: "pdf",
      });
      await waitForReportExportJob(job.jobId);
      const blob = await downloadReportExportBlob(job.jobId);
      const url = URL.createObjectURL(blob);
      if (reportPreviewUrl) URL.revokeObjectURL(reportPreviewUrl);
      setReportPreviewUrl(url);
      toast({ title: "Pré-visualização carregada abaixo", variant: "success" });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao gerar pré-visualização", variant: "error" });
    } finally {
      setReportPreviewLoading(false);
    }
  }

  async function handleExportSpreadsheet() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    const tipo = selectedReportType;
    setReportStatus("loading");
    try {
      const built = buildReportExportJobPayload();
      if (!built) {
        setReportStatus("idle");
        return;
      }
      const { type, ...jobParams } = built;
      const job = await createReportExportJob(type, {
        ...jobParams,
        format: "xlsx",
      });
      await waitForReportExportJob(job.jobId);
      const blob = await downloadReportExportBlob(job.jobId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${tipo}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setReportStatus("success");
      toast({ title: "Planilha exportada", variant: "success" });
    } catch (e: unknown) {
      setReportStatus("error");
      toast({
        title: "Não foi possível exportar a planilha",
        description: getErrorMessage(
          e,
          USER_FACING_RETRY_SHORT,
          "useAdminReports:xlsxExport",
        ),
        variant: "error",
      });
    }
  }

  return {
    selectedReportType,
    setSelectedReportType,
    reportResidents,
    selectedReportResident,
    setSelectedReportResident,
    reportMovementPeriod,
    setReportMovementPeriod,
    reportMovementDate,
    setReportMovementDate,
    reportMovementMonth,
    setReportMovementMonth,
    reportStartDate,
    setReportStartDate,
    reportEndDate,
    setReportEndDate,
    reportTransferDate,
    setReportTransferDate,
    reportTransferPeriod,
    setReportTransferPeriod,
    reportStatus,
    reportPreviewUrl,
    setReportPreviewUrl,
    reportPreviewLoading,
    loadingReportResidents,
    reportResidentSearch,
    setReportResidentSearch,
    showReportResidentSelector,
    showReportMovementFilters,
    showReportTransferFilters,
    filteredReportResidents,
    handleGenerateReport,
    handlePreviewReport,
    handleExportSpreadsheet,
    parseYearMonthToDate,
  };
}
