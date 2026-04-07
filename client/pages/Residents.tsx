import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";
import { getResidents } from "@/api/requests";
import { DEFAULT_PAGE_SIZE } from "@/helpers/paginacao.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import {
  PREVIEW_RESIDENTS,
  filterPreviewStockByCasela,
} from "@/helpers/preview-mock-data";
import { fetchStockPage, formatStockItems } from "@/helpers/stock-list.helper";
import { setSpaNavigationState } from "@/helpers/spa-navigation-state.helper";
import type { StockItem } from "@/interfaces/interfaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { OperationType, StockTypeLabels } from "@/utils/enums";
import { ClipboardList, Pencil, UserRound } from "lucide-react";

type ResidentRow = { name: string; casela: number };

const PRONTUARIO_COLUMNS = [
  { key: "kind", label: "Categoria", editable: false },
  { key: "stockType", label: "Tipo estoque", editable: false },
  { key: "name", label: "Nome", editable: false },
  { key: "quantity", label: "Qtd.", editable: false },
  { key: "expiry", label: "Validade", editable: false },
  { key: "cabinet", label: "Armário", editable: false },
  { key: "drawer", label: "Gaveta", editable: false },
  { key: "sector", label: "Setor", editable: false },
  { key: "lot", label: "Lote", editable: false },
];

function itemKindLabel(item: StockItem): string {
  return item.itemType === OperationType.MEDICINE ? "Medicamento" : "Insumo";
}

function stockTypeDisplay(raw: unknown): string {
  if (raw == null || raw === "") return "—";
  const s = String(raw);
  if (s in StockTypeLabels) {
    return StockTypeLabels[s as keyof typeof StockTypeLabels];
  }
  return s;
}

function stockToProntuarioRows(items: StockItem[]): Record<string, unknown>[] {
  return items.map((i) => ({
    kind: itemKindLabel(i),
    stockType: stockTypeDisplay(i.stockType),
    name: i.name,
    quantity: i.quantity,
    expiry: i.expiry,
    cabinet: i.cabinet ?? "—",
    drawer: i.drawer ?? "—",
    sector: i.sector ?? "—",
    lot: i.lot ?? "—",
  }));
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function Resident() {
  const { previewMode } = useTenant();
  const router = useRouter();
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCasela, setSelectedCasela] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [prontuarioItems, setProntuarioItems] = useState<StockItem[]>([]);
  const [prontuarioLoading, setProntuarioLoading] = useState(false);

  const loadResidents = useCallback(async () => {
    setLoading(true);
    try {
      if (previewMode) {
        const start = (page - 1) * DEFAULT_PAGE_SIZE;
        const slice = PREVIEW_RESIDENTS.slice(start, start + DEFAULT_PAGE_SIZE);
        setResidents(slice);
        setHasNext(start + DEFAULT_PAGE_SIZE < PREVIEW_RESIDENTS.length);
        return;
      }

      const res = await getResidents(page, DEFAULT_PAGE_SIZE);
      const mapped = (Array.isArray(res.data) ? res.data : []).map((r) => ({
        name: String(r.name ?? ""),
        casela: Number(r.casela),
      }));
      setResidents(mapped);
      setHasNext(Boolean(res.hasNext));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar a lista de residentes.";
      toast({
        title: "Erro ao carregar residentes",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
      setResidents([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [previewMode, page]);

  useEffect(() => {
    void loadResidents();
  }, [loadResidents]);

  useEffect(() => {
    // Não auto-seleciona: permite que a lista fique sem seleção.
    // Só limpa a seleção quando o item selecionado deixa de existir após filtragens/updates.
    setSelectedCasela((prev) => {
      if (prev == null) return null;
      return residents.some((r) => r.casela === prev) ? prev : null;
    });
  }, [residents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || String(r.casela).includes(q.trim()),
    );
  }, [residents, search]);

  const selected = useMemo(
    () => residents.find((r) => r.casela === selectedCasela) ?? null,
    [residents, selectedCasela],
  );

  const loadProntuario = useCallback(
    async (casela: number) => {
      setProntuarioLoading(true);
      try {
        const { data } = await fetchStockPage(1, 100, {
          casela: String(casela),
        });
        let formatted = formatStockItems(data);
        if (previewMode && formatted.length === 0) {
          formatted = filterPreviewStockByCasela(casela);
        }
        setProntuarioItems(formatted);
      } catch {
        if (previewMode) {
          setProntuarioItems(filterPreviewStockByCasela(casela));
        } else {
          toast({
            title: "Erro ao carregar prontuário",
            description:
              "Não foi possível listar medicamentos e insumos desta casela.",
            variant: "error",
            duration: 3000,
          });
          setProntuarioItems([]);
        }
      } finally {
        setProntuarioLoading(false);
      }
    },
    [previewMode],
  );

  useEffect(() => {
    if (selected == null) {
      setProntuarioItems([]);
      return;
    }
    void loadProntuario(selected.casela);
  }, [selected, loadProntuario]);

  const prontuarioRows = useMemo(
    () => stockToProntuarioRows(prontuarioItems),
    [prontuarioItems],
  );

  return (
    <Layout title="Residentes">
      <div className="pt-8 pb-12 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground max-w-xl">
            Cartões por casela: toque para ver os detalhes à direita (ou abaixo,
            em ecrãs pequenos). A busca filtra por nome ou número da casela.
          </p>
          {!previewMode ? (
            <Button asChild className="rounded-xl">
              <Link href="/residents/register">Novo residente</Link>
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-5 space-y-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou casela…"
              className="rounded-xl"
            />
            {loading ? (
              <SkeletonTable rows={5} cols={2} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                {filtered.map((r) => {
                  const active = selectedCasela === r.casela;
                  return (
                    <button
                      key={r.casela}
                      type="button"
                      onClick={() =>
                        setSelectedCasela((prev) =>
                          prev === r.casela ? null : r.casela,
                        )
                      }
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active
                          ? "border-primary bg-primary/8 shadow-md"
                          : "border-border/80 bg-card hover:border-primary/30 hover:bg-accent/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100",
                        )}
                      >
                        {initials(r.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {r.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Casela {r.casela}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!loading && filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum residente corresponde à busca.
              </p>
            ) : null}

            {!loading ? (
              <div className="flex items-center justify-center gap-3 pt-2">
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
                <span className="text-sm text-muted-foreground">
                  Página {page}
                </span>
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
          </div>

          <div className="xl:col-span-7">
            {selected ? (
              <section className="rounded-2xl border border-border/70 bg-card shadow-elevated overflow-hidden ring-1 ring-black/[0.02] dark:ring-white/[0.04] h-full min-h-[280px]">
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100">
                      <UserRound className="h-12 w-12" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="font-display text-2xl font-semibold tracking-tight">
                        {selected.name}
                      </h2>
                      <p className="text-muted-foreground">
                        Casela{" "}
                        <span className="font-medium text-foreground">
                          {selected.casela}
                        </span>
                      </p>
                      {previewMode ? (
                        <p className="text-sm text-amber-800 dark:text-amber-200/90 pt-2">
                          Modo de visualização: não é possível alterar
                          cadastros.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-border/60 pt-6">
                    <div>
                      <dt className="text-muted-foreground">Nome completo</dt>
                      <dd className="font-medium mt-1">{selected.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Casela</dt>
                      <dd className="font-medium mt-1">{selected.casela}</dd>
                    </div>
                  </dl>

                  <div className="border-t border-border/60 pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <ClipboardList
                        className="h-5 w-5 text-muted-foreground shrink-0"
                        aria-hidden
                      />
                      <h3 className="text-base font-semibold tracking-tight">
                        Prontuário
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Medicamentos e insumos em estoque vinculados a esta casela
                      (origem: estoque).
                    </p>
                    {prontuarioLoading ? (
                      <SkeletonTable rows={4} cols={4} />
                    ) : prontuarioRows.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center rounded-xl border border-dashed border-border/70">
                        Nenhum item vinculado a esta casela no estoque.
                      </p>
                    ) : (
                      <EditableTable
                        columns={PRONTUARIO_COLUMNS}
                        data={prontuarioRows}
                        readOnly
                        showAddons={false}
                      />
                    )}
                  </div>

                  {!previewMode ? (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl gap-2"
                        onClick={() => {
                          setSpaNavigationState({
                            item: {
                              name: selected.name,
                              casela: selected.casela,
                            },
                          });
                          router.push("/residents/edit");
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar residente
                      </Button>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center text-muted-foreground">
                Selecione um residente na lista.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
