import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth.hook";
import { Navigate, Outlet } from "react-router-dom";

interface PrivateRouteProps {
  children?: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/user/login" replace />;
  }

  if (children != null) {
    return <>{children}</>;
  }

  return <Outlet />;
}
