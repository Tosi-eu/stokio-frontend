import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AuthContextType, LoggedUser } from "@/interfaces/interfaces";
import { login as apiLogin, logoutRequest } from "@/api/requests";
import {
  initSessionTimeout,
  cleanupSessionTimeout,
  resetInactivityTimer,
} from "@/helpers/session-timeout.helper";

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
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Session timeout disabled - no automatic logout
        // initSessionTimeout(
        //   () => {
        //     handleLogout();
        //   },
        //   () => {
        //     console.warn("Sua sessão expirará em breve por inatividade");
        //   },
        // );
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

  const login = async (login: string, password: string) => {
    const data = await apiLogin(login, password);

    const loggedUser = data.user;

    setUser(loggedUser);

    sessionStorage.setItem("user", JSON.stringify(loggedUser));

    // Session timeout disabled - no automatic logout
    // initSessionTimeout(
    //   () => {
    //     handleLogout();
    //   },
    //   () => {
    //     console.warn("Sua sessão expirará em breve por inatividade");
    //   },
    // );
  };

  const logout = async () => {
    await handleLogout();
  };

  // Session timeout disabled - no automatic logout
  // useEffect(() => {
  //   if (user) {
  //     resetInactivityTimer();
  //   }
  // }, [user]);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
