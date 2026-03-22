/** Base pública do bucket (sem path do ficheiro). Corrige .env com `.../default_logo.png` por engano. */
function normalizeViteR2PublicBaseUrl(raw: string | undefined): string | null {
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

function r2DefaultLogoUrl(): string | null {
  const r2 = normalizeViteR2PublicBaseUrl(import.meta.env.VITE_R2_PUBLIC_BASE_URL);
  if (!r2) return null;
  return `${r2}/default_logo.png`;
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function resolvePublicLogoUrl(): string {
  const explicit = import.meta.env.VITE_PUBLIC_APP_LOGO_URL?.trim();
  if (explicit && isAbsoluteHttpUrl(explicit)) return explicit;

  const r2Logo = r2DefaultLogoUrl();
  if (r2Logo) {
    if (!explicit || explicit === "/default_logo.png") return r2Logo;
    return explicit;
  }

  if (explicit) return explicit;
  return "/default_logo.png";
}

function resolvePdfLogoUrl(): string {
  const pdf = import.meta.env.VITE_LOGO_URL?.trim();
  if (pdf && isAbsoluteHttpUrl(pdf)) return pdf;

  const r2Logo = r2DefaultLogoUrl();
  if (r2Logo) {
    if (!pdf || pdf === "/default_logo.png") return r2Logo;
    return pdf;
  }

  if (pdf) return pdf;
  return resolvePublicLogoUrl();
}

export const APP_PUBLIC_NAME =
  import.meta.env.VITE_PUBLIC_APP_NAME ??
  "Porto - Gestão Inteligente de Abrigos";

export const APP_PUBLIC_LOGO_URL = resolvePublicLogoUrl();

export const PDF_REPORT_LOGO_URL = resolvePdfLogoUrl();

export function getR2PublicOriginForPreconnect(): string | null {
  const r2 = normalizeViteR2PublicBaseUrl(import.meta.env.VITE_R2_PUBLIC_BASE_URL);
  if (!r2) return null;
  try {
    return new URL(r2).origin;
  } catch {
    return null;
  }
}
