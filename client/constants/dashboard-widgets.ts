export type DashboardWidgetId =
  | "kpis"
  | "nonMovement"
  | "recentMovements"
  | "mostMoved"
  | "leastMoved"
  | "cabinetChart"
  | "drawerChart"
  | "pharmacyProportion"
  | "nursingProportion"
  | "customSectorProportions";

export const DASHBOARD_WIDGET_IDS: DashboardWidgetId[] = [
  "kpis",
  "nonMovement",
  "recentMovements",
  "mostMoved",
  "leastMoved",
  "cabinetChart",
  "drawerChart",
  "pharmacyProportion",
  "nursingProportion",
  "customSectorProportions",
];

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  kpis: "Indicadores (KPIs)",
  nonMovement: "Produtos sem movimentação",
  recentMovements: "Movimentações recentes",
  mostMoved: "Medicações mais movimentadas",
  leastMoved: "Medicações menos movimentadas",
  cabinetChart: "Itens por armário",
  drawerChart: "Itens por gaveta",
  pharmacyProportion: "Proporção — farmácia",
  nursingProportion: "Proporção — enfermagem",
  customSectorProportions: "Proporção — outros setores",
};
