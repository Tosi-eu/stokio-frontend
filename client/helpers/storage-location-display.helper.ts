import {
  caselaModeForContext,
  type UiDisplayCasela,
} from "@/helpers/ui-display.helper";

export type TenantUiDisplayDefaultReportFormat = "pdf" | "xlsx";

export type TenantUiDisplayCasela = UiDisplayCasela;

export type TenantUiDisplay = {
  casela: TenantUiDisplayCasela;
  caselaSetor: "farmacia" | "enfermagem" | "todos";
  armario: "numero" | "categoria";
  gaveta: "numero" | "categoria";
  defaultReportFormat: TenantUiDisplayDefaultReportFormat;
};

export const DEFAULT_UI_DISPLAY: TenantUiDisplay = {
  casela: "nome_casela",
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

function normalizeCaselaMode(v: unknown): TenantUiDisplayCasela {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s === "numero") return "numero";
  if (s === "nome_casela") return "nome_casela";
  if (s === "nome") return "nome";
  return DEFAULT_UI_DISPLAY.casela;
}

export function normalizeUiDisplay(
  raw?: Partial<TenantUiDisplay> | null,
): TenantUiDisplay {
  if (!raw) return DEFAULT_UI_DISPLAY;
  return {
    casela: normalizeCaselaMode(raw.casela),
    caselaSetor: normalizeCaselaSetor(raw.caselaSetor),
    armario: raw.armario === "categoria" ? "categoria" : "numero",
    gaveta: raw.gaveta === "categoria" ? "categoria" : "numero",
    defaultReportFormat: normalizeDefaultReportFormat(raw.defaultReportFormat),
  };
}

export function formatCaselaLabel(
  display: Pick<TenantUiDisplay, "casela" | "caselaSetor">,
  opts: {
    caselaId: number | null | undefined;
    residentName?: string | null;
    sector?: string | null;
  },
): string {
  const id = opts.caselaId;
  if (id == null) return "—";

  const name = String(opts.residentName ?? "").trim();
  const configured = display.casela;

  let effective: "numero" | "nome" | "nome_casela";
  if (configured === "numero") {
    effective = "numero";
  } else if (configured === "nome_casela") {
    effective =
      caselaModeForContext("nome", display.caselaSetor, opts.sector) === "nome"
        ? "nome_casela"
        : "numero";
  } else {
    effective =
      caselaModeForContext("nome", display.caselaSetor, opts.sector) === "nome"
        ? "nome"
        : "numero";
  }

  if (effective === "numero") return String(id);
  if (effective === "nome_casela") {
    if (name) return `${name} (${id})`;
    return `Casela ${id}`;
  }
  if (name) return name;
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
