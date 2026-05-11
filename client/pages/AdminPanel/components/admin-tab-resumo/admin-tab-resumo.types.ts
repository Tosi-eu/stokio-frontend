import type { ExecutiveSummary } from "../../types";
import type { SummaryListKind } from "../../hooks/useAdminSummary";
import type {
  AdminMedicineAbcBundleResponse,
  AdminMetricsResponse,
} from "@/api/requests";

export interface AdminTabResumoProps {
  metrics?: AdminMetricsResponse | null;
  summary: ExecutiveSummary | null;
  loadingSummary: boolean;
  expandedSummary: SummaryListKind | null;
  summaryListData: Record<string, unknown>[];
  loadingSummaryList: boolean;
  loadSummaryList: (kind: SummaryListKind) => void;
  expiringDays: 30 | 60 | 90;
  setExpiringDays: (v: 30 | 60 | 90) => void;
  expiringItems: Array<{
    nome: string;
    tipo_item: string;
    validade: string;
    dias_para_vencer: number;
    quantidade: number;
    setor: string;
    lote?: string | null;
  }>;
  expiringItemsTotal: number;
  expiringItemsPage: number;
  setExpiringItemsPage: (v: number | ((p: number) => number)) => void;
  loadingExpiringItems: boolean;
  consumptionStart: string;
  setConsumptionStart: (v: string) => void;
  consumptionEnd: string;
  setConsumptionEnd: (v: string) => void;
  consumptionByItemData: {
    items: Array<{
      nome: string;
      tipo_item: string;
      entrada: number;
      saida: number;
    }>;
    subtotal: { entrada: number; saida: number };
  };
  loadingConsumptionByItem: boolean;
  fetchConsumptionByItem: () => void;
  stockHistoryItemType: "medicamento" | "insumo";
  setStockHistoryItemType: (v: "medicamento" | "insumo") => void;
  stockHistoryItemSearch: string;
  setStockHistoryItemSearch: (v: string) => void;
  stockHistoryItemOptions: { id: number; nome: string }[];
  stockHistorySelectedItem: { id: number; nome: string } | null;
  setStockHistorySelectedItem: (v: { id: number; nome: string } | null) => void;
  loadingStockHistoryItemSearch: boolean;
  stockHistoryItemPopoverOpen: boolean;
  setStockHistoryItemPopoverOpen: (v: boolean) => void;
  stockHistoryLote: string;
  setStockHistoryLote: (v: string) => void;
  stockHistoryData: Array<{
    id: number;
    data: string;
    tipo: string;
    nome: string;
    quantidade: number;
    setor: string;
    lote?: string | null;
    operador: string;
    residente?: string | null;
  }>;
  stockHistoryTotal: number;
  loadingStockHistory: boolean;
  fetchStockHistoryByItem: (itemId: number, page?: number) => void;
  fetchStockHistoryByLote: (page?: number) => void;
  stockHistoryPage: number;
  setStockHistoryPage: (v: number | ((p: number) => number)) => void;
  stockHistoryLimit: number;
  setStockHistoryLimit: (v: number) => void;
  abcDays: number;
  setAbcDays: (v: number) => void;
  abcBundle: AdminMedicineAbcBundleResponse | null;
  loadingAbc: boolean;
}
