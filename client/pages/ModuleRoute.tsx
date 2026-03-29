import { useTenant } from "@/hooks/use-tenant.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import { Navigate, useLocation } from "react-router-dom";

export default function ModuleRoute({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: JSX.Element;
}) {
  const { loading, isEnabled } = useTenant();
  const { user } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!isEnabled(moduleKey)) {
    const fallback = getDefaultHomePath(isEnabled, user);
    if (!fallback || fallback === location.pathname) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-muted-foreground text-sm max-w-md mx-auto">
          Nenhum módulo habilitado está disponível para a sua conta. Peça ao
          administrador do abrigo para rever os módulos ativos.
        </div>
      );
    }
    return <Navigate to={fallback} replace />;
  }
  return children;
}
