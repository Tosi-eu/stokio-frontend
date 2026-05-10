export type MovementRow = {
  id: number | undefined;
  name: string | undefined;
  additionalData: string | null | undefined;
  quantity: number | undefined;
  operator: string | undefined;
  movementDate: string;
  _movementDateSort: number;
  cabinet: number | string;
  cabinetNumber: number | null;
  cabinetCategory: string | null;
  drawerDisplay: string;
  drawerNumber: number | null;
  drawerCategory: string | null;
  resident: string;
  residentCasela: number | null;
  residentName: string | null;
  type: string | undefined;
  sector: string;
  lot: string;
};

export type MovementFilters = {
  produto: string;
  armario: string;
  gaveta: string;
  casela: string;
  setor: string;
  lote: string;
};

export const DEFAULT_MOVEMENT_FILTERS: MovementFilters = {
  produto: "",
  armario: "",
  gaveta: "",
  casela: "",
  setor: "",
  lote: "",
};
