import type { AccessibleTenantRow, LoginTenantSummary } from "@/api/requests";

export function tenantProfileLabel(
  t:
    | { name: string; brandName: string | null; slug: string }
    | null
    | undefined,
): string {
  if (!t) return "este abrigo";
  const n = (t.brandName?.trim() || t.name?.trim() || "").trim();
  return n || t.slug;
}

export function accessibleTenantLabel(t: AccessibleTenantRow): string {
  const n = (t.brandName?.trim() || t.name || "").trim();
  return n || t.slug;
}

export function loginTenantDisplayLabel(t: LoginTenantSummary): string {
  const brand = t.brandName?.trim();
  const name = t.tenantName?.trim();
  const label = t.label?.trim();
  if (brand && name && brand !== name) {
    return `${brand} — ${name}`;
  }
  if (brand) return brand;
  if (name) return name;
  if (label) return label;
  return t.slug;
}
