import { API_BASE_URL } from "@/api/canonical";
import { normalizeViteR2PublicBaseUrl } from "@/constants/app-branding";

/** Logo via API (same bucket no R2, mas sem expor `*.r2.dev` no `<img>` do browser). */
export function buildTenantLogoProxyUrl(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s) return "";
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!base) return "";
  return `${base}/public/tenants/${encodeURIComponent(s)}/logo`;
}

export function appendLogoCacheBust(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return u;
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}v=${Date.now()}`;
}

export function appendLogoRevision(
  url: string,
  revision: string | number | null | undefined,
): string {
  const u = String(url ?? "").trim();
  if (!u) return u;
  if (revision == null || revision === "") return u;
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}rev=${encodeURIComponent(String(revision))}`;
}

export function normalizeBrandNameForR2Key(raw: string): string {
  const s = String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return s || "logo";
}

export function normalizeSlugForR2Key(raw: string): string {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "tenant";
}

const LOGO_EXT_CANDIDATES = ["png", "webp", "jpg", "gif"] as const;

export function buildTenantLogoCandidateUrls(
  r2PublicBase: string,
  params: { slug: string; brandLabel: string },
): string[] {
  const base = r2PublicBase.replace(/\/$/, "");
  const brandSeg = normalizeBrandNameForR2Key(params.brandLabel);
  const slugSeg = normalizeSlugForR2Key(params.slug);
  const keyStem = `${brandSeg}-${slugSeg}`;
  return LOGO_EXT_CANDIDATES.map((ext) => `${base}/${keyStem}.${ext}`);
}

function tryLoadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export async function probeFirstResolvableTenantLogoUrl(
  urls: string[],
  isCancelled: () => boolean,
): Promise<string | null> {
  if (urls.length === 0) return null;
  return new Promise((resolve) => {
    let settled = false;
    let remaining = urls.length;
    const doneOne = () => {
      if (settled) return;
      remaining -= 1;
      if (remaining === 0) resolve(null);
    };
    for (const url of urls) {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        if (isCancelled() || settled) return;
        settled = true;
        resolve(url);
      };
      img.onerror = () => {
        if (isCancelled() || settled) return;
        doneOne();
      };
      img.src = url;
    }
  });
}

export async function resolveTenantR2LogoUrl(params: {
  viteR2PublicBaseUrl: string | undefined;
  logoUrlFromApi: string | null | undefined;
  slug: string | null | undefined;
  brandName: string | null | undefined;
  name: string | null | undefined;
  brandingUpdatedAt?: string | null;
  isCancelled: () => boolean;
}): Promise<string | null> {
  const slug = params.slug?.trim();
  const trimmedApi = params.logoUrlFromApi?.trim() || null;
  const rev = params.brandingUpdatedAt ?? null;

  if (slug && trimmedApi) {
    const proxyBase = buildTenantLogoProxyUrl(slug);
    if (proxyBase) {
      const proxyUrl = appendLogoRevision(proxyBase, rev);
      const okProxy = await tryLoadImage(proxyUrl);
      if (params.isCancelled()) return null;
      if (okProxy) return proxyUrl;
    }
  }

  if (trimmedApi) {
    const apiUrl = appendLogoRevision(trimmedApi, rev);
    const ok = await tryLoadImage(apiUrl);
    if (params.isCancelled()) return null;
    if (ok) return apiUrl;
  }

  const base = normalizeViteR2PublicBaseUrl(params.viteR2PublicBaseUrl);
  const brandLabel = params.brandName?.trim() || params.name?.trim() || "logo";
  if (!base || !slug) return null;

  const candidates = buildTenantLogoCandidateUrls(base, {
    slug,
    brandLabel,
  }).map((u) => appendLogoRevision(u, rev));
  return probeFirstResolvableTenantLogoUrl(candidates, params.isCancelled);
}
