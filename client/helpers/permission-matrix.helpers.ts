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

const DENY_CRUD: ResourceCrud = {
  read: false,
  create: false,
  update: false,
  delete: false,
};

function isV2PermissionsStored(
  value: Record<string, unknown>,
): value is PermissionMatrixV2Stored {
  return (
    value.version === 2 &&
    value.resources != null &&
    typeof value.resources === "object" &&
    !Array.isArray(value.resources)
  );
}

function mergeV2PermissionsStored(
  stored: PermissionMatrixV2Stored,
): EffectivePermissionMatrixSerialized {
  const base = defaultEffectiveMatrixFromFlat(DENY_CRUD);
  for (const [key, patch] of Object.entries(stored.resources)) {
    const rk = key as PermissionResourceKey;
    if (!patch || typeof patch !== "object") continue;
    const current = base.resources[rk] ?? { ...DENY_CRUD };
    base.resources[rk] = {
      read: patch.read ?? current.read,
      create: patch.create ?? current.create,
      update: patch.update ?? current.update,
      delete: patch.delete ?? current.delete,
    };
  }
  const movCreate = base.resources.stock?.create ?? false;
  for (const t of MOVEMENT_TIPO_KEYS) {
    const explicit = stored.movement_tipos?.[t];
    base.movement_tipos[t] =
      explicit !== undefined ? Boolean(explicit) : movCreate;
  }
  return base;
}

/** Matriz efetiva a partir da sessão (permissionMatrix ou permissions v2 no JSON do utilizador). */
export function resolveUserPermissionMatrix(
  user: LoggedUser | null,
): EffectivePermissionMatrixSerialized | null {
  if (!user) return null;
  if (user.permissionMatrix?.resources) {
    return user.permissionMatrix;
  }
  const raw = user.permissions as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (isV2PermissionsStored(obj)) {
    return mergeV2PermissionsStored(obj);
  }
  if (
    typeof obj.read === "boolean" ||
    typeof obj.create === "boolean" ||
    typeof obj.update === "boolean" ||
    typeof obj.delete === "boolean"
  ) {
    return defaultEffectiveMatrixFromFlat({
      read: obj.read !== false,
      create: Boolean(obj.create),
      update: Boolean(obj.update),
      delete: Boolean(obj.delete),
    });
  }
  return null;
}

export function canAccessNotificationsUi(
  previewMode: boolean,
  canRead: boolean,
): boolean {
  return previewMode || canRead;
}

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
  if (!matrix?.resources?.stock?.create) return false;
  return Boolean(matrix.movement_tipos?.[tipo]);
}

export function canReadModuleFromUser(
  user: LoggedUser | null,
  moduleKey: string,
): boolean {
  if (!user) return false;
  if (isPermissionBypassUser(user)) return true;
  const matrix = resolveUserPermissionMatrix(user);
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

export function effectiveMatrixToV2Stored(
  matrix: EffectivePermissionMatrixSerialized,
): PermissionMatrixV2Stored {
  return {
    version: 2,
    resources: { ...matrix.resources },
    movement_tipos: { ...matrix.movement_tipos },
  };
}

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
