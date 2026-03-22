import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getTenantConfig, type TenantConfigResponse } from "@/api/requests";
import { useAuth } from "@/hooks/use-auth.hook";

export type TenantModules = {
  enabled: string[];
};

export type TenantContextType = {
  tenantId: number | null;
  tenant: TenantConfigResponse["tenant"];
  modules: TenantModules | null;
  modulesConfigured: boolean;
  onboardingComplete: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
  isEnabled: (key: string) => boolean;
};

export const TenantContext = createContext<TenantContextType | undefined>(
  undefined,
);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenant, setTenant] = useState<TenantConfigResponse["tenant"]>(null);
  const [modules, setModules] = useState<TenantModules | null>(null);
  const [modulesConfigured, setModulesConfigured] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(user));

  const refetch = useCallback(async () => {
    if (!user) {
      setTenantId(null);
      setTenant(null);
      setModules(null);
      setModulesConfigured(false);
      setOnboardingComplete(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getTenantConfig();
      setTenantId(Number(res.tenantId) || null);
      setTenant(res.tenant ?? null);
      setModules(res.modules ?? null);
      setModulesConfigured(Boolean(res.modulesConfigured));
      setOnboardingComplete(Boolean(res.onboardingComplete));
    } catch {
      setTenantId(null);
      setTenant(null);
      setModules(null);
      setModulesConfigured(false);
      setOnboardingComplete(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const isEnabled = useCallback(
    (key: string) => Boolean(modules?.enabled?.includes(key)),
    [modules],
  );

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        tenant,
        modules,
        modulesConfigured,
        onboardingComplete,
        loading,
        refetch,
        isEnabled,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}
