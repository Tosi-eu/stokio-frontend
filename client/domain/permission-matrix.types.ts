export type PermissionResourceKey =
  | "dashboard"
  | "residents"
  | "medicines"
  | "inputs"
  | "stock"
  | "movements"
  | "reports"
  | "notifications"
  | "admin"
  | "cabinets"
  | "drawers"
  | "cabinet_categories"
  | "drawer_categories"
  | "tenant"
  | "tenant_context"
  | "imports"
  | "profile"
  | "medical_record_exports"
  | "audit";

export type MovementTipoKey = "entrada" | "saida" | "transferencia";

export type ResourceCrud = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type EffectivePermissionMatrixSerialized = {
  resources: Record<PermissionResourceKey, ResourceCrud>;
  movement_tipos: Record<MovementTipoKey, boolean>;
};

export type PermissionMatrixV2Stored = {
  version: 2;
  resources: Partial<Record<PermissionResourceKey, Partial<ResourceCrud>>>;
  movement_tipos?: Partial<Record<MovementTipoKey, boolean>>;
};
