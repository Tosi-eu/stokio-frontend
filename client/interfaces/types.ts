export type StockActionType =
  | "remove"
  | "suspend"
  | "resume"
  | "transfer"
  | null;

export type StockExpiryStatus = "expired" | "critical" | "warning" | "healthy";

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

export type UpdateUserResponse = {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

export type StockFilter =
  | "nearMin"
  | "belowMin"
  | "noPrice"
  | "expired"
  | "expiringSoon";
