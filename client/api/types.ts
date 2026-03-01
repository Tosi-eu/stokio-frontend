
export interface PaginatedResponse<T> {
  data: T[];
  hasNext: boolean;
  page?: number;
  limit?: number;
  total?: number;
}

export interface AdminInsightsResponse {
  created: number;
  updated: number;
  deleted: number;
  total: number;
  totalFiltered: number;
  events: Array<{
    id: number;
    user_id: number | null;
    method: string;
    path: string;
    operation_type: string;
    resource: string | null;
    status_code: number;
    duration_ms: number | null;
    created_at: string;
    old_value: Record<string, unknown> | string | null;
    new_value: Record<string, unknown> | string | null;
  }>;
}

export interface NotificationsResponse {
  items?: unknown[];
  total?: number;
  hasNext?: boolean;
}

import type { StockProportionResponse } from "@/interfaces/interfaces";

export interface RawDashboardMovement {
  tipo?: string;
  quantidade?: number;
  data?: string;
  MedicineModel?: { nome?: string };
  InputModel?: { nome?: string };
  LoginModel?: { login?: string };
  ResidentModel?: { nome?: string; num_casela?: number };
  CabinetModel?: { num_armario?: number };
}

export interface RawMedicineRankingItem {
  medicamento?: { nome?: string; principio_ativo?: string };
  total_movimentado?: number;
  total_entradas?: number;
  total_saidas?: number;
}

export interface RawCabinetStockItem {
  armario_id?: number;
  total_geral?: number;
}

export interface RawDrawerStockItem {
  gaveta_id?: number;
  total_geral?: number;
}

export interface DashboardSummaryResponse {
  alerts?: {
    noStock?: number;
    belowMin?: number;
    nearMin?: number;
    expired?: number;
    expiringSoon?: number;
  };
  recentMovements?: RawDashboardMovement[];
  nonMovementProducts?: unknown[];
  medicineRankingMore?: { data?: RawMedicineRankingItem[] };
  medicineRankingLess?: { data?: RawMedicineRankingItem[] };
  nursingProportion?: StockProportionResponse | null;
  pharmacyProportion?: StockProportionResponse | null;
  cabinetStockData?: { data?: RawCabinetStockItem[] };
  drawerStockData?: { data?: RawDrawerStockItem[] };
}
