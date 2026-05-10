import type { StockDistributionItem } from "@/interfaces/interfaces";

export type SectorProportionChartRow = {
  key: string;
  nome: string;
  data: StockDistributionItem[];
};

export function sortProportionChartsByEnabledOrder(
  charts: SectorProportionChartRow[],
  enabledOrder: string[],
): SectorProportionChartRow[] {
  return [...charts].sort((a, b) => {
    const ia = enabledOrder.indexOf(a.key);
    const ib = enabledOrder.indexOf(b.key);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}
