import { fetchPublicAppConfig, getTenantConfig } from "@/api/requests";
import { mergePublicLogoWithServerDefault } from "@/constants/app-branding";
import { resolveTenantR2LogoUrl } from "@/helpers/tenant-r2-logo-url.helper";

const BRAND_LOGO_PREFETCH_BEFORE_INICIO_MAX_MS = 25_000;

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

export async function prefetchTenantBrandLogoBeforeInicioNavigation(): Promise<void> {
  try {
    const [cfgRes, appCfg] = await Promise.all([
      getTenantConfig(),
      fetchPublicAppConfig().catch(
        () => null as { defaultLogoUrl?: string | null },
      ),
    ]);
    const tenant = cfgRes.tenant ?? null;
    const serverDefault = appCfg?.defaultLogoUrl?.trim() || null;
    const publicDefault = mergePublicLogoWithServerDefault(serverDefault);

    const resolved = await resolveTenantR2LogoUrl({
      r2PublicBaseUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,
      logoUrlFromApi: tenant?.logoUrl,
      slug: tenant?.slug,
      brandName: tenant?.brandName,
      name: tenant?.name,
      brandingUpdatedAt: tenant?.brandingUpdatedAt,
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
    /* ignore */
  }
}
