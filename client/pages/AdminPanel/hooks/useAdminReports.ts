import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  getReport,
  getResidents,
  buildAdminExportParams,
  downloadAdminExportCSV,
} from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import {
  createStockPDF,
  MovementPeriod,
  MovementsParams,
} from "@/components/StockReporter";
import { parseYearMonthToDate } from "@/helpers/dates.helper";
import { pdf } from "@react-pdf/renderer";
import type { ResidentOption } from "../types";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useTenantBrandLogoSrc } from "@/hooks/use-tenant-brand-logo-src.hook";

export function useAdminReports(enabled = true) {
  const { tenant, loading: tenantConfigLoading } = useTenant();
  const { displaySrc: tenantLogoSrc } = useTenantBrandLogoSrc(tenant, {
    tenantConfigLoading,
  });
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
      reportResidents.filter((r) => {
        if (!reportResidentSearch.trim()) return true;
        return r.casela.toString().startsWith(reportResidentSearch.trim());
      }),
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

  async function handleGenerateReport() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    const tipo = selectedReportType;
    setReportStatus("loading");
    try {
      const response = await fetchReportPayload(tipo);
      const doc = createStockPDF(
        tipo,
        response as Parameters<typeof createStockPDF>[1],
        undefined,
        { logoUrl: tenantLogoSrc },
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${tipo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setReportStatus("success");
      toast({ title: "Relatório gerado", variant: "success" });
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
    const tipo = selectedReportType;
    setReportPreviewLoading(true);
    try {
      const response = await fetchReportPayload(tipo);
      const doc = createStockPDF(
        tipo,
        response as Parameters<typeof createStockPDF>[1],
        undefined,
        { logoUrl: tenantLogoSrc },
      );
      const blob = await pdf(doc).toBlob();
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

  async function fetchReportPayload(tipo: string): Promise<unknown> {
    if (tipo === "movimentacoes") {
      let params: MovementsParams;
      if (reportMovementPeriod === MovementPeriod.DIARIO) {
        if (!reportMovementDate) {
          toast({ title: "Selecione a data", variant: "error" });
          throw new Error("Data obrigatória");
        }
        params = {
          periodo: MovementPeriod.DIARIO,
          data: reportMovementDate.toISOString().split("T")[0],
        };
      } else if (reportMovementPeriod === MovementPeriod.MENSAL) {
        if (!reportMovementMonth) {
          toast({ title: "Selecione o mês", variant: "error" });
          throw new Error("Mês obrigatório");
        }
        params = { periodo: MovementPeriod.MENSAL, mes: reportMovementMonth };
      } else {
        if (!reportStartDate || !reportEndDate) {
          toast({ title: "Selecione o intervalo de datas", variant: "error" });
          throw new Error("Intervalo obrigatório");
        }
        params = {
          periodo: MovementPeriod.INTERVALO,
          data_inicial: reportStartDate.toISOString().split("T")[0],
          data_final: reportEndDate.toISOString().split("T")[0],
        };
      }
      return getReport("movimentacoes", undefined, params);
    }
    if (tipo === "transferencias") {
      let params: MovementsParams;
      if (reportTransferPeriod === MovementPeriod.DIARIO) {
        if (!reportTransferDate) {
          toast({
            title: "Selecione a data da transferência",
            variant: "error",
          });
          throw new Error("Data obrigatória");
        }
        params = {
          periodo: MovementPeriod.DIARIO,
          data: reportTransferDate.toISOString().split("T")[0],
        };
      } else {
        if (!reportStartDate || !reportEndDate) {
          toast({ title: "Selecione o intervalo de datas", variant: "error" });
          throw new Error("Intervalo obrigatório");
        }
        params = {
          periodo: MovementPeriod.INTERVALO,
          data_inicial: reportStartDate.toISOString().split("T")[0],
          data_final: reportEndDate.toISOString().split("T")[0],
        };
      }
      return getReport("transferencias", undefined, params);
    }
    const casela =
      tipo === "residente_consumo" || tipo === "medicamentos_residente"
        ? (selectedReportResident ?? undefined)
        : undefined;
    const payload = await getReport(tipo, casela);
    if (casela == null) return payload;
    const r = reportResidents.find((x) => x.casela === casela) ?? null;
    if (!r) return payload;
    if (tipo === "residente_consumo") {
      const base = payload as Record<string, unknown>;
      return {
        ...base,
        cpf: r.cpf ?? null,
        data_nascimento: r.data_nascimento ?? null,
        idade: r.idade ?? null,
      };
    }
    if (tipo === "medicamentos_residente") {
      // Payload é tipicamente uma lista de medicamentos; colocamos meta no 1º item
      // para o PDF mostrar os dados do residente sem depender do backend.
      if (Array.isArray(payload)) {
        if (payload.length === 0) return payload;
        const first = payload[0] as Record<string, unknown>;
        const nextFirst = {
          ...first,
          cpf: r.cpf ?? null,
          data_nascimento: r.data_nascimento ?? null,
          idade: r.idade ?? null,
        };
        return [nextFirst, ...payload.slice(1)];
      }
      const base = payload as Record<string, unknown>;
      return {
        ...base,
        cpf: r.cpf ?? null,
        data_nascimento: r.data_nascimento ?? null,
        idade: r.idade ?? null,
      };
    }
    return payload;
  }

  async function handleExportCSV() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    const tipo = selectedReportType;
    let params: Record<string, string>;
    try {
      if (tipo === "movimentacoes") {
        let movementParams: MovementsParams;
        if (reportMovementPeriod === MovementPeriod.DIARIO) {
          if (!reportMovementDate) {
            toast({ title: "Selecione a data", variant: "error" });
            return;
          }
          movementParams = {
            periodo: MovementPeriod.DIARIO,
            data: reportMovementDate.toISOString().split("T")[0],
          };
        } else if (reportMovementPeriod === MovementPeriod.MENSAL) {
          if (!reportMovementMonth) {
            toast({ title: "Selecione o mês", variant: "error" });
            return;
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
            return;
          }
          movementParams = {
            periodo: MovementPeriod.INTERVALO,
            data_inicial: reportStartDate.toISOString().split("T")[0],
            data_final: reportEndDate.toISOString().split("T")[0],
          };
        }
        params = buildAdminExportParams(
          "movimentacoes",
          undefined,
          movementParams,
        );
      } else if (tipo === "transferencias") {
        let transferParams: MovementsParams;
        if (reportTransferPeriod === MovementPeriod.DIARIO) {
          if (!reportTransferDate) {
            toast({
              title: "Selecione a data da transferência",
              variant: "error",
            });
            return;
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
            return;
          }
          transferParams = {
            periodo: MovementPeriod.INTERVALO,
            data_inicial: reportStartDate.toISOString().split("T")[0],
            data_final: reportEndDate.toISOString().split("T")[0],
          };
        }
        params = buildAdminExportParams(
          "transferencias",
          undefined,
          transferParams,
        );
      } else {
        const casela =
          tipo === "residente_consumo" || tipo === "medicamentos_residente"
            ? (selectedReportResident ?? undefined)
            : undefined;
        params = buildAdminExportParams(tipo, casela);
      }
      await downloadAdminExportCSV(params);
      toast({ title: "Exportação CSV concluída", variant: "success" });
    } catch (e: unknown) {
      toast({
        title: "Não foi possível exportar",
        description: getErrorMessage(
          e,
          USER_FACING_RETRY_SHORT,
          "useAdminReports:csvExport",
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
    handleExportCSV,
    parseYearMonthToDate,
  };
}
