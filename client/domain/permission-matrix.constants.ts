import type { PermissionResourceKey } from "./permission-matrix.types";

export const PERMISSION_RESOURCE_KEYS = [
  "dashboard",
  "residents",
  "medicines",
  "inputs",
  "stock",
  "movements",
  "reports",
  "notifications",
  "cabinets",
  "drawers",
  "cabinet_categories",
  "drawer_categories",
  "profile",
] as const satisfies readonly PermissionResourceKey[];

export const PERMISSION_RESOURCE_LABELS: Record<PermissionResourceKey, string> =
  {
    dashboard: "Painel",
    residents: "Residentes",
    medicines: "Medicamentos",
    inputs: "Insumos",
    stock: "Estoque",
    movements: "Movimentações",
    reports: "Relatórios",
    notifications: "Notificações",
    admin: "Painel administrativo (oculto)",
    cabinets: "Armários",
    drawers: "Gavetas",
    cabinet_categories: "Categorias de armário",
    drawer_categories: "Categorias de gaveta",
    tenant: "Dados do abrigo (oculto)",
    imports: "Importações (oculto)",
    profile: "Perfil",
  };

export const MOVEMENT_TIPO_KEYS = [
  "entrada",
  "saida",
  "transferencia",
] as const;

export const MOVEMENT_TIPO_LABELS: Record<
  (typeof MOVEMENT_TIPO_KEYS)[number],
  string
> = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
};
