"use client";

import { useTenant } from "@/hooks/use-tenant.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import type { PermissionResourceKey } from "@/domain/permission-matrix.types";
import { getDefaultHomePath } from "@/helpers/default-home-route.helper";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Blocks } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ModuleRoute({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: JSX.Element;
}) {
  const { loading, isEnabled, previewMode } = useTenant();
  const { user } = useAuth();
  const { can } = usePermissionMatrix();
  const pathname = usePathname();
  const router = useRouter();

  const moduleOk = useMemo(
    () =>
      loading
        ? true
        : isEnabled(moduleKey) &&
          can(moduleKey as PermissionResourceKey, "read"),
    [loading, isEnabled, moduleKey, can],
  );

  const fallback = useMemo(
    () =>
      !loading
        ? getDefaultHomePath(
            isEnabled,
            user,
            (m) => can(m as PermissionResourceKey, "read"),
            previewMode,
          )
        : null,
    [loading, isEnabled, user, can, previewMode],
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
        <div className="min-h-[50vh] flex items-center justify-center p-6 sm:p-10">
          <Card className="max-w-md w-full border-dashed">
            <CardHeader className="text-center space-y-3 pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Blocks className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="font-display text-xl">
                Seu acesso ainda não está pronto
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Parece que este abrigo ainda não liberou nenhuma área para a sua
                conta. Fale com o responsável pelo abrigo para liberar o acesso.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
    return null;
  }

  return children;
}
