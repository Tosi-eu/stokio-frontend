export type TenantUiDisplay = {
  casela: "numero" | "nome";
  gaveta: "numero" | "categoria";
};

export const DEFAULT_UI_DISPLAY: TenantUiDisplay = {
  casela: "nome",
  gaveta: "numero",
};

export function normalizeUiDisplay(
  raw?: Partial<TenantUiDisplay> | null,
): TenantUiDisplay {
  if (!raw) return DEFAULT_UI_DISPLAY;
  return {
    casela: raw.casela === "numero" ? "numero" : "nome",
    gaveta: raw.gaveta === "categoria" ? "categoria" : "numero",
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
  const id =
    typeof rawId === "number" ? rawId : Number(rawId);
  if (mode === "numero") return String(rawId);
  const cat = String(opts.categoriaNome ?? "").trim();
  if (cat) return cat;
  if (!Number.isNaN(id)) return `Gaveta ${id}`;
  return String(rawId);
}
