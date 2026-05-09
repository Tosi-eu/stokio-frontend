"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { StockItemRaw } from "@/interfaces/interfaces";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useDrawerCategoryMap } from "@/hooks/use-drawer-category-map.hook";
import {
  formatCaselaLabel,
  formatGavetaLabel,
} from "@/helpers/storage-location-display.helper";

function deriveItemStatus(item: StockItemRaw) {
  const isSuspended = item.status === "suspended";
  const isOutOfStock = Number(item.quantidade) === 0;
  const isExpired = item.st_expiracao === "expired";
  const disabled = isSuspended || isOutOfStock || isExpired;

  const label = isSuspended
    ? "Suspenso"
    : isExpired
      ? "Vencido"
      : isOutOfStock
        ? "Sem estoque"
        : "OK";

  return { disabled, isSuspended, isOutOfStock, isExpired, label };
}

const ROW_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-[repeat(7,minmax(0,1fr))] gap-2 sm:gap-3 px-3 sm:px-4";

const CELL_CENTER =
  "min-w-0 flex items-center justify-center text-center self-stretch";

export type StockOutTableProps = {
  items: StockItemRaw[];
  selected: StockItemRaw | null;
  loading?: boolean;
  onSelect: (item: StockItemRaw | null) => void;
};

export function StockOutTable({
  items,
  selected,
  loading = false,
  onSelect,
}: StockOutTableProps) {
  const { uiDisplay } = useTenant();
  const drawerCategoryByNum = useDrawerCategoryMap();

  const parentRef = useRef<HTMLDivElement | null>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const empty = !loading && items.length === 0;

  const header = useMemo(
    () => (
      <div
        className={`${ROW_GRID_CLASS} py-2.5 text-xs font-medium text-muted-foreground border-b border-border/60`}
      >
        <div className={`${CELL_CENTER} min-h-[2.75rem] px-1`}>Produto</div>
        <div className={`${CELL_CENTER} px-1 leading-snug`}>
          Quantidade em Estoque
        </div>
        <div className={`${CELL_CENTER} px-1`}>Local</div>
        <div className={`${CELL_CENTER} px-1`}>Casela</div>
        <div className={`${CELL_CENTER} px-1`}>Setor</div>
        <div className={`${CELL_CENTER} px-1`}>Lote</div>
        <div className={`${CELL_CENTER} px-1`}>Status</div>
      </div>
    ),
    [],
  );

  return (
    <div className="w-full min-w-0 max-w-full self-stretch">
      <div className="w-full min-w-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="w-full min-w-0">{header}</div>
        <div
          ref={parentRef}
          className="relative h-[min(62vh,680px)] w-full min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]"
        >
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
          ) : empty ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum item encontrado.
            </div>
          ) : (
            <div
              style={{ height: `${totalSize}px` }}
              className="relative w-full min-w-0"
            >
              {virtualItems.map((v) => {
                const item = items[v.index];
                const isSelected = selected?.estoque_id === item.estoque_id;
                const status = deriveItemStatus(item);

                const caselaText = item.casela_id
                  ? `Casela ${formatCaselaLabel(uiDisplay.casela, {
                      caselaId: item.casela_id,
                      residentName: item.paciente,
                    })}`
                  : null;

                const gavetaText = formatGavetaLabel(uiDisplay.gaveta, {
                  gavetaId: item.gaveta_id ?? undefined,
                  categoriaNome:
                    item.gaveta_id != null
                      ? drawerCategoryByNum.get(item.gaveta_id)
                      : undefined,
                });
                const showGavetaUnderLocal =
                  !item.casela_id &&
                  item.gaveta_id != null &&
                  gavetaText !== "—";

                return (
                  <button
                    key={`${item.estoque_id}-${item.tipo_item}-${v.index}`}
                    type="button"
                    disabled={status.disabled}
                    onClick={() => onSelect(isSelected ? null : item)}
                    className={cn(
                      ROW_GRID_CLASS,
                      "absolute inset-x-0 w-full min-w-0 py-2.5 text-sm border-b border-border/50",
                      "transition-colors duration-150",
                      "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      !status.disabled && "cursor-pointer",
                      isSelected && "bg-accent/50",
                      status.disabled && "opacity-60 cursor-not-allowed",
                    )}
                    style={{ transform: `translateY(${v.start}px)` }}
                  >
                    <div
                      className={`${CELL_CENTER} flex-col gap-0.5 px-1 font-normal`}
                    >
                      <div className="truncate font-medium text-foreground w-full">
                        {item.nome ?? "—"}
                      </div>
                      {item.tipo_item === "medicamento" &&
                      String(item.principio_ativo ?? "").trim() ? (
                        <div className="truncate text-xs text-muted-foreground w-full">
                          {String(item.principio_ativo)}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          {item.tipo_item === "insumo" ? "Insumo" : "—"}
                        </div>
                      )}
                    </div>

                    <div className={`${CELL_CENTER} tabular-nums px-1`}>
                      {Number(item.quantidade ?? 0)}
                    </div>

                    <div className={`${CELL_CENTER} flex-col gap-0.5 px-1`}>
                      <div className="truncate w-full">
                        Armário {item.armario_id ?? "—"}
                      </div>
                      {showGavetaUnderLocal ? (
                        <div className="truncate text-xs text-muted-foreground w-full">
                          {gavetaText}
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`${CELL_CENTER} truncate text-xs text-muted-foreground px-1`}
                    >
                      {caselaText ?? "—"}
                    </div>

                    <div className={`${CELL_CENTER} truncate px-1`}>
                      {item.setor ?? "—"}
                    </div>
                    <div
                      className={`${CELL_CENTER} truncate tabular-nums px-1`}
                    >
                      {item.lote ?? "—"}
                    </div>

                    <div className={`${CELL_CENTER} px-1 text-xs`}>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-1 font-medium",
                          status.label === "OK" &&
                            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
                          status.label === "Vencido" &&
                            "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200",
                          status.label === "Suspenso" &&
                            "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
                          status.label === "Sem estoque" &&
                            "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200",
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
