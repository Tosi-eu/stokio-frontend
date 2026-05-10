import type {
  MovementFilters,
  MovementRow,
} from "@/components/movements/movements.types";

export function applyMovementFilters(
  rows: MovementRow[],
  filters: MovementFilters,
  gavetaDisplayMode: string,
): MovementRow[] {
  const produto = filters.produto.trim().toLowerCase();
  const armario = filters.armario.trim();
  const gaveta = filters.gaveta.trim();
  const casela = filters.casela.trim();
  const setor = filters.setor.trim().toLowerCase();
  const lote = filters.lote.trim().toLowerCase();

  return rows.filter((r) => {
    if (produto) {
      const name = String(r.name ?? "").toLowerCase();
      const add = String(r.additionalData ?? "").toLowerCase();
      if (!name.includes(produto) && !add.includes(produto)) return false;
    }

    if (armario) {
      const n = Number(armario);
      if (!Number.isNaN(n)) {
        if (r.cabinetNumber !== n) return false;
      } else {
        const cat = String(r.cabinetCategory ?? "").toLowerCase();
        if (!cat.includes(armario.toLowerCase())) return false;
      }
    }

    if (gaveta) {
      if (gavetaDisplayMode === "numero") {
        const n = Number(gaveta);
        if (Number.isNaN(n) || r.drawerNumber !== n) return false;
      } else {
        const cat = String(r.drawerCategory ?? "").toLowerCase();
        if (!cat.includes(gaveta.toLowerCase())) return false;
      }
    }

    if (casela) {
      const n = Number(casela);
      if (Number.isNaN(n) || r.residentCasela !== n) return false;
    }

    if (setor) {
      if (String(r.sector ?? "").toLowerCase() !== setor) return false;
    }

    if (lote) {
      if (
        !String(r.lot ?? "")
          .toLowerCase()
          .includes(lote)
      )
        return false;
    }

    return true;
  });
}
