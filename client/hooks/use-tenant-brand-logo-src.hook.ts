import { useEffect, useRef, useState } from "react";
import { usePublicDefaultLogoUrl } from "@/hooks/use-public-default-logo.hook";
import { resolveTenantR2LogoUrl } from "@/helpers/tenant-r2-logo-url.helper";
import { preloadBrandLogoImageUrl } from "@/helpers/tenant-brand-logo-prefetch.helper";

const DEFAULT_LOGO_PRELOAD_TIMEOUT_MS = 1000;

export type TenantBrandLogoInput = {
  logoUrl?: string | null;
  slug?: string | null;
  brandName?: string | null;
  name?: string | null;
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

  const [readyDisplaySrc, setReadyDisplaySrc] = useState<string | undefined>(
    undefined,
  );

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (tenantConfigLoading) return;

    const requestId = ++requestIdRef.current;

    let cancelled = false;
    let preloadTimeoutId: number | undefined;

    const isCancelled = () =>
      cancelled || requestId !== requestIdRef.current;

    void (async () => {
      const resolved = await resolveTenantR2LogoUrl({
        viteR2PublicBaseUrl: import.meta.env.VITE_R2_PUBLIC_BASE_URL,
        logoUrlFromApi: tenant?.logoUrl,
        slug: tenant?.slug,
        brandName: tenant?.brandName,
        name: tenant?.name,
        isCancelled,
      });

      if (isCancelled()) return;

      const finalSrc = resolved ?? publicDefaultLogo;

      const timeoutPromise = new Promise<void>((resolve) => {
        preloadTimeoutId = window.setTimeout(resolve, logoPreloadTimeoutMs);
      });

      await Promise.race([
        preloadBrandLogoImageUrl(finalSrc),
        timeoutPromise,
      ]);

      if (preloadTimeoutId !== undefined) {
        clearTimeout(preloadTimeoutId);
      }

      if (isCancelled()) return;

      setReadyDisplaySrc(finalSrc);
    })();

    return () => {
      cancelled = true;
      if (preloadTimeoutId !== undefined) clearTimeout(preloadTimeoutId);
    };
  }, [
    tenantConfigLoading,
    logoPreloadTimeoutMs,
    publicDefaultLogo,
    tenant?.logoUrl,
    tenant?.slug,
    tenant?.brandName,
    tenant?.name,
  ]);

  const isLogoResolved =
    !tenantConfigLoading && readyDisplaySrc !== undefined;

  const displaySrc = isLogoResolved ? readyDisplaySrc! : null;

  return { displaySrc, isLogoResolved };
}