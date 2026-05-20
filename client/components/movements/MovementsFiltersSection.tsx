"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { TenantUiDisplay } from "@/helpers/storage-location-display.helper";
import { formatGavetaLabel } from "@/helpers/storage-location-display.helper";
import type { MovementFilters } from "@/components/movements/movements.types";
import { MovementsSearchableSelect } from "@/components/movements/MovementsSearchableSelect";
import { formatResidentCaselaAutocompleteLabel } from "@/helpers/resident-casela-autocomplete.helper";

type FiltersActions = {
  onProduto: (v: string) => void;
  onArmario: (v: string) => void;
  onGaveta: (v: string) => void;
  onCasela: (v: string) => void;
  onSetor: (v: string) => void;
  onLote: (v: string) => void;
  onClear: () => void;
};

export function MovementsFiltersSection({
  filters,
  uiKey,
  uiDisplay,
  cabinetOptions,
  drawerOptions,
  sectorOptions,
  filteredResidentOptions,
  residentOptions,
  residentPopoverOpen,
  setResidentPopoverOpen,
  residentSearch,
  setResidentSearch,
  actions,
}: {
  filters: MovementFilters;
  uiKey: "entries" | "exits" | "transfers";
  uiDisplay: TenantUiDisplay;
  cabinetOptions: Array<{ numero: number; categoria: string }>;
  drawerOptions: Array<{ numero: number; categoria: string }>;
  sectorOptions: Array<{ value: string; label: string }>;
  filteredResidentOptions: Array<{ casela: number; name: string }>;
  residentOptions: Array<{ casela: number; name: string }>;
  residentPopoverOpen: { entries: boolean; exits: boolean; transfers: boolean };
  setResidentPopoverOpen: Dispatch<
    SetStateAction<{
      entries: boolean;
      exits: boolean;
      transfers: boolean;
    }>
  >;
  residentSearch: string;
  setResidentSearch: (v: string) => void;
  actions: FiltersActions;
}) {
  const cabinetSelectOptions = useMemo(
    () =>
      cabinetOptions
        .slice()
        .sort((a, b) => a.numero - b.numero)
        .map((c) => ({
          value: String(c.numero),
          label:
            uiDisplay.armario === "categoria" && c.categoria?.trim()
              ? c.categoria
              : `Armário ${c.numero}`,
        })),
    [cabinetOptions, uiDisplay.armario],
  );

  const drawerSelectOptions = useMemo(
    () =>
      drawerOptions
        .slice()
        .sort((a, b) => a.numero - b.numero)
        .map((d) => ({
          value: String(d.numero),
          label: formatGavetaLabel(uiDisplay.gaveta, {
            gavetaId: d.numero,
            categoriaNome: d.categoria,
          }),
        })),
    [drawerOptions, uiDisplay.gaveta],
  );

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">
            Produto
          </label>
          <Input
            value={filters.produto}
            onChange={(e) => actions.onProduto(e.target.value)}
            placeholder="Nome do produto"
            className="h-auto rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <MovementsSearchableSelect
          label="Armário"
          placeholder="Todos os armários"
          value={filters.armario}
          onChange={actions.onArmario}
          options={cabinetSelectOptions}
          searchPlaceholder="Buscar armário..."
        />
        <MovementsSearchableSelect
          label={uiDisplay.gaveta === "categoria" ? "Categoria" : "Gaveta"}
          placeholder={
            uiDisplay.gaveta === "categoria"
              ? "Todas as categorias"
              : "Todas as gavetas"
          }
          value={filters.gaveta}
          onChange={actions.onGaveta}
          options={drawerSelectOptions}
          searchPlaceholder="Buscar gaveta..."
        />
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">
            Casela
          </label>
          <Popover
            open={residentPopoverOpen[uiKey]}
            onOpenChange={(next) =>
              setResidentPopoverOpen((p) => ({ ...p, [uiKey]: next }))
            }
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                role="combobox"
                className="flex w-full items-center justify-between truncate rounded-lg border border-border bg-background p-2 text-sm"
              >
                <span
                  className={
                    filters.casela
                      ? "truncate"
                      : "truncate text-muted-foreground"
                  }
                >
                  {filters.casela
                    ? (() => {
                        const r = residentOptions.find(
                          (x) => x.casela === Number(filters.casela),
                        );
                        return r
                          ? formatResidentCaselaAutocompleteLabel(r)
                          : `Casela ${filters.casela}`;
                      })()
                    : "Todas as caselas"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Buscar casela ou nome..."
                  value={residentSearch}
                  onValueChange={setResidentSearch}
                />
                <CommandList>
                  <CommandEmpty>Nenhum residente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filteredResidentOptions.map((r) => (
                      <CommandItem
                        key={r.casela}
                        value={`${r.casela}-${r.name}`}
                        onSelect={() => {
                          const next =
                            String(r.casela) === filters.casela
                              ? ""
                              : String(r.casela);
                          actions.onCasela(next);
                          setResidentSearch("");
                          setResidentPopoverOpen((p) => ({
                            ...p,
                            [uiKey]: false,
                          }));
                        }}
                      >
                        {formatResidentCaselaAutocompleteLabel(r)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <MovementsSearchableSelect
          label="Setor"
          placeholder="Todos os setores"
          value={filters.setor}
          onChange={actions.onSetor}
          options={sectorOptions}
          searchPlaceholder="Buscar setor..."
        />
        <div className="min-w-0">
          <label className="mb-1 block text-xs text-muted-foreground">
            Lote
          </label>
          <Input
            value={filters.lote}
            onChange={(e) => actions.onLote(e.target.value)}
            placeholder="Ex.: ABC123"
            className="h-auto rounded-lg px-2 py-2 text-sm"
          />
        </div>

        <div className="col-span-full flex justify-end gap-2 xl:col-span-6">
          <Button
            type="button"
            variant="outline"
            onClick={actions.onClear}
            disabled={
              !filters.produto.trim() &&
              !filters.armario.trim() &&
              !filters.gaveta.trim() &&
              !filters.casela.trim() &&
              !filters.setor.trim() &&
              !filters.lote.trim()
            }
          >
            Limpar filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
