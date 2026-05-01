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
  login as apiLogin,
  logoutRequest,
} from "@/api/requests";
import { cleanupSessionTimeout } from "@/helpers/session-timeout.helper";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import { authStorage } from "@/helpers/auth.helper";
import { setPreviewModeStorage } from "@/helpers/preview-mode-storage";

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
      const next = normalizeSessionUser(merged);
      if (next) {
        try {
          sessionStorage.setItem("user", JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      setPreviewModeStorage(false);
      cleanupSessionTimeout();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const token = authStorage.getToken();
      if (token) {
        try {
          const fresh = await getCurrentUser();
          if (cancelled) return;
          if (fresh && typeof fresh.id === "number") {
            const next = normalizeSessionUser(fresh as LoggedUser);
            setUser(next);
            if (next) {
              try {
                sessionStorage.setItem("user", JSON.stringify(next));
              } catch {
                /* ignore */
              }
            }
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }

      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as
            | LoggedUser
            | { user?: LoggedUser };
          const raw =
            parsed && typeof parsed === "object" && "user" in parsed
              ? (parsed.user ?? null)
              : (parsed as LoggedUser);
          setUser(
            normalizeSessionUser(raw && raw.id ? (raw as LoggedUser) : null),
          );
        } catch (error) {
          console.error("Failed to restore session:", error);
          sessionStorage.removeItem("user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    void hydrateSession().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      cleanupSessionTimeout();
    };
  }, [handleLogout]);

  const login = useCallback(
    async (loginStr: string, password: string, tenantSlug: string) => {
      const data = await apiLogin(loginStr, password, tenantSlug);

      const response = data as { user?: LoggedUser; token?: string };
      const loggedUser = response.user ?? (data as LoggedUser);
      const normalized = normalizeSessionUser(loggedUser);

      setUser(normalized);

      sessionStorage.setItem("user", JSON.stringify(normalized));
      if (response.token && typeof response.token === "string") {
        authStorage.setToken(response.token);
      }
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
