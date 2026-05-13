import type { ResidentIssuedMedicalRecord } from "@/api/requests";
import type { StockItem } from "@/interfaces/interfaces";
import { OperationType } from "@/utils/enums";
import { formatProntuarioPeriodoLabel } from "@/components/residents/prontuario.constants";

export function residentStockItemKindLabel(item: StockItem): string {
  return item.itemType === OperationType.MEDICINE ? "Medicamento" : "Insumo";
}

export function prontuarioAtivoToChartRows(
  items: ResidentIssuedMedicalRecord[],
): Record<string, unknown>[] {
  return items.map((i) => ({
    kind: i.categoria === "medicamento" ? "Medicamento" : "Insumo",
    name: i.nome,
    detalhe: i.detalhe?.trim() ? i.detalhe : "—",
    observacao: i.observacao?.trim() ? i.observacao : "—",
    frequencia:
      i.frequencia_aplicacao != null ? String(i.frequencia_aplicacao) : "—",
    periodo: formatProntuarioPeriodoLabel(i.periodo_aplicacao),
  }));
}

/** @deprecated Prefer {@link prontuarioAtivoToChartRows} para o bloco Prontuário. */
export function stockToResidentChartRows(
  items: StockItem[],
): Record<string, unknown>[] {
  return items.map((i) => ({
    kind: residentStockItemKindLabel(i),
    name: i.name,
    detalhe: (() => {
      const pa = i.activeSubstance?.trim();
      if (pa && pa !== "-") return pa;
      const desc = i.description?.trim();
      if (desc && desc !== "-") return desc;
      return "—";
    })(),
    quantity: i.quantity,
    expiry: i.expiry,
    entryDate: i.entryDate?.trim() ? i.entryDate : "—",
    exitDate: i.exitDate?.trim() ? i.exitDate : "—",
    cabinet: i.cabinet ?? "—",
    drawer: i.drawer ?? "—",
    sector: i.sector ?? "—",
    lot: i.lot ?? "—",
  }));
}

export function residentInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
