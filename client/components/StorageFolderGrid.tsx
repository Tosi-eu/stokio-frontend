"use client";

import { useMemo } from "react";
import { Archive, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type StorageFolderItem = {
  numero: number;
  categoria: string;
};

type StorageFolderGridProps = {
  kind: "cabinet" | "drawer";
  items: StorageFolderItem[];
  selectedNumero: number | null;
  onSelect: (numero: number) => void;
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
};

export function StorageFolderGrid({
  kind,
  items,
  selectedNumero,
  onSelect,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
}: StorageFolderGridProps) {
  const label = kind === "cabinet" ? "armário" : "gaveta";
  const Icon = kind === "cabinet" ? Archive : Layers;

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      if (it.categoria?.trim()) s.add(it.categoria.trim());
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pt"));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (categoryFilter && categoryFilter !== "__all") {
        if (it.categoria !== categoryFilter) return false;
      }
      if (!q) return true;
      const n = String(it.numero);
      return (
        n.includes(q) ||
        it.categoria.toLowerCase().includes(q) ||
        `nº ${n}`.includes(q)
      );
    });
  }, [items, search, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Buscar {label}
          </label>
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Número ou categoria…`}
            className="rounded-xl"
          />
        </div>
        <div className="w-full sm:w-56 shrink-0">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Categoria
          </label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((it) => {
          const active = selectedNumero === it.numero;
          return (
            <button
              key={`${kind}-${it.numero}`}
              type="button"
              onClick={() => onSelect(it.numero)}
              className={cn(
                "group flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "border-primary bg-primary/10 shadow-elevated scale-[1.02]"
                  : "border-border/80 bg-card hover:border-primary/35 hover:bg-accent/40 hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl shadow-inner transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100",
                )}
              >
                <Icon
                  className="h-9 w-9 shrink-0"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <div className="space-y-0.5 min-w-0 w-full">
                <p className="text-sm font-semibold text-foreground truncate">
                  Nº {it.numero}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {it.categoria || "—"}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum {label} corresponde ao filtro.
        </p>
      ) : null}
    </div>
  );
}
