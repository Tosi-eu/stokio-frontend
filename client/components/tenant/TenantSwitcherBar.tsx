"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAccessibleTenants,
  type AccessibleTenantRow,
} from "@/api/requests";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import {
  readActiveTenantSlug,
  writeActiveTenantSlug,
} from "@/helpers/active-tenant-slug.helper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function TenantSwitcherBar({ className }: Props) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [rows, setRows] = useState<AccessibleTenantRow[]>([]);
  const [loading, setLoading] = useState(false);

  const ownerish =
    Boolean(user?.isTenantOwner || user?.is_tenant_owner) ||
    isSuperAdminUser(user);
  const maySwitchContext = Boolean(user) && ownerish;

  const syncSelectionFromStorage = useCallback(() => {
    const stored = readActiveTenantSlug();
    const primarySlug =
      rows.find((t) => t.isPrimary)?.slug ?? tenant?.slug ?? "";
    if (!stored || stored === primarySlug) {
      return primarySlug || "";
    }
    if (!rows.some((r) => r.slug === stored)) {
      return primarySlug || "";
    }
    return stored;
  }, [rows, tenant?.slug]);

  const [selectValue, setSelectValue] = useState<string>("");

  useEffect(() => {
    if (!maySwitchContext) return;
    let cancelled = false;
    setLoading(true);
    listAccessibleTenants()
      .then((r) => {
        if (cancelled) return;
        setRows(r.tenants ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [maySwitchContext]);

  useEffect(() => {
    setSelectValue(syncSelectionFromStorage());
  }, [syncSelectionFromStorage, rows, tenant?.slug]);

  useEffect(() => {
    const onCustom = () => setSelectValue(syncSelectionFromStorage());
    window.addEventListener("stokio-active-tenant-changed", onCustom);
    return () =>
      window.removeEventListener("stokio-active-tenant-changed", onCustom);
  }, [syncSelectionFromStorage]);

  if (!maySwitchContext || rows.length < 2) return null;

  const primarySlug = rows.find((t) => t.isPrimary)?.slug ?? tenant?.slug ?? "";

  return (
    <div className={cn("flex items-center gap-2 text-sm min-w-0", className)}>
      <span className="text-muted-foreground whitespace-nowrap shrink-0">
        Abrigo ativo
      </span>
      <Select
        value={selectValue || undefined}
        onValueChange={(slug) => {
          const next =
            slug === primarySlug || slug === tenant?.slug ? null : slug;
          writeActiveTenantSlug(next === null ? null : slug);
          setSelectValue(slug);
        }}
        disabled={loading}
      >
        <SelectTrigger className="h-9 min-w-[10rem] max-w-[18rem] truncate">
          <SelectValue placeholder={loading ? "…" : "Selecionar"} />
        </SelectTrigger>
        <SelectContent>
          {rows.map((t) => (
            <SelectItem key={t.id} value={t.slug}>
              {t.name}
              {t.isPrimary ? " (principal)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
