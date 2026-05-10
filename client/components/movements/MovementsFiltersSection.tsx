"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/command";
import type { TenantUiDisplay } from "@/helpers/storage-location-display.helper";
import {
  formatCaselaLabel,
  formatGavetaLabel,
} from "@/helpers/storage-location-display.helper";
import type { MovementFilters } from "@/components/movements/movements.types";
import { MovementsSearchableSelect } from "@/components/movements/MovementsSearchableSelect";

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
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1 max-w-[360px]">
          <Label className="text-xs">Produto</Label>
          <Input
            value={filters.produto}
            onChange={(e) => actions.onProduto(e.target.value)}
            placeholder="Nome do produto"
            className="mt-1 h-8 px-2 text-xs"
          />
        </div>
        <MovementsSearchableSelect
          label="Armário"
          value={filters.armario}
          onChange={actions.onArmario}
          options={cabinetSelectOptions}
          searchPlaceholder="Buscar armário..."
        />
        <MovementsSearchableSelect
          label={uiDisplay.gaveta === "categoria" ? "Categoria" : "Gaveta"}
          value={filters.gaveta}
          onChange={actions.onGaveta}
          options={drawerSelectOptions}
          searchPlaceholder="Buscar gaveta..."
        />
        <div className="min-w-[220px] max-w-[320px]">
          <Label className="text-xs">Casela</Label>
          <Popover
            open={residentPopoverOpen[uiKey]}
            onOpenChange={(next) =>
              setResidentPopoverOpen((p) => ({ ...p, [uiKey]: next }))
            }
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className="mt-1 h-8 w-full justify-between px-2 text-xs"
              >
                <span className="truncate">
                  {filters.casela
                    ? formatCaselaLabel(uiDisplay.casela, {
                        caselaId: Number(filters.casela),
                        residentName:
                          residentOptions.find(
                            (r) => r.casela === Number(filters.casela),
                          )?.name ?? null,
                      })
                    : "Selecione"}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Buscar casela ou nome..."
                  value={residentSearch}
                  onValueChange={setResidentSearch}
                />
                <CommandEmpty>Nenhum residente encontrado.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      actions.onCasela("");
                      setResidentSearch("");
                      setResidentPopoverOpen((p) => ({
                        ...p,
                        [uiKey]: false,
                      }));
                    }}
                  >
                    Todos
                  </CommandItem>
                  {filteredResidentOptions.map((r) => (
                    <CommandItem
                      key={r.casela}
                      value={String(r.casela)}
                      onSelect={() => {
                        actions.onCasela(String(r.casela));
                        setResidentSearch("");
                        setResidentPopoverOpen((p) => ({
                          ...p,
                          [uiKey]: false,
                        }));
                      }}
                    >
                      {uiDisplay.casela === "nome"
                        ? `${r.name} (Casela ${r.casela})`
                        : `Casela ${r.casela} — ${r.name}`}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <MovementsSearchableSelect
          label="Setor"
          value={filters.setor}
          onChange={actions.onSetor}
          options={sectorOptions}
          searchPlaceholder="Buscar setor..."
        />
        <div className="min-w-[180px] max-w-[240px]">
          <Label className="text-xs">Lote</Label>
          <Input
            value={filters.lote}
            onChange={(e) => actions.onLote(e.target.value)}
            placeholder="Ex.: ABC123"
            className="mt-1 h-8 px-2 text-xs"
          />
        </div>

        <div className="ml-auto flex justify-end gap-2">
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
