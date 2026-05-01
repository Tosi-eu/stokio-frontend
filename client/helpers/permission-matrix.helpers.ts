import type { LoggedUser } from "@/interfaces/interfaces";
import type {
  EffectivePermissionMatrixSerialized,
  MovementTipoKey,
  PermissionMatrixV2Stored,
  PermissionResourceKey,
  ResourceCrud,
} from "@/domain/permission-matrix.types";
import {
  MOVEMENT_TIPO_KEYS,
  PERMISSION_RESOURCE_KEYS,
} from "@/domain/permission-matrix.constants";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";

export function isPermissionBypassUser(user: LoggedUser | null): boolean {
  if (!user) return false;
  if (isSuperAdminUser(user)) return true;
  if (user.isTenantOwner || user.is_tenant_owner) return true;
  if (user.role === "admin") return true;
  return false;
}

export function canCrudFromMatrix(
  matrix: EffectivePermissionMatrixSerialized | null | undefined,
  resource: PermissionResourceKey,
  action: keyof ResourceCrud,
): boolean {
  if (!matrix?.resources?.[resource]) return false;
  return Boolean(matrix.resources[resource][action]);
}

export function canMovementTipoFromMatrix(
  matrix: EffectivePermissionMatrixSerialized | null | undefined,
  tipo: MovementTipoKey,
): boolean {
  // Movimentações são derivadas de operações de estoque; o controle fino por tipo
  // (entrada/saída/transferência) depende da permissão de criar no módulo de estoque.
  if (!matrix?.resources?.stock?.create) return false;
  return Boolean(matrix.movement_tipos?.[tipo]);
}

/** Utilizador sem matriz após migração: só leitura conservadora (evita mostrar UI que a API bloquearia). */
export function canReadModuleFromUser(
  user: LoggedUser | null,
  moduleKey: string,
): boolean {
  if (!user) return false;
  if (isPermissionBypassUser(user)) return true;
  const matrix = user.permissionMatrix;
  if (!matrix?.resources) return false;
  const rk = moduleKey as PermissionResourceKey;
  return canCrudFromMatrix(matrix, rk, "read");
}

export function expandFlatPermissionsToV2(
  flat: ResourceCrud,
): PermissionMatrixV2Stored {
  const resources: PermissionMatrixV2Stored["resources"] = {};
  for (const k of PERMISSION_RESOURCE_KEYS) {
    resources[k] = { ...flat };
  }
  const baseMove = flat.create;
  return {
    version: 2,
    resources,
    movement_tipos: {
      entrada: baseMove,
      saida: baseMove,
      transferencia: baseMove,
    },
  };
}

/** Converte a matriz efetiva serializada para payload v2 completo (persistência). */
export function effectiveMatrixToV2Stored(
  matrix: EffectivePermissionMatrixSerialized,
): PermissionMatrixV2Stored {
  return {
    version: 2,
    resources: { ...matrix.resources },
    movement_tipos: { ...matrix.movement_tipos },
  };
}

/** Matriz inicial para novo utilizador `user` (espelha o legado de 4 flags). */
export function defaultEffectiveMatrixFromFlat(
  flat: ResourceCrud,
): EffectivePermissionMatrixSerialized {
  const resources = {} as EffectivePermissionMatrixSerialized["resources"];
  for (const k of PERMISSION_RESOURCE_KEYS) {
    resources[k] = { ...flat };
  }
  const baseMove = flat.create;
  return {
    resources,
    movement_tipos: {
      entrada: baseMove,
      saida: baseMove,
      transferencia: baseMove,
    },
  };
}

export function cloneMatrixSerialized(
  matrix: EffectivePermissionMatrixSerialized,
): EffectivePermissionMatrixSerialized {
  const resources = {} as EffectivePermissionMatrixSerialized["resources"];
  for (const k of PERMISSION_RESOURCE_KEYS) {
    const r = matrix.resources[k];
    resources[k] = r
      ? { ...r }
      : { read: false, create: false, update: false, delete: false };
  }
  const movement_tipos =
    {} as EffectivePermissionMatrixSerialized["movement_tipos"];
  for (const t of MOVEMENT_TIPO_KEYS) {
    movement_tipos[t] = Boolean(matrix.movement_tipos[t]);
  }
  return { resources, movement_tipos };
}
