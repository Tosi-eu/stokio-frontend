import { useEffect, useState } from "react";
import { fetchPublicAppConfig } from "@/api/requests";
import { mergePublicLogoWithServerDefault } from "@/constants/app-branding";

export function usePublicDefaultLogoUrl(): string {
  const [serverDefaultLogoUrl, setServerDefaultLogoUrl] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await fetchPublicAppConfig();
        const url = cfg?.defaultLogoUrl?.trim() || null;
        if (!cancelled && url) setServerDefaultLogoUrl(url);
      } catch {
        void 0;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return mergePublicLogoWithServerDefault(serverDefaultLogoUrl);
}
