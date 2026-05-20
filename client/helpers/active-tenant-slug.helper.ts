import { isFunctionalConsentGranted } from "@/helpers/functional-consent.helper";

const STORAGE_KEY = "stokio_active_tenant_slug";
const COOKIE_NAME = "stokio_active_tenant";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

let memorySlug: string | null = null;

function readFunctionalCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    const v = decodeURIComponent(match[1]).trim();
    return v || null;
  } catch {
    return null;
  }
}

function writeFunctionalCookie(slug: string | null): void {
  if (typeof document === "undefined" || !isFunctionalConsentGranted()) return;
  if (slug?.trim()) {
    const value = encodeURIComponent(slug.trim());
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

function clearFunctionalCookie(): void {
  writeFunctionalCookie(null);
}

export function readActiveTenantSlug(): string | null {
  if (memorySlug?.trim()) return memorySlug.trim();
  if (isFunctionalConsentGranted()) {
    const fromCookie = readFunctionalCookie();
    if (fromCookie) {
      memorySlug = fromCookie;
      return fromCookie;
    }
  }
  if (typeof window === "undefined") return null;
  try {
    const legacy = sessionStorage.getItem(STORAGE_KEY);
    if (legacy?.trim()) {
      memorySlug = legacy.trim();
      sessionStorage.removeItem(STORAGE_KEY);
      writeFunctionalCookie(memorySlug);
      return memorySlug;
    }
  } catch {
    void 0;
  }
  return null;
}

export function clearActiveTenantSlug(): void {
  memorySlug = null;
  clearFunctionalCookie();
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}

export function writeActiveTenantSlug(slug: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (slug != null && slug.trim()) {
      memorySlug = slug.trim();
      writeFunctionalCookie(memorySlug);
    } else {
      memorySlug = null;
      clearFunctionalCookie();
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      void 0;
    }
    window.dispatchEvent(new CustomEvent("stokio-active-tenant-changed"));
  } catch {
    void 0;
  }
}
