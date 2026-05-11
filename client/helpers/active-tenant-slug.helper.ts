const STORAGE_KEY = "stokio_active_tenant_slug";

export function readActiveTenantSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function clearActiveTenantSlug(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Persist slug override for API `X-Tenant`. Pass `null` to use primário (JWT). */
export function writeActiveTenantSlug(slug: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (slug != null && slug.trim()) {
      sessionStorage.setItem(STORAGE_KEY, slug.trim());
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent("stokio-active-tenant-changed"));
  } catch {
    /* ignore */
  }
}
