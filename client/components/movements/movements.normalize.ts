import type { RawMovement } from "@/interfaces/interfaces";
import {
  formatCaselaLabel,
  formatGavetaLabel,
  type TenantUiDisplay,
} from "@/helpers/storage-location-display.helper";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import type { MovementRow } from "@/components/movements/movements.types";
import { parseMovementDateMs } from "@/components/movements/movements.utils";

export function normalizeMovement(
  item: RawMovement,
  ctx: {
    uiDisplay: TenantUiDisplay;
    cabinetOptions: Array<{ numero: number; categoria: string }>;
  },
): MovementRow {
  const { uiDisplay, cabinetOptions } = ctx;
  const isMedicine = item.medicamento_id != null;
  const gavetaCat = item.DrawerModel?.DrawerCategoryModel?.nome;

  const sortMs = parseMovementDateMs(item.data);
  const residentName = item.ResidentModel?.nome?.trim() || null;
  const residentCaselaFromModel =
    typeof item.ResidentModel?.num_casela === "number"
      ? item.ResidentModel.num_casela
      : item.ResidentModel?.num_casela != null
        ? Number(item.ResidentModel.num_casela)
        : null;
  const residentCasela =
    residentCaselaFromModel != null && Number.isFinite(residentCaselaFromModel)
      ? residentCaselaFromModel
      : item.casela_id != null
        ? Number(item.casela_id)
        : null;
  const cabinetNumber =
    typeof item.armario_id === "number"
      ? item.armario_id
      : item.armario_id != null
        ? Number(item.armario_id)
        : null;
  const drawerNumber =
    typeof item.gaveta_id === "number"
      ? item.gaveta_id
      : item.gaveta_id != null
        ? Number(item.gaveta_id)
        : null;
  const drawerCategory = gavetaCat?.trim() ? String(gavetaCat).trim() : null;
  const cabinetCategory =
    (cabinetNumber != null
      ? cabinetOptions.find((c) => c.numero === cabinetNumber)?.categoria
      : null) ?? null;
  const cabinetDisplay =
    uiDisplay.armario === "categoria"
      ? cabinetCategory?.trim()
        ? cabinetCategory.trim()
        : cabinetNumber != null
          ? `Armário ${cabinetNumber}`
          : "—"
      : cabinetNumber != null
        ? cabinetNumber
        : "—";
  return {
    id: item.id,
    name: isMedicine ? item.MedicineModel?.nome : item.InputModel?.nome,
    additionalData: isMedicine
      ? item.MedicineModel?.principio_ativo
      : (item.InputModel?.descricao ?? "-"),
    quantity: item.quantidade,
    operator: item.LoginModel?.first_name,
    movementDate: formatDateToPtBr(item.data as string),
    _movementDateSort: Number.isFinite(sortMs) ? sortMs : 0,
    cabinet: cabinetDisplay,
    cabinetNumber,
    cabinetCategory: cabinetCategory?.trim() ? cabinetCategory.trim() : null,
    drawerDisplay: formatGavetaLabel(uiDisplay.gaveta, {
      gavetaId: drawerNumber,
      categoriaNome: gavetaCat,
    }),
    drawerNumber,
    drawerCategory,
    resident: formatCaselaLabel(uiDisplay, {
      caselaId: residentCasela,
      residentName,
      sector: item.setor,
    }),
    residentCasela:
      residentCasela != null && Number.isFinite(residentCasela)
        ? residentCasela
        : null,
    residentName: residentName?.trim() ? residentName.trim() : null,
    type: item.tipo,
    sector: item.setor ?? "",
    lot: item.lote ?? "",
  };
}
