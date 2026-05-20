"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listAccessibleTenants } from "@/api/requests";
import type { AccessibleTenantRow } from "@/api/requests";
import { accessibleTenantLabel } from "@/helpers/tenant-display.helper";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import {
  readActiveTenantSlug,
  writeActiveTenantSlug,
} from "@/helpers/active-tenant-slug.helper";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function TenantSwitcherBar({ className }: Props) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [rows, setRows] = useState<AccessibleTenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const ownerish =
    Boolean(user?.isTenantOwner || user?.is_tenant_owner) ||
    isSuperAdminUser(user);
  const maySwitchContext = Boolean(user) && ownerish;

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        accessibleTenantLabel(a).localeCompare(
          accessibleTenantLabel(b),
          undefined,
          { sensitivity: "base" },
        ),
      ),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedRows;
    return sortedRows.filter((t) =>
      accessibleTenantLabel(t).toLowerCase().includes(q),
    );
  }, [sortedRows, query]);

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
  const current = rows.find((r) => r.slug === selectValue);
  const triggerLabel = current
    ? `${accessibleTenantLabel(current)}${current.isPrimary ? " · principal" : ""}`
    : loading
      ? "A carregar…"
      : "Selecionar abrigo";

  return (
    <div className={cn("flex items-center gap-2 text-sm min-w-0", className)}>
      <span className="text-muted-foreground whitespace-nowrap shrink-0">
        Abrigo ativo
      </span>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={loading}
            className="h-9 min-w-[10rem] max-w-[min(22rem,100%)] justify-between font-normal px-3"
          >
            <span className="truncate text-left">{triggerLabel}</span>
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] max-w-[24rem] p-0"
          align="end"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Pesquisar por nome…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList className="max-h-[280px]">
              <CommandEmpty>Nenhum abrigo encontrado.</CommandEmpty>
              <CommandGroup>
                {filteredRows.map((t) => {
                  const label = accessibleTenantLabel(t);
                  const selected = t.slug === selectValue;
                  return (
                    <CommandItem
                      key={t.id}
                      value={`${t.slug}\t${label}`}
                      onSelect={() => {
                        const next =
                          t.slug === primarySlug || t.slug === tenant?.slug
                            ? null
                            : t.slug;
                        writeActiveTenantSlug(next === null ? null : t.slug);
                        setSelectValue(t.slug);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">
                        {label}
                        {t.isPrimary ? (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            · principal
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
