import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { getDrawers } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import type { Drawer } from "@/interfaces/interfaces";
import { useTenant } from "@/hooks/use-tenant.hook";
import {
  PREVIEW_DRAWERS,
  filterPreviewStockByDrawer,
} from "@/helpers/preview-mock-data";
import {
  StorageFolderGrid,
  type StorageFolderItem,
} from "@/components/StorageFolderGrid";
import { fetchStockPage, formatStockItems } from "@/helpers/stock-list.helper";
import type { StockItem } from "@/interfaces/interfaces";
import { Button } from "@/components/ui/button";
import { TableFilter } from "@/components/TableFilter";

const STOCK_DETAIL_COLUMNS = [
  { key: "stockType", label: "Tipo", editable: false },
  { key: "name", label: "Nome", editable: false },
  { key: "quantity", label: "Qtd.", editable: false },
  { key: "expiry", label: "Validade", editable: false },
  { key: "cabinet", label: "Armário", editable: false },
  { key: "casela", label: "Casela", editable: false },
  { key: "sector", label: "Setor", editable: false },
  { key: "lot", label: "Lote", editable: false },
];

function stockItemsToDetailRows(items: StockItem[]): Record<string, unknown>[] {
  return items.map((i) => ({
    stockType: i.stockType,
    name: i.name,
    quantity: i.quantity,
    expiry: i.expiry,
    cabinet: i.cabinet ?? "—",
    casela: i.casela ?? "—",
    sector: i.sector,
    lot: i.lot ?? "—",
  }));
}

export default function Drawers() {
  const { previewMode } = useTenant();
  const [drawers, setDrawers] = useState<StorageFolderItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedNumero, setSelectedNumero] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("__all");
  const [tableFilter, setTableFilter] = useState("");
  const [stockRows, setStockRows] = useState<StockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const PAGE_SIZE = 10;

  const loadDrawers = useCallback(async () => {
    setLoadingList(true);
    try {
      if (previewMode) {
        const start = (page - 1) * PAGE_SIZE;
        const slice = PREVIEW_DRAWERS.slice(start, start + PAGE_SIZE);
        setDrawers(slice);
        setHasNext(start + PAGE_SIZE < PREVIEW_DRAWERS.length);
        return;
      }

      const res = await getDrawers(page, PAGE_SIZE);
      const mapped = (Array.isArray(res.data) ? res.data : []).map(
        (d: Drawer) => ({
          numero: d.numero,
          categoria: d.categoria ?? "",
        }),
      );
      setDrawers(mapped);
      setHasNext(Boolean(res.hasNext));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast({
        title: "Erro ao carregar gavetas",
        description: msg,
        variant: "error",
        duration: 3000,
      });
      setDrawers([]);
      setHasNext(false);
    } finally {
      setLoadingList(false);
    }
  }, [previewMode, page]);

  useEffect(() => {
    void loadDrawers();
  }, [loadDrawers]);

  useEffect(() => {
    setSelectedNumero((prev) => {
      if (prev == null) return null;
      return drawers.some((d) => d.numero === prev) ? prev : null;
    });
  }, [drawers]);

  const loadStockForDrawer = useCallback(
    async (numero: number) => {
      setLoadingStock(true);
      try {
        const { data } = await fetchStockPage(1, 80, {
          gaveta: String(numero),
        });
        let formatted = formatStockItems(data);
        if (previewMode && formatted.length === 0) {
          formatted = filterPreviewStockByDrawer(numero);
        }
        setStockRows(formatted);
      } catch {
        if (previewMode) {
          setStockRows(filterPreviewStockByDrawer(numero));
        } else {
          toast({
            title: "Erro ao carregar estoque da gaveta",
            variant: "error",
            duration: 3000,
          });
          setStockRows([]);
        }
      } finally {
        setLoadingStock(false);
      }
    },
    [previewMode],
  );

  useEffect(() => {
    if (selectedNumero == null) {
      setStockRows([]);
      return;
    }
    void loadStockForDrawer(selectedNumero);
  }, [selectedNumero, loadStockForDrawer]);

  const selectedDrawer = useMemo(
    () => drawers.find((d) => d.numero === selectedNumero) ?? null,
    [drawers, selectedNumero],
  );

  const filteredDetailRows = useMemo(() => {
    const base = stockItemsToDetailRows(stockRows);
    const q = tableFilter.trim().toLowerCase();
    if (!q) return base;
    return base.filter((row) => {
      const name = String(row.name ?? "").toLowerCase();
      const lot = String(row.lot ?? "").toLowerCase();
      return name.includes(q) || lot.includes(q);
    });
  }, [stockRows, tableFilter]);

  return (
    <Layout title="Gavetas">
      <div className="pt-8 pb-12 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-xl">
            Selecione uma gaveta para ver os itens de estoque associados. Filtre
            por categoria ou busque pelo número.
          </p>
          {!previewMode ? (
            <Button asChild className="rounded-xl">
              <Link href="/drawer/register">Nova gaveta</Link>
            </Button>
          ) : null}
        </div>

        {loadingList ? (
          <SkeletonTable rows={4} cols={3} />
        ) : (
          <StorageFolderGrid
            kind="drawer"
            items={drawers}
            selectedNumero={selectedNumero}
            onSelect={(n) =>
              setSelectedNumero((prev) => (prev === n ? null : n))
            }
            search={search}
            onSearchChange={setSearch}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
          />
        )}

        {!loadingList ? (
          <div className="flex items-center justify-center gap-3 -mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl min-w-[7rem]"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl min-w-[7rem]"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
            >
              Próximo
            </Button>
          </div>
        ) : null}

        {selectedDrawer && selectedNumero != null ? (
          <section className="rounded-2xl border border-border/70 bg-card shadow-elevated overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 border-b border-border/60 bg-muted/25">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100">
                <span className="text-2xl font-bold">{selectedNumero}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Gaveta nº {selectedNumero}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedDrawer.categoria || "Sem categoria"}
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="max-w-md">
                <TableFilter
                  placeholder="Filtrar itens na tabela (nome ou lote)"
                  onFilterChange={setTableFilter}
                />
              </div>
              {loadingStock ? (
                <SkeletonTable rows={5} cols={STOCK_DETAIL_COLUMNS.length} />
              ) : (
                <EditableTable
                  data={filteredDetailRows}
                  columns={STOCK_DETAIL_COLUMNS}
                  showAddons={false}
                  readOnly
                />
              )}
            </div>
          </section>
        ) : null}
      </div>
    </Layout>
  );
}
