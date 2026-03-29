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

export type TenantModules = {
  enabled: string[];
};

export type TenantContextType = {
  tenantId: number | null;
  tenant: TenantConfigResponse["tenant"];
  modules: TenantModules | null;
  modulesConfigured: boolean;
  onboardingComplete: boolean;
  uiDisplay: TenantUiDisplay;
  loading: boolean;
  refetch: () => Promise<void>;
  isEnabled: (key: string) => boolean;
  effectiveEnabled: string[];
  setModulesPreview: (enabled: string[] | null) => void;
};

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
  const [uiDisplay, setUiDisplay] =
    useState<TenantUiDisplay>(DEFAULT_UI_DISPLAY);
  const [loading, setLoading] = useState(() => Boolean(user));

  const refetch = useCallback(async () => {
    if (!user) {
      setTenantId(null);
      setTenant(null);
      setModules(null);
      setModulesPreview(null);
      setModulesConfigured(false);
      setOnboardingComplete(false);
      setUiDisplay(DEFAULT_UI_DISPLAY);
      setLoading(false);
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
      setOnboardingComplete(Boolean(res.onboardingComplete));
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
      setUiDisplay(DEFAULT_UI_DISPLAY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const effectiveEnabled = useMemo(
    () => modulesPreview ?? modules?.enabled ?? [],
    [modulesPreview, modules],
  );

  const isEnabled = useCallback(
    (key: string) => effectiveEnabled.includes(key),
    [effectiveEnabled],
  );

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        tenant,
        modules,
        modulesConfigured,
        onboardingComplete,
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
