import { useEffect, useState } from "react";
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
  /**
   * Enquanto true (ex.: `useTenant().loading`), não resolve nem mostra o logo padrão da app —
   * evita flash do default antes do tenant estar disponível.
   */
  tenantConfigLoading?: boolean;
  /** Máx. tempo a aguardar o bitmap antes de mostrar `<img>` mesmo assim (fallback rápido). */
  logoPreloadTimeoutMs?: number;
};

/**
 * Só marca `isLogoResolved` depois de resolver a URL e (tentar) pré-carregar a imagem,
 * com timeout — evita logo default a piscar e evita um segundo spinner só no slot do logo.
 * Enquanto pendente, o UI deve deixar o espaço vazio (já existe loading global onde fizer sentido).
 */
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

  useEffect(() => {
    let cancelled = false;
    /** DOM timers return `number` (Node typings use `NodeJS.Timeout`). */
    let preloadTimeoutId: number | undefined;

    if (tenantConfigLoading) {
      setReadyDisplaySrc(undefined);
      return () => {
        cancelled = true;
      };
    }

    const isCancelled = () => cancelled;
    setReadyDisplaySrc(undefined);

    void (async () => {
      const resolved = await resolveTenantR2LogoUrl({
        viteR2PublicBaseUrl: import.meta.env.VITE_R2_PUBLIC_BASE_URL,
        logoUrlFromApi: tenant?.logoUrl,
        slug: tenant?.slug,
        brandName: tenant?.brandName,
        name: tenant?.name,
        isCancelled,
      });
      if (cancelled) return;

      const finalSrc = resolved ?? publicDefaultLogo;

      const timeoutPromise = new Promise<void>((resolve) => {
        preloadTimeoutId = window.setTimeout(resolve, logoPreloadTimeoutMs);
      });

      await Promise.race([preloadBrandLogoImageUrl(finalSrc), timeoutPromise]);

      if (preloadTimeoutId !== undefined) {
        clearTimeout(preloadTimeoutId);
        preloadTimeoutId = undefined;
      }
      if (cancelled) return;
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

  const isLogoResolved = readyDisplaySrc !== undefined;
  const displaySrc = isLogoResolved ? readyDisplaySrc! : null;

  return { displaySrc, isLogoResolved };
}
