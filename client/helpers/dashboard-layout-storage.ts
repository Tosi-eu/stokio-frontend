import type { DashboardWidgetId } from "@/constants/dashboard-widgets";
import { DASHBOARD_WIDGET_IDS } from "@/constants/dashboard-widgets";

const STORAGE_VERSION = 1 as const;

export type DashboardLayoutV1 = {
  version: typeof STORAGE_VERSION;
  /** Widgets removidos do painel (podem ser readicionados). */
  hidden: DashboardWidgetId[];
  /** Largura em telas grandes: true = ocupa as duas colunas do grid. */
  wide: Partial<Record<DashboardWidgetId, boolean>>;
};

const DEFAULT_LAYOUT: DashboardLayoutV1 = {
  version: STORAGE_VERSION,
  hidden: [],
  wide: {},
};

function storageKey(tenantId: number) {
  return `abrigo.dashboardLayout.${tenantId}`;
}

export function readDashboardLayout(
  tenantId: number | null,
): DashboardLayoutV1 {
  if (tenantId == null || typeof window === "undefined") {
    return { ...DEFAULT_LAYOUT, hidden: [], wide: {} };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId));
    if (!raw) return { ...DEFAULT_LAYOUT, hidden: [], wide: {} };
    const parsed = JSON.parse(raw) as Partial<DashboardLayoutV1>;
    if (parsed?.version !== STORAGE_VERSION) {
      return { ...DEFAULT_LAYOUT, hidden: [], wide: {} };
    }
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((id): id is DashboardWidgetId =>
          DASHBOARD_WIDGET_IDS.includes(id as DashboardWidgetId),
        )
      : [];
    const wide: Partial<Record<DashboardWidgetId, boolean>> = {};
    if (parsed.wide && typeof parsed.wide === "object") {
      for (const id of DASHBOARD_WIDGET_IDS) {
        if (parsed.wide[id] === true) wide[id] = true;
      }
    }
    return { version: STORAGE_VERSION, hidden, wide };
  } catch {
    return { ...DEFAULT_LAYOUT, hidden: [], wide: {} };
  }
}

export function writeDashboardLayout(
  tenantId: number | null,
  layout: DashboardLayoutV1,
) {
  if (tenantId == null || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKey(tenantId),
      JSON.stringify({
        version: STORAGE_VERSION,
        hidden: layout.hidden,
        wide: layout.wide,
      }),
    );
  } catch {
    /* ignore */
  }
}
