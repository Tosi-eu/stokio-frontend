import { useEffect, useState } from "react";
import { fetchPublicAppConfig } from "@/api/requests";
import { mergePublicLogoWithServerDefault } from "@/constants/app-branding";

/**
 * Logo público padrão: mescla `GET /public/app-config` (R2 no backend) com env Vite.
 */
export function usePublicDefaultLogoUrl(): string {
  const [serverDefaultLogoUrl, setServerDefaultLogoUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchPublicAppConfig();
        const url = cfg?.defaultLogoUrl?.trim() || null;
        if (!cancelled && url) setServerDefaultLogoUrl(url);
      } catch {
        /* fallback em mergePublicLogoWithServerDefault */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return mergePublicLogoWithServerDefault(serverDefaultLogoUrl);
}
