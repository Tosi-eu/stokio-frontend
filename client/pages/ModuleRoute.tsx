"use client";

import { useTenant } from "@/hooks/use-tenant.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function ModuleRoute({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: JSX.Element;
}) {
  const { loading, isEnabled } = useTenant();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const moduleOk = useMemo(
    () => (loading ? true : isEnabled(moduleKey)),
    [loading, isEnabled, moduleKey],
  );

  const fallback = useMemo(
    () => (!loading ? getDefaultHomePath(isEnabled, user) : null),
    [loading, isEnabled, user],
  );

  useEffect(() => {
    if (loading || moduleOk) return;
    if (!fallback || fallback === pathname) return;
    router.replace(fallback);
  }, [loading, moduleOk, fallback, pathname, router]);

  if (loading) return null;

  if (!moduleOk) {
    if (!fallback || fallback === pathname) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8 text-center text-muted-foreground text-sm max-w-md mx-auto">
          Nenhum módulo habilitado está disponível para a sua conta. Peça ao
          administrador do abrigo para rever os módulos ativos.
        </div>
      );
    }
    return null;
  }

  return children;
}
