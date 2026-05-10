import type { LoginTenantSummary } from "@/api/requests";

export function formatLoginTenantChoice(t: LoginTenantSummary): string {
  const brand = t.brandName?.trim();
  const name = t.tenantName?.trim();
  if (brand && name && brand !== name) {
    return `${brand} — ${name} (${t.slug})`;
  }
  if (brand) return `${brand} (${t.slug})`;
  if (name) return `${name} (${t.slug})`;
  return `${t.label} (${t.slug})`;
}
