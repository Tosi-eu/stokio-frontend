import { getStock } from "@/api/requests";
import { StockItem, StockItemRaw } from "@/interfaces/interfaces";
import { ItemStockType, StockTypeLabels } from "@/utils/enums";
import {
  armarioFilterLabel,
  caselaModeForContext,
  type UiDisplayCasela,
  type UiDisplayCaselaSetor,
} from "@/helpers/ui-display.helper";
import {
  compareResidentsByCaselaThenName,
  compareResidentsByNameThenCasela,
} from "@/helpers/resident-sort.helper";
import { formatResidentCaselaAutocompleteLabel } from "@/helpers/resident-casela-autocomplete.helper";
import { formatValidityDate } from "@/helpers/dates.helper";

export interface StockListFilters {
  nome?: string;
  casela?: string;
  armario?: string;
  gaveta?: string;
  setor?: string;
  lote?: string;

  itemType?: "medicamento" | "insumo";
  onlyInStock?: boolean;
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
): Promise<{ data: unknown[]; hasNext: boolean; total: number }> {
  const filterParams: Record<string, string> = {};
  if (filters.nome?.trim()) filterParams.name = filters.nome.trim();
  if (filters.casela?.trim()) filterParams.casela = filters.casela.trim();
  if (filters.armario?.trim()) filterParams.cabinet = filters.armario.trim();
  if (filters.gaveta?.trim()) filterParams.drawer = filters.gaveta.trim();
  if (filters.setor?.trim()) filterParams.sector = filters.setor.trim();
  if (filters.lote?.trim()) filterParams.lot = filters.lote.trim();
  if (filters.itemType) filterParams.itemType = filters.itemType;
  if (filters.onlyInStock) filterParams.onlyInStock = "true";

  const res = await getStock(page, limit, filterParams, urlFilter ?? undefined);
  return {
    data: Array.isArray(res?.data) ? res.data : [],
    hasNext: Boolean(res?.hasNext),
    total: Number(res?.total ?? 0),
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
      expiry: formatValidityDate(item.validade ?? ""),
      entryDate: item.data_entrada ?? null,
      exitDate: item.data_saida ?? null,
      quantity: Number(item.quantidade) || 0,
      cabinet: item.armario_id ?? "-",
      drawer: item.gaveta_id ?? "-",
      casela: item.casela_id ?? null,
      stockType: StockTypeLabels[item.tipo as ItemStockType] ?? item.tipo,
      tipo: item.tipo,
      patient: item.paciente || "-",
      origin: item.origem || "-",
      minimumStock: item.minimo || 0,
      expirationMsg: item.msg_expiracao ?? "",
      quantityMsg: item.msg_quantidade ?? "",
      expirationStatus: item.st_expiracao ?? "",
      quantityStatus: item.st_quantidade ?? "",
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
  setorProfile?: "farmacia" | "enfermagem";
  sectorFilterOptions?: StockFilterOption[];
  displayCasela?: UiDisplayCasela;
  caselaSetor?: UiDisplayCaselaSetor;
  armarioMode?: "numero" | "categoria";
  cabinets?: Array<{ numero: number; categoria: string }>;
}

const DEFAULT_SECTOR_FILTER_OPTIONS: StockFilterOption[] = [
  { value: "enfermagem", label: "Enfermagem" },
  { value: "farmacia", label: "Farmácia" },
];

function resolveSectorFilterParts(options?: BuildFilterOptionsParams): {
  sectors: StockFilterOption[];
  isEnfermagem: boolean;
  sectorForFarmaciaList: string;
} {
  const sectors =
    (options?.sectorFilterOptions?.length ?? false)
      ? options.sectorFilterOptions!
      : DEFAULT_SECTOR_FILTER_OPTIONS;

  const profile =
    options?.setorProfile ??
    (options?.setor === "enfermagem" ? "enfermagem" : "farmacia");

  const isEnfermagem =
    profile === "enfermagem" && (options?.residents?.length ?? 0) > 0;

  const sectorForFarmaciaList =
    profile === "enfermagem" ? "" : (options?.setor ?? "");

  return { sectors, isEnfermagem, sectorForFarmaciaList };
}

function caselaUiPick(options?: BuildFilterOptionsParams): {
  casela: UiDisplayCasela;
  caselaSetor: UiDisplayCaselaSetor;
} {
  return {
    casela: options?.displayCasela ?? "numero",
    caselaSetor: options?.caselaSetor ?? "todos",
  };
}

export function buildFilterOptions(
  allRawData: unknown[],
  options?: BuildFilterOptionsParams,
): StockFilterOptions {
  const raw = Array.isArray(allRawData) ? allRawData : [];

  const { sectors, isEnfermagem, sectorForFarmaciaList } =
    resolveSectorFilterParts(options);

  const cabByNum = new Map(
    (options?.cabinets ?? []).map((c) => [c.numero, c.categoria]),
  );
  const armMode = options?.armarioMode ?? "numero";
  const cabinetIds = Array.from(
    new Set(
      raw
        .map((i: Record<string, unknown>) => i.armario_id as number | undefined)
        .filter((id): id is number => id != null),
    ),
  )
    .sort((a, b) => b - a)
    .map((id) => ({
      value: String(id),
      label: armarioFilterLabel(id, cabByNum.get(id) ?? null, armMode),
    }));

  const uiCasela = caselaUiPick(options);
  const effEnf = caselaModeForContext(
    uiCasela.casela,
    uiCasela.caselaSetor,
    "enfermagem",
  );
  const effFarm = caselaModeForContext(
    uiCasela.casela,
    uiCasela.caselaSetor,
    sectorForFarmaciaList,
  );

  const caselaIds: StockFilterOption[] = isEnfermagem
    ? [...options!.residents!]
        .sort((a, b) =>
          effEnf === "nome"
            ? compareResidentsByNameThenCasela(a, b)
            : compareResidentsByCaselaThenName(a, b),
        )
        .map((r) => ({
          value: String(r.casela),
          label: formatResidentCaselaAutocompleteLabel(r),
        }))
    : Array.from(
        new Set(
          raw
            .map(
              (i: Record<string, unknown>) => i.casela_id as number | undefined,
            )
            .filter((id): id is number => id != null),
        ),
      )
        .sort((a, b) => {
          if (effFarm === "nome" && (options?.residents?.length ?? 0) > 0) {
            const ra = options!.residents!.find((r) => r.casela === a);
            const rb = options!.residents!.find((r) => r.casela === b);
            return compareResidentsByNameThenCasela(
              { name: ra?.name ?? "", casela: a },
              { name: rb?.name ?? "", casela: b },
            );
          }
          return a - b;
        })
        .map((id) => {
          const r = options?.residents?.find((x) => x.casela === id);
          const nm = r?.name?.trim();
          return {
            value: String(id),
            label: nm
              ? formatResidentCaselaAutocompleteLabel({ name: nm, casela: id })
              : `Casela ${id}`,
          };
        });

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
  const { sectors, isEnfermagem, sectorForFarmaciaList } =
    resolveSectorFilterParts(options);

  const cabByNum = new Map(
    (options?.cabinets ?? []).map((c) => [c.numero, c.categoria]),
  );
  const armMode = options?.armarioMode ?? "numero";
  const cabinets: StockFilterOption[] = (apiOptions?.cabinets ?? [])
    .sort((a, b) => b - a)
    .map((id) => ({
      value: String(id),
      label: armarioFilterLabel(id, cabByNum.get(id) ?? null, armMode),
    }));

  const uiCasela = caselaUiPick(options);
  const effEnf = caselaModeForContext(
    uiCasela.casela,
    uiCasela.caselaSetor,
    "enfermagem",
  );
  const effFarm = caselaModeForContext(
    uiCasela.casela,
    uiCasela.caselaSetor,
    sectorForFarmaciaList,
  );

  const caselas: StockFilterOption[] = isEnfermagem
    ? [...options!.residents!]
        .sort((a, b) =>
          effEnf === "nome"
            ? compareResidentsByNameThenCasela(a, b)
            : compareResidentsByCaselaThenName(a, b),
        )
        .map((r) => ({
          value: String(r.casela),
          label: formatResidentCaselaAutocompleteLabel(r),
        }))
    : (apiOptions?.caselas ?? [])
        .sort((a, b) => {
          if (effFarm === "nome" && (options?.residents?.length ?? 0) > 0) {
            const ra = options!.residents!.find((r) => r.casela === a);
            const rb = options!.residents!.find((r) => r.casela === b);
            return compareResidentsByNameThenCasela(
              { name: ra?.name ?? "", casela: a },
              { name: rb?.name ?? "", casela: b },
            );
          }
          return a - b;
        })
        .map((id) => {
          const r = options?.residents?.find((x) => x.casela === id);
          const nm = r?.name?.trim();
          return {
            value: String(id),
            label: nm
              ? formatResidentCaselaAutocompleteLabel({ name: nm, casela: id })
              : `Casela ${id}`,
          };
        });

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
