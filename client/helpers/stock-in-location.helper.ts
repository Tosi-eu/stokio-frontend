import { ItemStockType } from "@/utils/enums";

export type StockInLocationInput = {
  casela?: number | null;
  cabinetId?: number | null;
  drawerId?: number | null;
};

function isCartStockType(tipo: string): boolean {
  return (
    tipo === ItemStockType.CARRINHO ||
    tipo === ItemStockType.CARRINHO_PSICOTROPICOS
  );
}

/**
 * Payload POST /estoque/entrada:
 * - individual → casela_id + armario_id
 * - geral → armario_id
 * - carrinho → gaveta_id (setor enfermagem no formulário)
 */
export function buildStockInLocationFields(
  stockType: string | undefined,
  loc: StockInLocationInput,
): {
  casela_id?: number;
  armario_id?: number;
  gaveta_id?: number;
} {
  const tipo = String(stockType ?? "")
    .trim()
    .toLowerCase();

  if (tipo === ItemStockType.INDIVIDUAL) {
    const caselaId =
      loc.casela != null && Number.isFinite(Number(loc.casela))
        ? Number(loc.casela)
        : undefined;
    const armarioId =
      loc.cabinetId != null && Number.isFinite(Number(loc.cabinetId))
        ? Number(loc.cabinetId)
        : undefined;
    return {
      ...(caselaId != null ? { casela_id: caselaId } : {}),
      ...(armarioId != null ? { armario_id: armarioId } : {}),
    };
  }

  if (isCartStockType(tipo)) {
    const gavetaId =
      loc.drawerId != null && Number.isFinite(Number(loc.drawerId))
        ? Number(loc.drawerId)
        : undefined;
    return gavetaId != null ? { gaveta_id: gavetaId } : {};
  }

  const armarioId =
    loc.cabinetId != null && Number.isFinite(Number(loc.cabinetId))
      ? Number(loc.cabinetId)
      : undefined;
  return armarioId != null ? { armario_id: armarioId } : {};
}
