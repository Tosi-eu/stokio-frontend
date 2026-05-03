import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getTenantConfig, type TenantConfigResponse } from "@/api/requests";
import { useAuth } from "@/hooks/use-auth.hook";
import {
  DEFAULT_UI_DISPLAY,
  normalizeUiDisplay,
  type TenantUiDisplay,
} from "@/helpers/storage-location-display.helper";
import { setPreviewModeStorage } from "@/helpers/preview-mode-storage";
import { isPreviewUiModuleKey } from "@/helpers/tenant-modules-preview.helper";

export type TenantModules = {
  enabled: string[];
  automatic_price_search?: boolean;
  automatic_reposicao_notifications?: boolean;

  enabled_sectors?: string[];
};

export type TenantContextType = {
  tenantId: number | null;
  tenant: TenantConfigResponse["tenant"];
  modules: TenantModules | null;
  modulesConfigured: boolean;
  onboardingComplete: boolean;
  previewMode: boolean;
  uiDisplay: TenantUiDisplay;
  loading: boolean;
  refetch: () => Promise<void>;
  isEnabled: (key: string) => boolean;
  effectiveEnabled: string[];
  setModulesPreview: (enabled: string[] | null) => void;
};

const SKIP_ONBOARDING_EVENT = "abrigo:skip-onboarding-changed";

export function readSkipTenantOnboarding(tenantId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(`abrigo.skipOnboarding.${tenantId}`) === "1"
    );
  } catch {
    return false;
  }
}

function hasSkipTenantOnboardingPreference(tenantId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(`abrigo.skipOnboarding.${tenantId}`) !== null
    );
  } catch {
    return false;
  }
}

export function setSkipTenantOnboarding(tenantId: number, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    const k = `abrigo.skipOnboarding.${tenantId}`;
    if (value) window.localStorage.setItem(k, "1");
    else window.localStorage.removeItem(k);
    window.dispatchEvent(new Event(SKIP_ONBOARDING_EVENT));
  } catch {
    /* ignore */
  }
}

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined,
);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenant, setTenant] = useState<TenantConfigResponse["tenant"]>(null);
  const [modules, setModules] = useState<TenantModules | null>(null);
  const [modulesPreview, setModulesPreview] = useState<string[] | null>(null);
  const [modulesConfigured, setModulesConfigured] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [skipOnboarding, setSkipOnboarding] = useState(false);
  const [uiDisplay, setUiDisplay] =
    useState<TenantUiDisplay>(DEFAULT_UI_DISPLAY);
  const [loading, setLoading] = useState(() => Boolean(user));

  const previewMode = Boolean(
    tenantId != null && !onboardingComplete && skipOnboarding,
  );

  const refetch = useCallback(async () => {
    if (!user) {
      setTenantId(null);
      setTenant(null);
      setModules(null);
      setModulesPreview(null);
      setModulesConfigured(false);
      setOnboardingComplete(false);
      setSkipOnboarding(false);
      setUiDisplay(DEFAULT_UI_DISPLAY);
      setLoading(false);
      setPreviewModeStorage(false);
      return;
    }
    setLoading(true);
    try {
      setModulesPreview(null);
      const res = await getTenantConfig();
      setTenantId(Number(res.tenantId) || null);
      setTenant(res.tenant ?? null);
      setModules(res.modules ?? null);
      setModulesConfigured(Boolean(res.modulesConfigured));
      const onboardDone = Boolean(res.onboardingComplete);
      setOnboardingComplete(onboardDone);
      const tid = Number(res.tenantId) || null;
      if (onboardDone && tid != null) {
        setSkipTenantOnboarding(tid, false);
      } else if (
        !onboardDone &&
        tid != null &&
        res.tenant?.slug &&
        String(res.tenant.slug).startsWith("u-") &&
        !hasSkipTenantOnboardingPreference(tid)
      ) {
        setSkipTenantOnboarding(tid, true);

        setSkipOnboarding(true);
      }
      setUiDisplay(
        normalizeUiDisplay(
          (res as { uiDisplay?: Partial<TenantUiDisplay> }).uiDisplay,
        ),
      );
    } catch {
      setTenantId(null);
      setTenant(null);
      setModules(null);
      setModulesPreview(null);
      setModulesConfigured(false);
      setOnboardingComplete(false);
      setSkipOnboarding(false);
      setUiDisplay(DEFAULT_UI_DISPLAY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tenantId == null) {
      setSkipOnboarding(false);
      return;
    }
    const sync = () => setSkipOnboarding(readSkipTenantOnboarding(tenantId));
    sync();
    window.addEventListener(SKIP_ONBOARDING_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SKIP_ONBOARDING_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [tenantId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const effectiveEnabled = useMemo(
    () => modulesPreview ?? modules?.enabled ?? [],
    [modulesPreview, modules],
  );

  const isEnabled = useCallback(
    (key: string) => {
      if (previewMode && isPreviewUiModuleKey(key)) return true;
      return effectiveEnabled.includes(key);
    },
    [previewMode, effectiveEnabled],
  );

  useEffect(() => {
    setPreviewModeStorage(previewMode);
  }, [previewMode]);

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        tenant,
        modules,
        modulesConfigured,
        onboardingComplete,
        previewMode,
        uiDisplay,
        loading,
        refetch,
        isEnabled,
        effectiveEnabled,
        setModulesPreview,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
