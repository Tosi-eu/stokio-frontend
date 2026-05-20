import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { AuthContextType, LoggedUser } from "@/interfaces/interfaces";
import {
  getCurrentUser,
  listAccessibleTenants,
  login as apiLogin,
  logoutRequest,
} from "@/api/requests";
import { cleanupSessionTimeout } from "@/helpers/session-timeout.helper";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import { setPreviewModeStorage } from "@/helpers/preview-mode-storage";
import {
  clearActiveTenantSlug,
  readActiveTenantSlug,
  writeActiveTenantSlug,
} from "@/helpers/active-tenant-slug.helper";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

function normalizeSessionUser(raw: LoggedUser | null): LoggedUser | null {
  if (!raw || typeof raw.id !== "number") return null;
  const first = raw.firstName ?? raw.first_name;
  const last = raw.lastName ?? raw.last_name;
  return {
    ...raw,
    first_name: first,
    last_name: last,
    firstName: raw.firstName ?? first,
    lastName: raw.lastName ?? last,
    isSuperAdmin: isSuperAdminUser(raw),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const patchStoredUser = useCallback((partial: Partial<LoggedUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial };
      return normalizeSessionUser(merged);
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      clearActiveTenantSlug();
      setPreviewModeStorage(false);
      cleanupSessionTimeout();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const fresh = await getCurrentUser();
        if (cancelled) return;
        if (fresh && typeof fresh.id === "number") {
          if (!readActiveTenantSlug()) {
            try {
              const acc = await listAccessibleTenants();
              const rows = acc?.tenants ?? [];
              const primary = rows.find((t) => t.isPrimary);
              const pick = primary ?? rows[0];
              const s = pick?.slug?.trim();
              if (s) writeActiveTenantSlug(s);
            } catch {
              void 0;
            }
          }
          setUser(normalizeSessionUser(fresh as LoggedUser));
          return;
        }
      } catch {
        if (cancelled) return;
      }
      setUser(null);
    }

    void hydrateSession().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      cleanupSessionTimeout();
    };
  }, []);

  const login = useCallback(
    async (loginStr: string, password: string, tenantSlug: string) => {
      const data = await apiLogin(loginStr, password, tenantSlug);

      const response = data as { user?: LoggedUser };
      const loggedUser = response.user ?? (data as LoggedUser);
      const normalized = normalizeSessionUser(loggedUser);

      const slug = tenantSlug.trim();
      if (slug) {
        writeActiveTenantSlug(slug);
      }

      setUser(normalized);
    },
    [],
  );

  const logout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

  const authValue = useMemo(
    () => ({ user, login, logout, patchStoredUser }),
    [user, login, logout, patchStoredUser],
  );

  if (loading) return null;

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};
