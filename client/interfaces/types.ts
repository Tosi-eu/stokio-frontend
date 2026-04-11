export type StockActionType =
  | "remove"
  | "suspend"
  | "resume"
  | "transfer"
  | null;

/** Alinhado com `computeExpiryStatus` no backend. */
export type StockExpiryStatus = "expired" | "critical" | "warning" | "healthy";

/** Alinhado com `computeQuantityStatus` no backend. */
export type StockQuantityStatus =
  | "empty"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type StockItemType = "medicamento" | "insumo";

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  login?: string;
  password?: string;
  currentPassword: string;
};

export type StockFilter = "nearMin" | "belowMin" | "expired" | "expiringSoon";
