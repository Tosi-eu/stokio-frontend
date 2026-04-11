import type { TenantModules } from "@/context/tenant-context";

const DEFAULT = ["farmacia", "enfermagem"] as const;

const sectorKeyRe = /^[a-z0-9_]{1,64}$/;

export function getEnabledSectors(
  modules: Pick<TenantModules, "enabled_sectors"> | null,
): string[] {
  const raw = modules?.enabled_sectors;
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const k = x.trim().toLowerCase();
    if (!sectorKeyRe.test(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out.length ? out : [...DEFAULT];
}

/** Rótulo curto para UI (lista de setores ativos no painel). */
export function formatTenantSectorKeyLabel(key: string): string {
  const k = key.trim().toLowerCase();
  if (k === "farmacia") return "Farmácia";
  if (k === "enfermagem") return "Enfermagem";
  return k
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}
