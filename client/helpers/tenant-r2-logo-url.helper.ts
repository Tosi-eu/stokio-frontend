import { API_BASE_URL } from "@/api/canonical";
import { normalizeR2PublicBaseUrl } from "@/constants/app-branding";

export function buildTenantLogoProxyUrl(slug: string): string {
  const s = String(slug ?? "").trim();
  if (!s) return "";
  const path = `/api/v1/public/tenants/${encodeURIComponent(s)}/logo`;
  if (typeof window !== "undefined") {
    return path;
  }
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

export function tenantLogoStemForR2(brandLabel: string, slug: string): string {
  const brandSeg = normalizeBrandNameForR2Key(brandLabel);
  const slugSeg = normalizeSlugForR2Key(slug);
  return `${brandSeg}-${slugSeg}`;
}

export function stripLogoUrlQueryAndHash(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return u;
  try {
    const parsed = new URL(u);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    const q = u.indexOf("?");
    const h = u.indexOf("#");
    const end = q === -1 ? (h === -1 ? u.length : h) : q;
    return u.slice(0, end);
  }
}

export function isUrlOnR2PublicBase(
  url: string,
  r2PublicBase: string | null | undefined,
): boolean {
  const base = normalizeR2PublicBaseUrl(r2PublicBase);
  if (!base) return false;
  const clean = stripLogoUrlQueryAndHash(url);
  const normalizedBase = base.replace(/\/$/, "");
  return clean === normalizedBase || clean.startsWith(`${normalizedBase}/`);
}

export function buildTenantLogoCandidateUrls(
  r2PublicBase: string,
  params: { slug: string; brandLabel: string },
): string[] {
  const base = r2PublicBase.replace(/\/$/, "");
  const slugSeg = normalizeSlugForR2Key(params.slug);
  const stem = tenantLogoStemForR2(params.brandLabel, params.slug);
  return [`${base}/${stem}.png`, `${base}/${slugSeg}/${stem}.png`];
}

function uniqueLogoProbeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const u = String(url ?? "").trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
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
  for (const url of urls) {
    if (isCancelled()) return null;
    const ok = await tryLoadImage(url);
    if (ok) return url;
  }
  return null;
}

export async function resolveTenantR2LogoUrl(params: {
  r2PublicBaseUrl: string | undefined;
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
  const base = normalizeR2PublicBaseUrl(params.r2PublicBaseUrl);
  const brandLabel = params.brandName?.trim() || params.name?.trim() || "logo";

  const probeUrls: string[] = [];

  if (slug) {
    const proxyBase = buildTenantLogoProxyUrl(slug);
    if (proxyBase) {
      probeUrls.push(appendLogoRevision(proxyBase, rev));
    }
  }

  if (base && slug) {
    probeUrls.push(
      ...buildTenantLogoCandidateUrls(base, { slug, brandLabel }).map((u) =>
        appendLogoRevision(u, rev),
      ),
    );
  }

  if (
    trimmedApi &&
    !isUrlOnR2PublicBase(trimmedApi, base) &&
    /^https:\/\//i.test(stripLogoUrlQueryAndHash(trimmedApi))
  ) {
    probeUrls.push(
      appendLogoRevision(stripLogoUrlQueryAndHash(trimmedApi), rev),
    );
  }

  const fromProbes = await probeFirstResolvableTenantLogoUrl(
    uniqueLogoProbeUrls(probeUrls),
    params.isCancelled,
  );
  if (params.isCancelled()) return null;
  return fromProbes;
}
