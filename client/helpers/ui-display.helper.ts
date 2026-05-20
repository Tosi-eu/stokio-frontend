export type UiDisplayCasela = "numero" | "nome" | "nome_casela";

export function caselaUsesResidentName(mode: UiDisplayCasela): boolean {
  return mode === "nome" || mode === "nome_casela";
}
export type UiDisplayCaselaSetor = "farmacia" | "enfermagem" | "todos";
export type UiDisplayArmarioGaveta = "numero" | "categoria";

export type UiDisplayConfig = {
  casela: UiDisplayCasela;
  caselaSetor: UiDisplayCaselaSetor;
  armario: UiDisplayArmarioGaveta;
  gaveta: UiDisplayArmarioGaveta;
};

export const DEFAULT_UI_DISPLAY: UiDisplayConfig = {
  casela: "numero",
  caselaSetor: "todos",
  armario: "numero",
  gaveta: "numero",
};

export function caselaModeForContext(
  mode: UiDisplayCasela,
  scope: UiDisplayCaselaSetor,
  sector: string | null | undefined,
): UiDisplayCasela {
  if (scope === "todos") return mode;
  const s = (sector ?? "").trim().toLowerCase();
  if (!s) return "numero";
  if (scope === "farmacia") return s === "farmacia" ? mode : "numero";
  if (scope === "enfermagem") return s === "enfermagem" ? mode : "numero";
  return "numero";
}

export function formatCaselaDisplay(
  num: number | null | undefined,
  residentName: string | null | undefined,
  uiDisplay: Pick<UiDisplayConfig, "casela" | "caselaSetor">,
  sector?: string | null | undefined,
): string {
  const effective = caselaModeForContext(
    uiDisplay.casela,
    uiDisplay.caselaSetor,
    sector,
  );
  if (num == null) return "-";
  const name = residentName?.trim();
  if (effective === "nome" && name) return name;
  if (effective === "nome_casela" && name) return `${name} (${num})`;
  return String(num);
}

export function formatArmarioDisplay(
  num: number | null | undefined,
  categoria: string | null | undefined,
  mode: UiDisplayArmarioGaveta,
): string {
  if (num == null) return "-";
  if (mode === "categoria" && categoria?.trim()) return categoria.trim();
  return String(num);
}

export function formatGavetaDisplay(
  num: number | null | undefined,
  categoria: string | null | undefined,
  mode: UiDisplayArmarioGaveta,
): string {
  if (num == null) return "-";
  if (mode === "categoria" && categoria?.trim()) return categoria.trim();
  return String(num);
}

export function armarioFilterLabel(
  num: number,
  categoria: string | null | undefined,
  mode: UiDisplayArmarioGaveta,
): string {
  if (mode === "categoria" && categoria?.trim()) return categoria.trim();
  return `Armário ${num}`;
}

export function gavetaFilterLabel(
  num: number,
  categoria: string | null | undefined,
  mode: UiDisplayArmarioGaveta,
): string {
  if (mode === "categoria" && categoria?.trim()) return categoria.trim();
  return `Gaveta ${num}`;
}

export function caselaFilterLabel(
  num: number,
  residentName: string | null | undefined,
  uiDisplay: Pick<UiDisplayConfig, "casela" | "caselaSetor">,
  sector: string | null | undefined,
): string {
  const mode = caselaModeForContext(
    uiDisplay.casela,
    uiDisplay.caselaSetor,
    sector,
  );
  const name = residentName?.trim();
  if (mode === "nome" && name) return name;
  if (mode === "nome_casela" && name) return `${name} (${num})`;
  return `Casela ${num}`;
}

export function cabinetCategoryByNumero(
  cabinets: Array<{ numero: number; categoria: string }>,
): Map<number, string> {
  const m = new Map<number, string>();
  for (const c of cabinets) m.set(c.numero, c.categoria);
  return m;
}

export function drawerCategoryByNumero(
  drawers: Array<{ numero: number; categoria: string }>,
): Map<number, string> {
  const m = new Map<number, string>();
  for (const d of drawers) m.set(d.numero, d.categoria);
  return m;
}
