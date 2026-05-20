import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { deleteDrawer, getDrawers } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import type { Drawer } from "@/interfaces/interfaces";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useTenantSetores } from "@/hooks/use-tenant-setores.hook";
import {
  buildSectorFilterOptions,
  getEnabledSectors,
} from "@/helpers/tenant-sectors.helper";
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
import { Checkbox } from "@/components/ui/checkbox";
import { TableFilter } from "@/components/TableFilter";
import { Pencil, Trash2, X } from "lucide-react";
import DeletePopUp from "@/components/DeletePopUp";
import { setSpaNavigationState } from "@/helpers/spa-navigation-state.helper";
import { ROUTES } from "@/constants/app.constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";

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
  const { previewMode, modules } = useTenant();
  const { labelByKey } = useTenantSetores();
  const { canMovementTipo } = usePermissionMatrix();
  const canSaida = canMovementTipo("saida");

  const sectorFilterChoices = useMemo(
    () => buildSectorFilterOptions(getEnabledSectors(modules), labelByKey),
    [modules, labelByKey],
  );
  const router = useRouter();
  const [drawers, setDrawers] = useState<StorageFolderItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedNumero, setSelectedNumero] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [filterCasela, setFilterCasela] = useState("");
  const [filterSetor, setFilterSetor] = useState("");
  const [filterLote, setFilterLote] = useState("");
  const [stockRows, setStockRows] = useState<StockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const [stockHasNext, setStockHasNext] = useState(false);
  const [stockTotal, setStockTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const PAGE_SIZE = 10;
  const STOCK_PAGE_SIZE = 10;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [checkedStockIds, setCheckedStockIds] = useState<Set<number>>(
    () => new Set(),
  );

  useEffect(() => {
    setCheckedStockIds(new Set());
  }, [selectedNumero]);

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
      const msg = getErrorMessage(
        err,
        "Não foi possível carregar as gavetas.",
        "Drawers:load",
      );
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
    async (numero: number, p: number, q: string) => {
      setLoadingStock(true);
      try {
        if (previewMode) {
          const all = filterPreviewStockByDrawer(numero);
          const nome = q.trim().toLowerCase();
          const lote = filterLote.trim().toLowerCase();
          const setor = filterSetor.trim()
            ? filterSetor.trim().toLowerCase()
            : "";
          const casela = filterCasela.trim() ? filterCasela.trim() : "";

          const filtered = all.filter((i) => {
            const okNome =
              !nome ||
              String(i.name ?? "")
                .toLowerCase()
                .includes(nome);
            const okLote =
              !lote ||
              String(i.lot ?? "")
                .toLowerCase()
                .includes(lote);
            const okSetor =
              !setor || String(i.sector ?? "").toLowerCase() === setor;
            const okCasela =
              !casela || String(i.casela ?? "").trim() === casela;
            return okNome && okLote && okSetor && okCasela;
          });
          const start = (p - 1) * STOCK_PAGE_SIZE;
          const pageItems = filtered.slice(start, start + STOCK_PAGE_SIZE);
          setStockRows(pageItems);
          setStockTotal(filtered.length);
          setStockHasNext(start + STOCK_PAGE_SIZE < filtered.length);
          return;
        }

        const { data, hasNext, total } = await fetchStockPage(
          p,
          STOCK_PAGE_SIZE,
          {
            gaveta: String(numero),
            nome: q.trim() ? q.trim() : undefined,
            casela: filterCasela.trim() ? filterCasela.trim() : undefined,
            setor: filterSetor.trim() ? filterSetor.trim() : undefined,
            lote: filterLote.trim() ? filterLote.trim() : undefined,
          },
        );
        const formatted = formatStockItems(data);
        setStockRows(formatted);
        setStockHasNext(Boolean(hasNext));
        setStockTotal(Number.isFinite(total) ? total : 0);
      } catch {
        toast({
          title: "Erro ao carregar estoque da gaveta",
          variant: "error",
          duration: 3000,
        });
        setStockRows([]);
        setStockHasNext(false);
        setStockTotal(0);
      } finally {
        setLoadingStock(false);
      }
    },
    [previewMode, STOCK_PAGE_SIZE, filterCasela, filterSetor, filterLote],
  );

  useEffect(() => {
    if (selectedNumero == null) {
      setStockRows([]);
      setStockPage(1);
      setStockHasNext(false);
      setStockTotal(0);
      return;
    }
    void loadStockForDrawer(selectedNumero, stockPage, tableFilter);
  }, [selectedNumero, loadStockForDrawer, stockPage, tableFilter]);

  useEffect(() => {
    setStockPage(1);
  }, [selectedNumero, tableFilter, filterCasela, filterSetor, filterLote]);

  const selectedDrawer = useMemo(
    () => drawers.find((d) => d.numero === selectedNumero) ?? null,
    [drawers, selectedNumero],
  );

  const handleEdit = useCallback(() => {
    if (previewMode) return;
    if (!selectedDrawer || selectedNumero == null) return;
    setSpaNavigationState({
      item: {
        numero: selectedNumero,
        categoria: selectedDrawer.categoria ?? "",
      },
    });
    router.push(ROUTES.DRAWERS_EDIT);
  }, [previewMode, selectedDrawer, selectedNumero, router]);

  const handleDelete = useCallback(async () => {
    if (previewMode) return;
    if (selectedNumero == null) return;
    setDeleteLoading(true);
    try {
      await deleteDrawer(selectedNumero);
      toast({
        title: "Gaveta removida",
        description: "A gaveta foi removida com sucesso.",
        variant: "success",
        duration: 3000,
      });
      setDeleteOpen(false);
      setSelectedNumero(null);
      await loadDrawers();
    } catch (err: unknown) {
      toast({
        title: "Não foi possível remover",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "Drawers:delete",
        ),
        variant: "error",
        duration: 3500,
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [previewMode, selectedNumero, loadDrawers]);

  const filteredDetailRows = useMemo(() => {
    return stockItemsToDetailRows(stockRows);
  }, [stockRows]);

  const caselaOptions = useMemo(() => {
    const set = new Set<string>();
    for (const i of stockRows) {
      const v = i.casela == null ? "" : String(i.casela);
      if (v.trim()) set.add(v);
    }
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [stockRows]);

  return (
    <Layout title="Gavetas">
      <div className="pt-8 pb-12 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <section className={pageSurfaceCardClass}>
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
              {!previewMode ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                  >
                    <Link href={`/stock?drawer=${selectedNumero}`}>
                      Ver no estoque
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      if (!canSaida) {
                        toast({
                          title: "Sem permissão",
                          description:
                            "Você não tem permissão para dar saída no estoque.",
                          variant: "error",
                          duration: 3000,
                        });
                        return;
                      }
                      router.push(`/stock/out?drawer=${selectedNumero}`);
                    }}
                  >
                    Saída rápida
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={handleEdit}
                    aria-label="Editar gaveta"
                    disabled={deleteLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Remover gaveta"
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="max-w-md">
                <TableFilter
                  placeholder="Buscar por nome"
                  onFilterChange={setTableFilter}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="drawer-filter-casela" className="text-xs">
                    Casela
                  </Label>
                  <div className="flex gap-2 items-center">
                    <div className="min-w-0 flex-1">
                      <Select
                        value={filterCasela.trim() ? filterCasela : undefined}
                        onValueChange={setFilterCasela}
                      >
                        <SelectTrigger
                          id="drawer-filter-casela"
                          className="rounded-xl"
                        >
                          <SelectValue placeholder="Todas as caselas" />
                        </SelectTrigger>
                        <SelectContent>
                          {caselaOptions.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {filterCasela.trim() ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl"
                        onClick={() => setFilterCasela("")}
                        aria-label="Limpar filtro de casela"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="drawer-filter-setor" className="text-xs">
                    Setor
                  </Label>
                  <div className="flex gap-2 items-center">
                    <div className="min-w-0 flex-1">
                      <Select
                        value={filterSetor.trim() ? filterSetor : undefined}
                        onValueChange={setFilterSetor}
                      >
                        <SelectTrigger
                          id="drawer-filter-setor"
                          className="rounded-xl"
                        >
                          <SelectValue placeholder="Todos os setores" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectorFilterChoices.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {filterSetor.trim() ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl"
                        onClick={() => setFilterSetor("")}
                        aria-label="Limpar filtro de setor"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="drawer-filter-lote" className="text-xs">
                    Lote
                  </Label>
                  <Input
                    id="drawer-filter-lote"
                    value={filterLote}
                    onChange={(e) => setFilterLote(e.target.value)}
                    placeholder="Ex.: LT-123"
                    className="rounded-xl"
                  />
                </div>
              </div>
              {loadingStock ? (
                <SkeletonTable rows={5} cols={STOCK_DETAIL_COLUMNS.length} />
              ) : (
                <div className="space-y-4">
                  <EditableTable
                    data={filteredDetailRows}
                    columns={STOCK_DETAIL_COLUMNS}
                    showAddons={false}
                    readOnly
                    columnWidthKey="drawers.detailStock"
                  />

                  {stockRows.length > 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 space-y-2">
                      <p className="text-sm font-medium">
                        Conferência (esta sessão)
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {stockRows.map((row) => {
                          const id = Number(row.id);
                          return (
                            <label
                              key={id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={checkedStockIds.has(id)}
                                onCheckedChange={(c) => {
                                  setCheckedStockIds((prev) => {
                                    const next = new Set(prev);
                                    if (c === true) next.add(id);
                                    else next.delete(id);
                                    return next;
                                  });
                                }}
                              />
                              <span className="truncate max-w-[220px]">
                                {row.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col items-center justify-center gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Total:{" "}
                      <span className="font-medium text-foreground">
                        {previewMode ? stockRows.length : stockTotal}
                      </span>
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl min-w-[7rem]"
                        onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                        disabled={loadingStock || stockPage <= 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Página {stockPage}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl min-w-[7rem]"
                        onClick={() => setStockPage((p) => p + 1)}
                        disabled={
                          loadingStock || (!previewMode && !stockHasNext)
                        }
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DeletePopUp
              open={deleteOpen}
              onCancel={() => {
                if (deleteLoading) return;
                setDeleteOpen(false);
              }}
              onConfirm={handleDelete}
              message={`Remover a gaveta nº ${selectedNumero}?`}
            />
          </section>
        ) : null}
      </div>
    </Layout>
  );
}
