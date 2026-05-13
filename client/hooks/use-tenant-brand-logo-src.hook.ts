import { useEffect, useRef, useState } from "react";
import { usePublicDefaultLogoUrl } from "@/hooks/use-public-default-logo.hook";
import { resolveTenantR2LogoUrl } from "@/helpers/tenant-r2-logo-url.helper";
import { preloadBrandLogoImageUrl } from "@/helpers/tenant-brand-logo-prefetch.helper";

const DEFAULT_LOGO_PRELOAD_TIMEOUT_MS = 1000;

let tenantLogoDisplayCache: { key: string; src: string } | null = null;

function buildTenantLogoDisplayCacheKey(
  tenant: TenantBrandLogoInput,
  publicDefaultLogo: string,
): string {
  if (!tenant?.id) return `no-tenant::${publicDefaultLogo}`;
  return [
    tenant.id,
    tenant.slug ?? "",
    tenant.logoUrl ?? "",
    tenant.brandingUpdatedAt ?? "",
    tenant.brandName ?? "",
    tenant.name ?? "",
    publicDefaultLogo,
  ].join("::");
}

export type TenantBrandLogoInput = {
  id?: number;
  logoUrl?: string | null;
  slug?: string | null;
  brandName?: string | null;
  name?: string | null;
  brandingUpdatedAt?: string | null;
} | null;

export type UseTenantBrandLogoSrcOptions = {
  tenantConfigLoading?: boolean;
  logoPreloadTimeoutMs?: number;
};

export function useTenantBrandLogoSrc(
  tenant: TenantBrandLogoInput,
  options?: UseTenantBrandLogoSrcOptions,
): { displaySrc: string | null; isLogoResolved: boolean } {
  const publicDefaultLogo = usePublicDefaultLogoUrl();
  const tenantConfigLoading = options?.tenantConfigLoading ?? false;
  const logoPreloadTimeoutMs =
    options?.logoPreloadTimeoutMs ?? DEFAULT_LOGO_PRELOAD_TIMEOUT_MS;

  const cacheKey = buildTenantLogoDisplayCacheKey(tenant, publicDefaultLogo);

  const [readyDisplaySrc, setReadyDisplaySrc] = useState<string | undefined>(
    () =>
      tenantLogoDisplayCache?.key === cacheKey
        ? tenantLogoDisplayCache.src
        : undefined,
  );

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (tenantConfigLoading) return;

    if (tenantLogoDisplayCache?.key === cacheKey) {
      return;
    }

    const requestId = ++requestIdRef.current;

    let cancelled = false;
    let preloadTimeoutId: number | undefined;

    const isCancelled = () => cancelled || requestId !== requestIdRef.current;

    void (async () => {
      const resolved = await resolveTenantR2LogoUrl({
        r2PublicBaseUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,
        logoUrlFromApi: tenant?.logoUrl,
        slug: tenant?.slug,
        brandName: tenant?.brandName,
        name: tenant?.name,
        brandingUpdatedAt: tenant?.brandingUpdatedAt,
        isCancelled,
      });

      if (isCancelled()) return;

      const finalSrc = resolved ?? publicDefaultLogo;

      const timeoutPromise = new Promise<void>((resolve) => {
        preloadTimeoutId = window.setTimeout(resolve, logoPreloadTimeoutMs);
      });

      await Promise.race([preloadBrandLogoImageUrl(finalSrc), timeoutPromise]);

      if (preloadTimeoutId !== undefined) {
        clearTimeout(preloadTimeoutId);
      }

      if (isCancelled()) return;

      tenantLogoDisplayCache = { key: cacheKey, src: finalSrc };
      setReadyDisplaySrc(finalSrc);
    })();

    return () => {
      cancelled = true;
      if (preloadTimeoutId !== undefined) clearTimeout(preloadTimeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver cacheKey
  }, [tenantConfigLoading, logoPreloadTimeoutMs, cacheKey]);

  const isLogoResolved = !tenantConfigLoading && readyDisplaySrc !== undefined;

  const displaySrc = isLogoResolved ? readyDisplaySrc! : null;

  return { displaySrc, isLogoResolved };
}
