import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { AuthContextType, LoggedUser } from "@/interfaces/interfaces";
import { login as apiLogin, logoutRequest } from "@/api/requests";
import { cleanupSessionTimeout } from "@/helpers/session-timeout.helper";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import { authStorage } from "@/helpers/auth.helper";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

function normalizeSessionUser(raw: LoggedUser | null): LoggedUser | null {
  if (!raw || typeof raw.id !== "number") return null;
  return {
    ...raw,
    isSuperAdmin: isSuperAdminUser(raw),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LoggedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      cleanupSessionTimeout();
    }
  }, []);

  useEffect(() => {
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
        console.error("Erro ao restaurar sessão:", error);
        sessionStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);

    return () => {
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
    () => ({ user, login, logout }),
    [user, login, logout],
  );

  if (loading) return null;

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};
