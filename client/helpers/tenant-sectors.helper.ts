import type { TenantModules } from "@/context/tenant-context";

const DEFAULT = ["farmacia", "enfermagem"] as const;

export const SECTOR_KEY_REGEX = /^[a-z0-9_]{1,64}$/;

export function tenantEnabledKeysForConfigPatch(
  modulesEnabled: readonly string[] | null | undefined,
): string[] {
  const base = Array.isArray(modulesEnabled) ? [...modulesEnabled] : [];
  return base.includes("admin") ? base : [...base, "admin"];
}

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
    if (!SECTOR_KEY_REGEX.test(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out.length ? out : [...DEFAULT];
}

export function formatTenantSectorKeyLabel(key: string): string {
  const k = key.trim().toLowerCase();
  if (k === "farmacia") return "Farmácia";
  if (k === "enfermagem") return "Enfermagem";
  return k
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

export function resolveSectorProfile(
  sectorKey: string | null | undefined,
  profilesByKey: Map<string, "farmacia" | "enfermagem">,
): "farmacia" | "enfermagem" {
  const k = (sectorKey ?? "").trim().toLowerCase();
  if (!k) return "farmacia";
  const p = profilesByKey.get(k);
  if (p) return p;
  return k === "enfermagem" ? "enfermagem" : "farmacia";
}
export function buildSectorFilterOptions(
  enabledKeys: string[],
  labelByKey: Map<string, string>,
): Array<{ value: string; label: string }> {
  return enabledKeys.map((k) => ({
    value: k,
    label: labelByKey.get(k) ?? formatTenantSectorKeyLabel(k),
  }));
}
