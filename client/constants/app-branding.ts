/** STG em dev; PRD em production build — alinhado ao backend (env.validation). */
export function resolveActiveR2PublicBaseUrl(): string | null {
  const prd = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL_PRD?.trim();
  const stg = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL_STG?.trim();
  const fallback = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim();
  const isProd = process.env.NODE_ENV === "production";
  const raw = isProd ? prd || fallback : stg || fallback;
  return normalizeR2PublicBaseUrl(raw || undefined);
}

export function normalizeR2PublicBaseUrl(
  raw: string | undefined,
): string | null {
  let s = raw?.trim();
  if (!s) return null;
  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = `https://${s}`;
  }
  s = s.replace(/\/$/, "");
  if (s.endsWith("/default_logo.png")) {
    s = s.slice(0, -"/default_logo.png".length);
  }
  return s || null;
}

export const BRAND_LOGO_LOCAL_FALLBACK_PATH = "/default_logo.png";

function r2DefaultLogoUrl(): string | null {
  const r2 = resolveActiveR2PublicBaseUrl();
  if (!r2) return null;
  return `${r2}/default_logo.png`;
}

export function getR2PublicDefaultLogoUrl(): string | null {
  return r2DefaultLogoUrl();
}

function stripUrlQuery(u: string): string {
  const i = u.indexOf("?");
  return i === -1 ? u : u.slice(0, i);
}

export function getNextBrandLogoFallback(currentSrc: string): string | null {
  const cur = stripUrlQuery(currentSrc.trim());
  const r2 = getR2PublicDefaultLogoUrl();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const localAbs = origin
    ? `${origin}${BRAND_LOGO_LOCAL_FALLBACK_PATH}`
    : BRAND_LOGO_LOCAL_FALLBACK_PATH;

  if (r2) {
    const r2Norm = stripUrlQuery(r2);
    if (cur !== r2Norm) return r2;
    if (cur !== stripUrlQuery(localAbs)) return localAbs;
    return null;
  }
  if (cur !== stripUrlQuery(localAbs)) return localAbs;
  return null;
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function resolvePublicLogoUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_LOGO_URL?.trim();
  if (explicit && isAbsoluteHttpUrl(explicit)) return explicit;

  const r2Logo = r2DefaultLogoUrl();
  if (r2Logo) {
    if (!explicit || explicit === BRAND_LOGO_LOCAL_FALLBACK_PATH) return r2Logo;
    return explicit;
  }

  if (explicit) return explicit;
  return BRAND_LOGO_LOCAL_FALLBACK_PATH;
}

function resolvePdfLogoUrl(): string {
  const pdf = process.env.NEXT_PUBLIC_LOGO_URL?.trim();
  if (pdf && isAbsoluteHttpUrl(pdf)) return pdf;

  const r2Logo = r2DefaultLogoUrl();
  if (r2Logo) {
    if (!pdf || pdf === BRAND_LOGO_LOCAL_FALLBACK_PATH) return r2Logo;
    return pdf;
  }

  if (pdf) return pdf;
  return resolvePublicLogoUrl();
}

function resolvePublicAppName(): string {
  const raw = process.env.NEXT_PUBLIC_APP_NAME;
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s) return s;
  return "Stokio - Gestão Inteligente de Abrigos";
}

export const APP_PUBLIC_NAME = resolvePublicAppName();

export const APP_PUBLIC_LOGO_URL = resolvePublicLogoUrl();

export function mergePublicLogoWithServerDefault(
  serverDefaultLogoUrl: string | null | undefined,
): string {
  if (isAbsoluteHttpUrl(APP_PUBLIC_LOGO_URL.trim())) {
    return APP_PUBLIC_LOGO_URL;
  }
  const s = serverDefaultLogoUrl?.trim();
  if (s) return s;
  return APP_PUBLIC_LOGO_URL;
}

export const PDF_REPORT_LOGO_URL = resolvePdfLogoUrl();

export function getR2PublicOriginForPreconnect(): string | null {
  const r2 = resolveActiveR2PublicBaseUrl();
  if (!r2) return null;
  try {
    return new URL(r2).origin;
  } catch {
    return null;
  }
}
