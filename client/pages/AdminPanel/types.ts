import type { EffectivePermissionMatrixSerialized } from "@/domain/permission-matrix.types";

export interface UserPermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface AdminUser {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  permissions?: UserPermissions;
  permissionMatrix?: EffectivePermissionMatrixSerialized;
}

export interface AuditEvent {
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
}

export interface InsightsData {
  created: number;
  updated: number;
  deleted: number;
  total: number;
  totalFiltered: number;
  events: AuditEvent[];
}

export interface ExecutiveSummary {
  residents: number;
  medicines: number;
  inputs: number;
  cabinets: number;
  drawers: number;
}

export interface AlertStockItem {
  nome: string;
  detalhe?: string | null;
  quantidade: number;
  minimo?: number;
  validade: string;
  setor: string;
  tipo_item: string;
}

export interface AlertNoPriceItem {
  nome: string;
  detalhe?: string | null;
  tipo_item: string;
  minimo?: number;
  tentativas_busca: number;
}

export interface ResidentOption {
  casela: number;
  name: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
}

export type AuditDiffEntry = {
  key: string;
  oldVal: unknown;
  newVal: unknown;
  changed: boolean;
};
