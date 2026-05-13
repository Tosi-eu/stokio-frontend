export type TenantUiDisplayDefaultReportFormat = "pdf" | "xlsx";

export type TenantUiDisplay = {
  casela: "numero" | "nome";
  caselaSetor: "farmacia" | "enfermagem" | "todos";
  armario: "numero" | "categoria";
  gaveta: "numero" | "categoria";
  defaultReportFormat: TenantUiDisplayDefaultReportFormat;
};

export const DEFAULT_UI_DISPLAY: TenantUiDisplay = {
  casela: "nome",
  caselaSetor: "todos",
  armario: "numero",
  gaveta: "numero",
  defaultReportFormat: "pdf",
};

function normalizeCaselaSetor(v: unknown): TenantUiDisplay["caselaSetor"] {
  const s = String(v ?? "").toLowerCase();
  if (s === "farmacia" || s === "enfermagem" || s === "todos") return s;
  return "todos";
}

function normalizeDefaultReportFormat(
  v: unknown,
): TenantUiDisplayDefaultReportFormat {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "xlsx") return "xlsx";
  return "pdf";
}

export function normalizeUiDisplay(
  raw?: Partial<TenantUiDisplay> | null,
): TenantUiDisplay {
  if (!raw) return DEFAULT_UI_DISPLAY;
  return {
    casela: raw.casela === "numero" ? "numero" : "nome",
    caselaSetor: normalizeCaselaSetor(raw.caselaSetor),
    armario: raw.armario === "categoria" ? "categoria" : "numero",
    gaveta: raw.gaveta === "categoria" ? "categoria" : "numero",
    defaultReportFormat: normalizeDefaultReportFormat(raw.defaultReportFormat),
  };
}

export function formatCaselaLabel(
  mode: TenantUiDisplay["casela"],
  opts: {
    caselaId: number | null | undefined;
    residentName?: string | null;
  },
): string {
  const id = opts.caselaId;
  if (id == null) return "—";
  if (mode === "numero") return String(id);
  const name = String(opts.residentName ?? "").trim();
  if (name) return `${name} (${id})`;
  return `Casela ${id}`;
}

export function formatGavetaLabel(
  mode: TenantUiDisplay["gaveta"],
  opts: {
    gavetaId: number | string | null | undefined;
    categoriaNome?: string | null;
  },
): string {
  const rawId = opts.gavetaId;
  if (rawId === null || rawId === undefined || rawId === "") return "—";
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (mode === "numero") return String(rawId);
  const cat = String(opts.categoriaNome ?? "").trim();
  if (cat) return cat;
  if (!Number.isNaN(id)) return `Gaveta ${id}`;
  return String(rawId);
}
