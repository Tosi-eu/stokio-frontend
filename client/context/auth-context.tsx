import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AuthContextType, LoggedUser } from "@/interfaces/interfaces";
import { login as apiLogin, logoutRequest } from "@/api/requests";
import { cleanupSessionTimeout } from "@/helpers/session-timeout.helper";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

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
        const userToSet =
          parsed && typeof parsed === "object" && "user" in parsed
            ? (parsed.user ?? null)
            : (parsed as LoggedUser);
        setUser(userToSet && userToSet.id ? userToSet : null);
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

  const login = async (login: string, password: string, tenantSlug: string) => {
    const data = await apiLogin(login, password, tenantSlug);

    /** API retorna { user: { id, login, tenantId, ... } } — precisamos do objeto interno. */
    const response = data as { user?: LoggedUser };
    const loggedUser = response.user ?? (data as LoggedUser);

    setUser(loggedUser);

    sessionStorage.setItem("user", JSON.stringify(loggedUser));
  };

  const logout = async () => {
    await handleLogout();
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
