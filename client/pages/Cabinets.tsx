import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { getCabinets } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import {
  PREVIEW_CABINETS,
  filterPreviewStockByCabinet,
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
  { key: "drawer", label: "Gaveta", editable: false },
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
    drawer: i.drawer ?? "—",
    casela: i.casela ?? "—",
    sector: i.sector,
    lot: i.lot ?? "—",
  }));
}

export default function Cabinets() {
  const { previewMode } = useTenant();
  const [cabinets, setCabinets] = useState<StorageFolderItem[]>([]);
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

  const loadCabinets = useCallback(async () => {
    setLoadingList(true);
    try {
      if (previewMode) {
        const start = (page - 1) * PAGE_SIZE;
        const slice = PREVIEW_CABINETS.slice(start, start + PAGE_SIZE);
        setCabinets(slice);
        setHasNext(start + PAGE_SIZE < PREVIEW_CABINETS.length);
        return;
      }

      const res = await getCabinets(page, PAGE_SIZE);
      const mapped = (Array.isArray(res.data) ? res.data : []).map(
        (c: { numero: number; categoria: string }) => ({
          numero: c.numero,
          categoria: c.categoria ?? "",
        }),
      );
      setCabinets(mapped);
      setHasNext(Boolean(res.hasNext));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast({
        title: "Erro ao carregar armários",
        description: msg,
        variant: "error",
        duration: 3000,
      });
      setCabinets([]);
      setHasNext(false);
    } finally {
      setLoadingList(false);
    }
  }, [previewMode, page]);

  useEffect(() => {
    void loadCabinets();
  }, [loadCabinets]);

  useEffect(() => {
    // Não auto-seleciona: permite ficar sem seleção.
    setSelectedNumero((prev) => {
      if (prev == null) return null;
      return cabinets.some((c) => c.numero === prev) ? prev : null;
    });
  }, [cabinets]);

  const loadStockForCabinet = useCallback(
    async (numero: number) => {
      setLoadingStock(true);
      try {
        const { data } = await fetchStockPage(1, 80, {
          armario: String(numero),
        });
        let formatted = formatStockItems(data);
        if (previewMode && formatted.length === 0) {
          formatted = filterPreviewStockByCabinet(numero);
        }
        setStockRows(formatted);
      } catch {
        if (previewMode) {
          setStockRows(filterPreviewStockByCabinet(numero));
        } else {
          toast({
            title: "Erro ao carregar estoque do armário",
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
    void loadStockForCabinet(selectedNumero);
  }, [selectedNumero, loadStockForCabinet]);

  const selectedCabinet = useMemo(
    () => cabinets.find((c) => c.numero === selectedNumero) ?? null,
    [cabinets, selectedNumero],
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
    <Layout title="Armários">
      <div className="pt-8 pb-12 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-xl">
            Selecione um armário para ver o que está armazenado nele. Use a
            busca e o filtro por categoria para encontrar locais rapidamente.
          </p>
          {!previewMode ? (
            <Button asChild className="rounded-xl">
              <Link href="/cabinets/register">Novo armário</Link>
            </Button>
          ) : null}
        </div>

        {loadingList ? (
          <SkeletonTable rows={4} cols={3} />
        ) : (
          <StorageFolderGrid
            kind="cabinet"
            items={cabinets}
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

        {selectedCabinet && selectedNumero != null ? (
          <section className="rounded-2xl border border-border/70 bg-card shadow-elevated overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.04]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 border-b border-border/60 bg-muted/25">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                <span className="text-2xl font-bold">{selectedNumero}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Armário nº {selectedNumero}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCabinet.categoria || "Sem categoria"}
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
