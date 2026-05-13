import type { DashboardSummaryResponse } from "@/api/types";
import type { ResidentIssuedMedicalRecord } from "@/api/requests";
import type {
  StockItem,
  StockProportionResponse,
} from "@/interfaces/interfaces";
import { ItemStockType, OperationType, SectorType } from "@/utils/enums";
import { formatDateToPtBr } from "@/helpers/dates.helper";

export const PREVIEW_CABINETS = [
  { numero: 1, categoria: "Psicotrópicos" },
  { numero: 2, categoria: "Geral" },
  { numero: 3, categoria: "Refrigerados" },
  { numero: 4, categoria: "Emergência" },
  { numero: 5, categoria: "Almoxarifado" },
];

export const PREVIEW_DRAWERS = [
  { numero: 10, categoria: "Bloco A" },
  { numero: 11, categoria: "Bloco A" },
  { numero: 12, categoria: "Bloco A" },
  { numero: 20, categoria: "Bloco B" },
  { numero: 21, categoria: "Bloco B" },
  { numero: 30, categoria: "Central" },
];

export const PREVIEW_RESIDENTS = [
  {
    name: "Ana Costa",
    casela: 103,
    data_nascimento: null,
    idade: null,
  },
  {
    name: "Carlos Mendes",
    casela: 104,
    data_nascimento: "1960-07-20",
    idade: 65,
  },
  {
    name: "João Santos",
    casela: 102,
    data_nascimento: "1955-11-02",
    idade: 70,
  },
  {
    name: "Maria Silva",
    casela: 101,
    data_nascimento: "1948-03-12",
    idade: 78,
  },
  {
    name: "Pedro Alves",
    casela: 106,
    data_nascimento: null,
    idade: null,
  },
  {
    name: "Rosa Ferreira",
    casela: 105,
    data_nascimento: "1952-01-30",
    idade: 74,
  },
];

function stockProportionFromTotals(
  totais: StockProportionResponse["totais"],
): StockProportionResponse {
  const total = totais.total_geral;
  const pct = (n: number) =>
    total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
  return {
    totais,
    percentuais: {
      medicamentos_geral: pct(totais.medicamentos_geral),
      medicamentos_individual: pct(totais.medicamentos_individual),
      insumos_geral: pct(totais.insumos_geral),
      insumos_individual: pct(totais.insumos_individual),
      carrinho_emergencia_medicamentos: pct(
        totais.carrinho_emergencia_medicamentos,
      ),
      carrinho_psicotropicos_medicamentos: pct(
        totais.carrinho_psicotropicos_medicamentos,
      ),
      carrinho_emergencia_insumos: pct(totais.carrinho_emergencia_insumos),
      carrinho_psicotropicos_insumos: pct(
        totais.carrinho_psicotropicos_insumos,
      ),
    },
  };
}

function baseStock(
  id: number,
  partial: Partial<StockItem> & Pick<StockItem, "name" | "cabinet" | "drawer">,
): StockItem {
  return {
    id,
    name: partial.name,
    activeSubstance: partial.activeSubstance ?? "—",
    description: partial.description ?? "—",
    expiry: partial.expiry ?? "2026-12-31",
    quantity: partial.quantity ?? 12,
    minimumStock: partial.minimumStock ?? 5,
    patient: partial.patient ?? "—",
    cabinet: partial.cabinet,
    drawer: partial.drawer,
    casela: partial.casela ?? null,
    itemType: partial.itemType ?? OperationType.MEDICINE,
    stockType: partial.stockType ?? ItemStockType.GERAL,
    tipo: partial.tipo,
    status: partial.status ?? "active",
    sector: partial.sector ?? SectorType.FARMACIA,
    suspended_at: null,
    origin: partial.origin ?? "Compra/Doação",
    lot: partial.lot ?? "LT-DEMO",
    expirationStatus: partial.expirationStatus ?? "healthy",
    quantityStatus: partial.quantityStatus ?? "high",
    expirationMsg: partial.expirationMsg ?? "",
    quantityMsg: partial.quantityMsg ?? "",
    destino: partial.destino ?? null,
    detail: partial.detail ?? null,
    daysToReplacement: partial.daysToReplacement ?? 14,
    medicamentoId: partial.medicamentoId ?? id,
    destination: partial.destino ?? null,
  } as StockItem;
}

export function getPreviewStockItems(): StockItem[] {
  return [
    baseStock(9001, {
      name: "Paracetamol 500mg",
      activeSubstance: "Paracetamol",
      cabinet: 1,
      drawer: 10,
      casela: 101,
      quantity: 24,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.FARMACIA,
      expirationStatus: "healthy",
      quantityStatus: "high",
    }),
    baseStock(9002, {
      name: "Losartana 50mg",
      activeSubstance: "Losartana potássica",
      cabinet: 1,
      drawer: 10,
      casela: null,
      quantity: 8,
      stockType: ItemStockType.GERAL,
    }),
    baseStock(9003, {
      name: "Soro fisiológico 0,9%",
      activeSubstance: "Cloreto de sódio",
      cabinet: 2,
      drawer: 11,
      casela: 102,
      quantity: 40,
      itemType: OperationType.INPUT,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.ENFERMAGEM,
    }),
    baseStock(9004, {
      name: "Insulina NPH",
      activeSubstance: "Insulina",
      cabinet: 3,
      drawer: 20,
      casela: 103,
      quantity: 6,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.FARMACIA,
    }),
    baseStock(9005, {
      name: "Omeprazol 20mg",
      activeSubstance: "Omeprazol",
      cabinet: 2,
      drawer: 11,
      casela: 101,
      quantity: 14,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.FARMACIA,
    }),
    baseStock(9006, {
      name: "Luvas descartáveis (cx)",
      activeSubstance: "Látex",
      cabinet: 2,
      drawer: 12,
      casela: 101,
      quantity: 3,
      itemType: OperationType.INPUT,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.ENFERMAGEM,
      expirationStatus: "warning",
      quantityStatus: "low",
    }),
    baseStock(9007, {
      name: "Metformina 850mg",
      activeSubstance: "Metformina",
      cabinet: 1,
      drawer: 10,
      casela: 102,
      quantity: 20,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.FARMACIA,
    }),
    baseStock(9008, {
      name: "Água oxigenada 10 vol",
      activeSubstance: "Peróxido de hidrogênio",
      cabinet: 4,
      drawer: 30,
      casela: 102,
      quantity: 8,
      itemType: OperationType.INPUT,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.ENFERMAGEM,
    }),
    baseStock(9009, {
      name: "Diazepam 5mg",
      activeSubstance: "Diazepam",
      cabinet: 1,
      drawer: 10,
      casela: 103,
      quantity: 10,
      stockType: ItemStockType.INDIVIDUAL,
      sector: SectorType.FARMACIA,
    }),
    baseStock(9010, {
      name: "Seringas 5ml",
      activeSubstance: "—",
      cabinet: 5,
      drawer: 21,
      casela: null,
      quantity: 120,
      itemType: OperationType.INPUT,
      stockType: ItemStockType.GERAL,
      sector: SectorType.ENFERMAGEM,
    }),
  ];
}

export function filterPreviewStockByCabinet(cabinetNum: number): StockItem[] {
  return getPreviewStockItems().filter(
    (s) => String(s.cabinet) === String(cabinetNum),
  );
}

export function filterPreviewStockByDrawer(drawerNum: number): StockItem[] {
  return getPreviewStockItems().filter(
    (s) => String(s.drawer) === String(drawerNum),
  );
}

export function filterPreviewStockByCasela(casela: number): StockItem[] {
  return getPreviewStockItems().filter(
    (s) => s.casela != null && Number(s.casela) === Number(casela),
  );
}

/** Agrega linhas de preview por nome+categoria (simula itens em uso na casela). */
export function getPreviewProntuarioAtivoForCasela(
  casela: number,
): ResidentIssuedMedicalRecord[] {
  type Agg = {
    categoria: "medicamento" | "insumo";
    nome: string;
    detalhe: string;
    observacoes: Set<string>;
  };

  const byKey = new Map<string, Agg>();

  for (const i of filterPreviewStockByCasela(casela)) {
    if (String(i.status ?? "").toLowerCase() !== "active") continue;
    const q = Number(i.quantity);
    if (!Number.isFinite(q) || q <= 0) continue;

    const categoria: "medicamento" | "insumo" =
      i.itemType === OperationType.MEDICINE ? "medicamento" : "insumo";
    const nome = String(i.name ?? "").trim() || "—";
    const key = `${categoria}:${nome.toLowerCase()}`;

    const detalhe =
      categoria === "medicamento"
        ? String(i.activeSubstance ?? "")
            .trim()
            .replace(/^—$/, "")
        : String(i.description ?? "")
            .trim()
            .replace(/^—$/, "");

    const obs = String(i.detail ?? "")
      .trim()
      .replace(/^—$/, "");

    const cur = byKey.get(key);
    if (!cur) {
      byKey.set(key, {
        categoria,
        nome,
        detalhe,
        observacoes: new Set(obs ? [obs] : []),
      });
    } else {
      if (obs) cur.observacoes.add(obs);
    }
  }

  const rows: ResidentIssuedMedicalRecord[] = [];
  for (const a of byKey.values()) {
    const obsJoined =
      [...a.observacoes].filter(Boolean).sort().join("; ") || null;

    rows.push({
      categoria: a.categoria,
      nome: a.nome,
      detalhe: a.detalhe,
      observacao: obsJoined,
    });
  }

  return rows.sort((x, y) =>
    x.nome.localeCompare(y.nome, "pt", { sensitivity: "base" }),
  );
}

export function getPreviewDashboardSummary(): DashboardSummaryResponse {
  const pharmacyTotals: StockProportionResponse["totais"] = {
    medicamentos_geral: 220,
    medicamentos_individual: 140,
    insumos_geral: 95,
    insumos_individual: 55,
    carrinho_emergencia_medicamentos: 0,
    carrinho_psicotropicos_medicamentos: 0,
    carrinho_emergencia_insumos: 0,
    carrinho_psicotropicos_insumos: 0,
    total_geral: 510,
  };
  const nursingTotals: StockProportionResponse["totais"] = {
    medicamentos_geral: 48,
    medicamentos_individual: 62,
    insumos_geral: 55,
    insumos_individual: 38,
    carrinho_emergencia_medicamentos: 14,
    carrinho_psicotropicos_medicamentos: 11,
    carrinho_emergencia_insumos: 18,
    carrinho_psicotropicos_insumos: 9,
    total_geral: 255,
  };

  return {
    alerts: {
      belowMin: 2,
      nearMin: 3,
      expired: 0,
      expiringSoon: 1,
      noPrice: 4,
    } as DashboardSummaryResponse["alerts"],
    recentMovements: [
      {
        tipo: "entrada",
        quantidade: 10,
        data: new Date().toISOString(),
        MedicineModel: { nome: "Paracetamol 500mg" },
        LoginModel: { login: "farmaceutico.demo" },
        ResidentModel: { nome: "Maria Silva", num_casela: 101 },
        CabinetModel: { num_armario: 1 },
      },
      {
        tipo: "saida",
        quantidade: 2,
        data: new Date(Date.now() - 86400000).toISOString(),
        InputModel: { nome: "Luvas descartáveis" },
        LoginModel: { login: "enfermeira.demo" },
        ResidentModel: { nome: "João Santos", num_casela: 102 },
        CabinetModel: { num_armario: 2 },
      },
    ],
    nonMovementProducts: [
      {
        nome: "Vitamina C 500mg",
        detalhe: "Estoque geral",
        dias_parados: 18,
        ultima_movimentacao: new Date(Date.now() - 18 * 86400000).toISOString(),
      },
    ],
    medicineRankingMore: {
      data: [
        {
          medicamento: {
            nome: "Paracetamol 500mg",
            principio_ativo: "Paracetamol",
          },
          total_movimentado: 48,
          total_entradas: 30,
          total_saidas: 18,
        },
      ],
    },
    medicineRankingLess: {
      data: [
        {
          medicamento: { nome: "Omeprazol 20mg", principio_ativo: "Omeprazol" },
          total_movimentado: 2,
          total_entradas: 2,
          total_saidas: 0,
        },
      ],
    },
    nursingProportion: stockProportionFromTotals(nursingTotals),
    pharmacyProportion: stockProportionFromTotals(pharmacyTotals),
    sectorProportions: [
      {
        key: "farmacia",
        nome: "Farmácia",
        proportion_profile: "farmacia",
        ...stockProportionFromTotals(pharmacyTotals),
      },
      {
        key: "enfermagem",
        nome: "Enfermagem",
        proportion_profile: "enfermagem",
        ...stockProportionFromTotals(nursingTotals),
      },
    ],
    cabinetStockData: {
      data: [
        { armario_id: 1, total_geral: 52 },
        { armario_id: 2, total_geral: 85 },
        { armario_id: 3, total_geral: 6 },
        { armario_id: 4, total_geral: 8 },
        { armario_id: 5, total_geral: 120 },
      ],
    },
    drawerStockData: {
      data: [
        { gaveta_id: 10, total_geral: 62 },
        { gaveta_id: 11, total_geral: 62 },
        { gaveta_id: 12, total_geral: 3 },
        { gaveta_id: 20, total_geral: 6 },
        { gaveta_id: 21, total_geral: 120 },
        { gaveta_id: 30, total_geral: 8 },
      ],
    },
  };
}

export function getPreviewMovementRows(
  kind: "entrada" | "saida" | "transferencia",
): Array<{
  id: number;
  name: string;
  additionalData: string;
  quantity: number;
  operator: string;
  movementDate: string;
  _movementDateSort: number;
  cabinet: number;
  drawerDisplay: string;
  resident: string;
  type: string;
  sector: SectorType;
  lot: string;
}> {
  const base = {
    operator: "Usuário demo",
    sector: SectorType.FARMACIA,
    lot: "LT-DEMO",
  };
  if (kind === "entrada") {
    return [
      {
        id: 1,
        name: "Paracetamol 500mg",
        additionalData: "Paracetamol",
        quantity: 20,
        ...base,
        movementDate: formatDateToPtBr(new Date()),
        _movementDateSort: Date.now(),
        cabinet: 1,
        drawerDisplay: "10 — Bloco A",
        resident: "101 — Maria Silva",
        type: "entrada",
      },
      {
        id: 2,
        name: "Soro fisiológico",
        additionalData: "Insumo",
        quantity: 30,
        ...base,
        movementDate: formatDateToPtBr(new Date(Date.now() - 172800000)),
        _movementDateSort: Date.now() - 172800000,
        cabinet: 2,
        drawerDisplay: "11 — Bloco A",
        resident: "—",
        type: "entrada",
      },
    ];
  }
  if (kind === "transferencia") {
    return [
      {
        id: 4,
        name: "Paracetamol 500mg",
        additionalData: "Paracetamol",
        quantity: 6,
        ...base,
        movementDate: formatDateToPtBr(new Date(Date.now() - 7200000)),
        _movementDateSort: Date.now() - 7200000,
        cabinet: 2,
        drawerDisplay: "11 — Bloco A",
        resident: "—",
        type: "transferencia",
      },
      {
        id: 5,
        name: "Soro fisiológico 0,9%",
        additionalData: "Insumo",
        quantity: 10,
        ...base,
        movementDate: formatDateToPtBr(new Date(Date.now() - 86400000 * 2)),
        _movementDateSort: Date.now() - 86400000 * 2,
        cabinet: 1,
        drawerDisplay: "10 — Bloco A",
        resident: "101 — Maria Silva",
        type: "transferencia",
      },
    ];
  }
  return [
    {
      id: 3,
      name: "Losartana 50mg",
      additionalData: "Losartana potássica",
      quantity: 4,
      ...base,
      movementDate: formatDateToPtBr(new Date(Date.now() - 3600000)),
      _movementDateSort: Date.now() - 3600000,
      cabinet: 1,
      drawerDisplay: "10 — Bloco A",
      resident: "102 — João Santos",
      type: "saida",
    },
  ];
}

export type PreviewNotificationRow = {
  id: number;
  residente_nome?: string;
  medicamento_nome?: string;
  destino?: string;
  data_prevista?: string;
  usuario?: { id: number };
  medicamento_id?: number;
  residente_id?: number;
  status?: string;
  quantidade?: number;
  dias_para_repor?: number;
};

export function getPreviewNotificationsReceita(): PreviewNotificationRow[] {
  return [
    {
      id: 91001,
      residente_nome: "Maria Silva",
      medicamento_nome: "Paracetamol 500mg",
      destino: "farmacia",
      data_prevista: new Date(Date.now() + 86400000 * 3).toISOString(),
      medicamento_id: 1,
      residente_id: 1,
      status: "pending",
    },
  ];
}

export function getPreviewNotificationsReposicao(): PreviewNotificationRow[] {
  return [
    {
      id: 92001,
      residente_nome: "João Santos",
      medicamento_nome: "Losartana 50mg",
      quantidade: 2,
      dias_para_repor: 5,
      data_prevista: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: "pending",
    },
  ];
}

export const PREVIEW_MEDICINES: Record<string, unknown>[] = [
  {
    id: 8001,
    nome: "Paracetamol 500mg",
    principio_ativo: "Paracetamol",
    dosagem: "500",
    unidade_medida: "mg",
    estoque_minimo: 10,
  },
  {
    id: 8002,
    nome: "Losartana 50mg",
    principio_ativo: "Losartana potássica",
    dosagem: "50",
    unidade_medida: "mg",
    estoque_minimo: 8,
  },
];

export const PREVIEW_INPUTS: Record<string, unknown>[] = [
  {
    id: 7001,
    nome: "Luvas descartáveis",
    descricao: "Procedimento",
    estoque_minimo: 100,
    preco: 39.9,
  },
  {
    id: 7002,
    nome: "Soro fisiológico 0,9%",
    descricao: "Frasco 500ml",
    estoque_minimo: 20,
    preco: 8.5,
  },
];

export const PREVIEW_ADMIN_SUMMARY_CARDS = [
  { title: "Medicamentos", value: "28", hint: "Cadastros ativos (demo)" },
  { title: "Insumos", value: "22", hint: "Cadastros ativos (demo)" },
  { title: "Residentes", value: "6", hint: "Caselas em uso (demo)" },
  { title: "Armários", value: "5", hint: "Locais de armazenamento (demo)" },
];
