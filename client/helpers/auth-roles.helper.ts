import type { LoggedUser } from "@/interfaces/interfaces";

type UserLike = LoggedUser | Record<string, unknown> | null | undefined;

export function isSuperAdminUser(user: UserLike): boolean {
  if (!user || typeof user !== "object") return false;
  const o = user as Record<string, unknown>;
  const v = o.isSuperAdmin ?? o.is_super_admin;
  return v === true || v === 1;
}
