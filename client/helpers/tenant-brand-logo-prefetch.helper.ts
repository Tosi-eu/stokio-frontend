import { fetchPublicAppConfig, getTenantConfig } from "@/api/requests";
import { mergePublicLogoWithServerDefault } from "@/constants/app-branding";
import { resolveTenantR2LogoUrl } from "@/helpers/tenant-r2-logo-url.helper";

/**
 * Teto enquanto o ecrã de login fica em loading — depois navega para /loading na mesma.
 * Objetivo: encher o cache HTTP do browser antes do primeiro paint do ecrã intermédio.
 */
const BRAND_LOGO_PREFETCH_BEFORE_INICIO_MAX_MS = 25_000;

/** Pré-carrega o bitmap (mesma semântica que `<img referrerPolicy="no-referrer">`). */
export function preloadBrandLogoImageUrl(src: string): Promise<void> {
  if (!src.trim()) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Chamar após login bem-sucedido e **antes** de `navigate("/loading")`.
 * Resolve a URL final (tenant ou fallback), faz GET da imagem para cache, e só então o ecrã seguinte
 * mostra o logo sem “buraco” — nas visitas seguintes o browser já tem o recurso (TTL do HTTP).
 */
export async function prefetchTenantBrandLogoBeforeInicioNavigation(): Promise<void> {
  try {
    const [cfgRes, appCfg] = await Promise.all([
      getTenantConfig(),
      fetchPublicAppConfig().catch(() => null as { defaultLogoUrl?: string | null }),
    ]);
    const tenant = cfgRes.tenant ?? null;
    const serverDefault = appCfg?.defaultLogoUrl?.trim() || null;
    const publicDefault = mergePublicLogoWithServerDefault(serverDefault);

    const resolved = await resolveTenantR2LogoUrl({
      viteR2PublicBaseUrl: import.meta.env.VITE_R2_PUBLIC_BASE_URL,
      logoUrlFromApi: tenant?.logoUrl,
      slug: tenant?.slug,
      brandName: tenant?.brandName,
      name: tenant?.name,
      isCancelled: () => false,
    });
    const finalSrc = resolved ?? publicDefault;

    await Promise.race([
      preloadBrandLogoImageUrl(finalSrc),
      new Promise<void>((r) =>
        window.setTimeout(r, BRAND_LOGO_PREFETCH_BEFORE_INICIO_MAX_MS),
      ),
    ]);
  } catch {
    /* best-effort: /loading ainda tem o hook + fallback */
  }
}
