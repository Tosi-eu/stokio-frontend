import { getStock } from "@/api/requests";
import { StockItem, StockItemRaw } from "@/interfaces/interfaces";
import { ItemStockType, StockTypeLabels } from "@/utils/enums";

export interface StockListFilters {
  nome?: string;
  casela?: string;
  armario?: string;
  setor?: string;
  lote?: string;
}

export interface StockFilterOption {
  value: string;
  label: string;
}

export interface StockFilterOptions {
  sectors: StockFilterOption[];
  cabinets: StockFilterOption[];
  caselas: StockFilterOption[];
  lots: StockFilterOption[];
}

export async function fetchStockPage(
  page: number,
  limit: number,
  filters: StockListFilters,
  urlFilter?: string | null,
): Promise<{ data: unknown[]; hasNext: boolean }> {
  const filterParams: Record<string, string> = {};
  if (filters.nome?.trim()) filterParams.name = filters.nome.trim();
  if (filters.casela?.trim()) filterParams.casela = filters.casela.trim();
  if (filters.armario?.trim()) filterParams.cabinet = filters.armario.trim();
  if (filters.setor?.trim()) filterParams.sector = filters.setor.trim();
  if (filters.lote?.trim()) filterParams.lot = filters.lote.trim();

  const res = await getStock(page, limit, filterParams, urlFilter ?? undefined);
  return {
    data: Array.isArray(res?.data) ? res.data : [],
    hasNext: Boolean(res?.hasNext),
  };
}

export interface StockListItemRaw extends Partial<StockItemRaw> {
  tipo_item?: string;
  dosagem?: string;
  unidade_medida?: string;
  item_id?: number;
  destino?: string | null;
  observacao?: string | null;
  dias_para_repor?: number | null;
}

export function formatStockItems(raw: unknown[]): StockItem[] {
  return (raw || []).map((item: StockListItemRaw) => {
    const isMedicamento = item.tipo_item === "medicamento";
    const name = isMedicamento
      ? `${item.nome || ""} ${item.dosagem || ""}${item.unidade_medida || ""}`.trim()
      : (item.nome || "").trim();

    return {
      id: item.estoque_id,
      name: name || "-",
      activeSubstance: item.principio_ativo || "-",
      description: item.descricao || "-",
      expiry: item.validade || "-",
      quantity: Number(item.quantidade) || 0,
      cabinet: item.armario_id ?? "-",
      drawer: item.gaveta_id ?? "-",
      casela: item.casela_id ?? null,
      stockType: StockTypeLabels[item.tipo as ItemStockType] ?? item.tipo,
      tipo: item.tipo,
      patient: item.paciente || "-",
      origin: item.origem || "-",
      minimumStock: item.minimo || 0,
      expirationMsg: item.msg_expiracao,
      quantityMsg: item.msg_quantidade,
      expirationStatus: item.st_expiracao,
      quantityStatus: item.st_quantidade,
      status: item.status ?? null,
      destination: item.destino ?? null,
      suspended_at: item.suspenso_em ? new Date(item.suspenso_em) : null,
      detail: item.observacao ?? null,
      daysToReplacement: item.dias_para_repor ?? null,
      medicamentoId:
        item.tipo_item === "medicamento" ? (item.item_id ?? null) : null,
      itemType: item.tipo_item,
      sector: item.setor,
      lot: item.lote ?? null,
    } as StockItem;
  });
}

export interface BuildFilterOptionsParams {
  residents?: Array<{ casela: number; name: string }>;
  setor?: string;
}

export function buildFilterOptions(
  allRawData: unknown[],
  options?: BuildFilterOptionsParams,
): StockFilterOptions {
  const raw = Array.isArray(allRawData) ? allRawData : [];

  const sectors: StockFilterOption[] = [
    { value: "enfermagem", label: "Enfermagem" },
    { value: "farmacia", label: "Farmácia" },
  ];

  const cabinetIds = Array.from(
    new Set(
      raw
        .map((i: Record<string, unknown>) => i.armario_id as number | undefined)
        .filter((id): id is number => id != null),
    ),
  )
    .sort((a, b) => a - b)
    .map((id) => ({ value: String(id), label: `Armário ${id}` }));

  const isEnfermagem =
    options?.setor === "enfermagem" && (options?.residents?.length ?? 0) > 0;
  const caselaIds: StockFilterOption[] = isEnfermagem
    ? [...options!.residents!]
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((r) => ({ value: String(r.casela), label: r.name }))
    : Array.from(
        new Set(
          raw
            .map(
              (i: Record<string, unknown>) => i.casela_id as number | undefined,
            )
            .filter((id): id is number => id != null),
        ),
      )
        .sort((a, b) => a - b)
        .map((id) => ({ value: String(id), label: `Casela ${id}` }));

  const lotes = Array.from(
    new Set(
      raw
        .map((i: Record<string, unknown>) => i.lote as string | undefined)
        .filter((l): l is string => typeof l === "string" && l.trim() !== ""),
    ),
  )
    .sort((a, b) => a.localeCompare(b))
    .map((lote) => ({ value: lote, label: lote }));

  return {
    sectors,
    cabinets: cabinetIds,
    caselas: caselaIds,
    lots: lotes,
  };
}

export interface ApiFilterOptions {
  cabinets: number[];
  caselas: number[];
  lots: string[];
}

export function buildFilterOptionsFromApi(
  apiOptions: ApiFilterOptions | null,
  options?: BuildFilterOptionsParams,
): StockFilterOptions {
  const sectors: StockFilterOption[] = [
    { value: "enfermagem", label: "Enfermagem" },
    { value: "farmacia", label: "Farmácia" },
  ];

  const cabinets: StockFilterOption[] = (apiOptions?.cabinets ?? [])
    .sort((a, b) => a - b)
    .map((id) => ({ value: String(id), label: `Armário ${id}` }));

  const isEnfermagem =
    options?.setor === "enfermagem" && (options?.residents?.length ?? 0) > 0;
  const caselas: StockFilterOption[] = isEnfermagem
    ? [...options!.residents!]
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
        .map((r) => ({ value: String(r.casela), label: r.name }))
    : (apiOptions?.caselas ?? [])
        .sort((a, b) => a - b)
        .map((id) => ({ value: String(id), label: `Casela ${id}` }));

  const lots: StockFilterOption[] = (apiOptions?.lots ?? [])
    .sort((a, b) => a.localeCompare(b))
    .map((lote) => ({ value: lote, label: lote }));

  return {
    sectors,
    cabinets,
    caselas,
    lots,
  };
}
