import type { StockItem } from "@/interfaces/interfaces";

export const CABINET_STOCK_DETAIL_COLUMNS = [
  { key: "stockType", label: "Tipo", editable: false },
  { key: "name", label: "Nome", editable: false },
  { key: "quantity", label: "Qtd.", editable: false },
  { key: "expiry", label: "Validade", editable: false },
  { key: "drawer", label: "Gaveta", editable: false },
  { key: "casela", label: "Casela", editable: false },
  { key: "sector", label: "Setor", editable: false },
  { key: "lot", label: "Lote", editable: false },
];

export function stockItemsToCabinetDetailRows(
  items: StockItem[],
): Record<string, unknown>[] {
  return items.map((i) => ({
    stockType: i.stockType,
    name: i.name,
    quantity: i.quantity,
    expiry: i.expiry,
    drawer: i.drawer ?? "—",
    casela: i.casela ?? "—",
    sector: i.sector,
    lot: i.lot ?? "—",
  }));
}
