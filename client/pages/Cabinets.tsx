import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import {
  deleteCabinet,
  getCabinetCategories,
  getCabinets,
  updateCabinet,
} from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
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
import { Pencil, Trash2 } from "lucide-react";
import DeletePopUp from "@/components/DeletePopUp";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [filterCasela, setFilterCasela] = useState("__all");
  const [filterSetor, setFilterSetor] = useState("__all");
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
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: number; nome: string }[]>(
    [],
  );
  const [editCategoriaId, setEditCategoriaId] = useState<string>("");

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
      const msg = getErrorMessage(
        err,
        "Não foi possível carregar os armários.",
        "Cabinets:load",
      );
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
    setSelectedNumero((prev) => {
      if (prev == null) return null;
      return cabinets.some((c) => c.numero === prev) ? prev : null;
    });
  }, [cabinets]);

  const loadStockForCabinet = useCallback(
    async (numero: number, p: number, q: string) => {
      setLoadingStock(true);
      try {
        if (previewMode) {
          const all = filterPreviewStockByCabinet(numero);
          const nome = q.trim().toLowerCase();
          const lote = filterLote.trim().toLowerCase();
          const setor =
            filterSetor === "__all" ? "" : filterSetor.trim().toLowerCase();
          const casela = filterCasela === "__all" ? "" : filterCasela.trim();

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
            armario: String(numero),
            nome: q.trim() ? q.trim() : undefined,
            casela:
              filterCasela !== "__all" && filterCasela.trim()
                ? filterCasela.trim()
                : undefined,
            setor:
              filterSetor !== "__all" && filterSetor.trim()
                ? filterSetor.trim()
                : undefined,
            lote: filterLote.trim() ? filterLote.trim() : undefined,
          },
        );
        const formatted = formatStockItems(data);
        setStockRows(formatted);
        setStockHasNext(Boolean(hasNext));
        setStockTotal(Number.isFinite(total) ? total : 0);
      } catch {
        toast({
          title: "Erro ao carregar estoque do armário",
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
    void loadStockForCabinet(selectedNumero, stockPage, tableFilter);
  }, [selectedNumero, loadStockForCabinet, stockPage, tableFilter]);

  useEffect(() => {
    setStockPage(1);
  }, [selectedNumero, tableFilter, filterCasela, filterSetor, filterLote]);

  const selectedCabinet = useMemo(
    () => cabinets.find((c) => c.numero === selectedNumero) ?? null,
    [cabinets, selectedNumero],
  );

  useEffect(() => {
    if (previewMode) return;
    void getCabinetCategories(1, 200)
      .then((res) => setCategories(res.data))
      .catch(() =>
        toast({
          title: "Não foi possível carregar categorias",
          variant: "error",
          duration: 3000,
        }),
      );
  }, [previewMode]);

  const openEditModal = useCallback(() => {
    if (previewMode) return;
    if (!selectedCabinet || selectedNumero == null) return;
    const matched = categories.find(
      (c) => c.nome === selectedCabinet.categoria,
    );
    setEditCategoriaId(matched ? String(matched.id) : "");
    setEditOpen(true);
  }, [previewMode, selectedCabinet, selectedNumero, categories]);

  const handleSaveEdit = useCallback(async () => {
    if (previewMode) return;
    if (selectedNumero == null) return;
    const catId = Number(editCategoriaId);
    if (!Number.isFinite(catId) || catId <= 0) {
      toast({
        title: "Categoria obrigatória",
        description: "Selecione uma categoria para salvar.",
        variant: "warning",
        duration: 3000,
      });
      return;
    }

    setEditSaving(true);
    try {
      await updateCabinet(selectedNumero, {
        numero: selectedNumero,
        categoria_id: catId,
      });
      toast({
        title: "Armário atualizado",
        description: "Categoria salva com sucesso.",
        variant: "success",
        duration: 3000,
      });
      setEditOpen(false);
      await loadCabinets();
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: getErrorMessage(
          err,
          "Não foi possível guardar as alterações.",
          "Cabinets:update",
        ),
        variant: "error",
        duration: 3500,
      });
    } finally {
      setEditSaving(false);
    }
  }, [previewMode, selectedNumero, editCategoriaId, loadCabinets]);

  const handleDelete = useCallback(async () => {
    if (previewMode) return;
    if (selectedNumero == null) return;
    setDeleteLoading(true);
    try {
      await deleteCabinet(selectedNumero);
      toast({
        title: "Armário removido",
        description: "O armário foi removido com sucesso.",
        variant: "success",
        duration: 3000,
      });
      setDeleteOpen(false);
      setSelectedNumero(null);
      await loadCabinets();
    } catch (err: unknown) {
      toast({
        title: "Não foi possível remover",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "Cabinets:delete",
        ),
        variant: "error",
        duration: 3500,
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [previewMode, selectedNumero, loadCabinets]);

  const filteredDetailRows = useMemo(() => {
    const base = stockItemsToDetailRows(stockRows);
    // Observação: com paginação, o filtro atua no servidor (por nome).
    // O filtro local aqui fica neutro para evitar “duplo filtro”.
    return base;
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
              {!previewMode ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={openEditModal}
                    aria-label="Editar armário"
                    disabled={deleteLoading || editSaving}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="Remover armário"
                    disabled={deleteLoading || editSaving}
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
                  <Label htmlFor="cab-filter-casela" className="text-xs">
                    Casela
                  </Label>
                  <Select value={filterCasela} onValueChange={setFilterCasela}>
                    <SelectTrigger
                      id="cab-filter-casela"
                      className="rounded-xl"
                    >
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Todas</SelectItem>
                      {caselaOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cab-filter-setor" className="text-xs">
                    Setor
                  </Label>
                  <Select value={filterSetor} onValueChange={setFilterSetor}>
                    <SelectTrigger id="cab-filter-setor" className="rounded-xl">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Todos</SelectItem>
                      <SelectItem value="farmacia">Farmácia</SelectItem>
                      <SelectItem value="enfermagem">Enfermagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cab-filter-lote" className="text-xs">
                    Lote
                  </Label>
                  <Input
                    id="cab-filter-lote"
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
                  />

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
              message={`Remover o armário nº ${selectedNumero}?`}
            />

            <Dialog
              open={editOpen}
              onOpenChange={(open) => {
                if (editSaving) return;
                setEditOpen(open);
              }}
            >
              <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Editar armário</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label>Armário</Label>
                    <div className="rounded-xl border bg-muted px-4 py-2 text-sm">
                      Armário nº {selectedNumero}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cabinet-categoria">Categoria</Label>
                    <Select
                      value={editCategoriaId}
                      onValueChange={setEditCategoriaId}
                      disabled={editSaving}
                    >
                      <SelectTrigger
                        id="cabinet-categoria"
                        className="rounded-xl"
                      >
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setEditOpen(false)}
                    disabled={editSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                  >
                    {editSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        ) : null}
      </div>
    </Layout>
  );
}
