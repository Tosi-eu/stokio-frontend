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
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) {
      setTenantId(null);
      setTenant(null);
      setModules(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getTenantConfig();
      setTenantId(Number(res.tenantId) || null);
      setTenant(res.tenant ?? null);
      setModules(res.modules ?? null);
    } catch {
      setTenantId(null);
      setTenant(null);
      setModules(null);
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
      value={{ tenantId, tenant, modules, loading, refetch, isEnabled }}
    >
      {children}
    </TenantContext.Provider>
  );
}

