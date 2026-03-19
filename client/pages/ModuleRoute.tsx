import { useTenant } from "@/hooks/use-tenant.hook";
import { Navigate } from "react-router-dom";

export default function ModuleRoute({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: JSX.Element;
}) {
  const { loading, isEnabled } = useTenant();

  if (loading) return null;
  if (!isEnabled(moduleKey)) return <Navigate to="/dashboard" replace />;
  return children;
}
