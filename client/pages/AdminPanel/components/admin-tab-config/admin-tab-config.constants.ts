/** Fallback offline — deve espelhar `TENANT_MODULE_DEFINITIONS` no backend (domain/tenant.types). */
export const ADMIN_TAB_CONFIG_MODULE_OPTIONS: Array<{
  key: string;
  label: string;
}> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "residents", label: "Residentes" },
  { key: "medicines", label: "Medicamentos" },
  { key: "inputs", label: "Insumos" },
  { key: "stock", label: "Estoque" },
  { key: "movements", label: "Movimentações" },
  { key: "cabinets", label: "Armários" },
  { key: "drawers", label: "Gavetas" },
  { key: "reports", label: "Relatórios" },
  { key: "notifications", label: "Notificações" },
  { key: "profile", label: "Perfil (conta e senha)" },
  { key: "medical_record_exports", label: "Prontuários" },
  { key: "admin", label: "Painel administrativo" },
];
