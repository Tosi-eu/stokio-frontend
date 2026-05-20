import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth.hook";
import type {
  MovementTipoKey,
  PermissionResourceKey,
  ResourceCrud,
} from "@/domain/permission-matrix.types";
import {
  canCrudFromMatrix,
  canMovementTipoFromMatrix,
  isPermissionBypassUser,
  resolveUserPermissionMatrix,
} from "@/helpers/permission-matrix.helpers";

export function usePermissionMatrix() {
  const { user } = useAuth();
  const bypass = useMemo(() => isPermissionBypassUser(user), [user]);
  const matrix = useMemo(() => resolveUserPermissionMatrix(user), [user]);

  return useMemo(
    () => ({
      bypass,
      matrix,
      can: (resource: PermissionResourceKey, action: keyof ResourceCrud) => {
        if (bypass) return true;
        return canCrudFromMatrix(matrix, resource, action);
      },
      canMovementTipo: (tipo: MovementTipoKey) => {
        if (bypass) return true;
        return canMovementTipoFromMatrix(matrix, tipo);
      },
    }),
    [bypass, matrix],
  );
}
