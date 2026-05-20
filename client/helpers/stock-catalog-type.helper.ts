import { OperationType } from "@/utils/enums";

/** Converte `tipo_item` da listagem (PT ou legado EN) para saída/entrada na API. */
export function toCatalogOperationType(
  raw: string | undefined | null,
): OperationType.MEDICINE | OperationType.INPUT {
  const t = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (t === OperationType.INPUT || t === "supply") return OperationType.INPUT;
  return OperationType.MEDICINE;
}
