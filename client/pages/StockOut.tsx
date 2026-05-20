import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { toast } from "@/hooks/use-toast.hook";
import { useRouter, useSearchParams } from "next/navigation";
import { consumeSpaNavigationState } from "@/helpers/spa-navigation-state.helper";
import {
  createStockOut,
  getResidents,
  getStockFilterOptions,
} from "@/api/requests";
import {
  buildFilterOptionsFromApi,
  fetchStockPage,
  type ApiFilterOptions,
} from "@/helpers/stock-list.helper";
import { getErrorMessage } from "@/helpers/validation.helper";
import { toCatalogOperationType } from "@/helpers/stock-catalog-type.helper";

import { AnimatePresence, motion } from "framer-motion";
import Pagination from "@/components/Pagination";

import { OperationType, StockWizardSteps } from "@/utils/enums";
import { StockItemRaw } from "@/interfaces/interfaces";
import StepType from "@/components/StepType";
import { StockOutTable } from "@/components/stock-out/StockOutTable";
import { StockOutDrawer } from "@/components/stock-out/StockOutDrawer";

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
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useTenantSetores } from "@/hooks/use-tenant-setores.hook";
import {
  buildSectorFilterOptions,
  getEnabledSectors,
  resolveSectorProfile,
} from "@/helpers/tenant-sectors.helper";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { compareResidentsByNameThenCasela } from "@/helpers/resident-sort.helper";
import {
  formatResidentCaselaAutocompleteLabel,
  matchesResidentCaselaSearch,
} from "@/helpers/resident-casela-autocomplete.helper";
import { TableFilter } from "@/components/TableFilter";
import { STOCK_OUT_PAGE_SIZE } from "@/components/stock-out/stock-out.constants";

export default function StockOut() {
  const { uiDisplay, modules } = useTenant();
  const { profilesByKey, labelByKey } = useTenantSetores();

  const sectorKeys = useMemo(() => getEnabledSectors(modules), [modules]);

  const sectorFilterOptions = useMemo(
    () => buildSectorFilterOptions(sectorKeys, labelByKey),
    [sectorKeys, labelByKey],
  );
  const { canMovementTipo } = usePermissionMatrix();
  const canSaida = canMovementTipo("saida");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialNav] = useState(() =>
    consumeSpaNavigationState<{ data?: StockItemRaw[] }>(),
  );
  const passedData = initialNav?.data;
  const usingPassedData = Boolean(passedData?.length);

  const [items, setItems] = useState<StockItemRaw[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingStock, setLoadingStock] = useState(false);
  const [apiFilterOptions, setApiFilterOptions] =
    useState<ApiFilterOptions | null>(null);

  const [residents, setResidents] = useState<
    Array<{ casela: number; name: string }>
  >([]);

  const [caselaSearch, setCaselaSearch] = useState("");
  const [setorSearch, setSetorSearch] = useState("");

  const [stockPage, setStockPage] = useState(1);

  const [filters, setFilters] = useState({
    nome: "",
    casela: "",
    setor: "",
    lote: "",
    armario: "",
    gaveta: "",
  });

  useEffect(() => {
    const cab = searchParams.get("cabinet");
    const drw = searchParams.get("drawer");
    if (cab || drw) {
      setFilters((prev) => ({
        ...prev,
        ...(cab ? { armario: cab } : {}),
        ...(drw ? { gaveta: drw } : {}),
      }));
    }
  }, [searchParams]);

  const setorProfileForFilters = useMemo(
    () =>
      filters.setor
        ? resolveSectorProfile(filters.setor, profilesByKey)
        : undefined,
    [filters.setor, profilesByKey],
  );

  const [debouncedNome, setDebouncedNome] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedNome(filters.nome);
    }, 400);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [filters.nome]);

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      nome: debouncedNome,
    }),
    [debouncedNome, filters],
  );

  const [step, setStep] = useState<StockWizardSteps>(StockWizardSteps.TIPO);
  const [operationType, setOperationType] = useState<
    OperationType | "Selecione"
  >("Selecione");
  const [selected, setSelected] = useState<StockItemRaw | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const itemTypeFilter =
    operationType !== "Selecione" &&
    (operationType === OperationType.MEDICINE ||
      operationType === OperationType.INPUT)
      ? operationType
      : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const opts = await getStockFilterOptions();
        if (!cancelled) setApiFilterOptions(opts ?? null);
      } catch {
        if (!cancelled) setApiFilterOptions(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllPaginated(
          (page, limit) => getResidents(page, limit),
          100,
        );
        const mapped = (list as Array<{ casela: number; name: string }>).map(
          (r) => ({ casela: r.casela, name: r.name }),
        );
        if (!cancelled) {
          setResidents(mapped.sort(compareResidentsByNameThenCasela));
        }
      } catch {
        if (!cancelled) setResidents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filterOptions = useMemo(
    () =>
      buildFilterOptionsFromApi(apiFilterOptions, {
        residents,
        setor: filters.setor,
        setorProfile: setorProfileForFilters,
        sectorFilterOptions,
        displayCasela: uiDisplay.casela,
        caselaSetor: uiDisplay.caselaSetor,
        armarioMode: uiDisplay.armario,
      }),
    [
      apiFilterOptions,
      residents,
      filters.setor,
      setorProfileForFilters,
      sectorFilterOptions,
      uiDisplay.casela,
      uiDisplay.caselaSetor,
      uiDisplay.armario,
    ],
  );

  const caselaOptions = filterOptions.caselas;
  const setorOptions = filterOptions.sectors;

  const filteredSetorOptions = useMemo(() => {
    if (!setorSearch.trim()) return setorOptions;
    const q = setorSearch.trim().toLowerCase();
    return setorOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [setorOptions, setorSearch]);
  const filteredCaselaOptions = useMemo(() => {
    if (!caselaSearch.trim()) return caselaOptions;
    const q = caselaSearch.trim();
    const ql = q.toLowerCase();
    return caselaOptions.filter((o) => {
      if (o.label.toLowerCase().includes(ql) || o.value.includes(q.trim())) {
        return true;
      }
      const r = residents.find((x) => String(x.casela) === o.value);
      return r ? matchesResidentCaselaSearch(r, q) : false;
    });
  }, [caselaOptions, caselaSearch, residents]);

  const applyLocalFilters = useCallback(
    (list: StockItemRaw[]) => {
      const q = debouncedNome.trim().toLowerCase();
      return list.filter((item) => {
        if (Number(item.quantidade ?? 0) <= 0) return false;
        if (q && !(item.nome ?? "").toLowerCase().includes(q)) return false;
        if (filters.casela && String(item.casela_id ?? "") !== filters.casela)
          return false;
        if (
          filters.armario &&
          String(item.armario_id ?? "") !== filters.armario.trim()
        )
          return false;
        if (
          filters.gaveta &&
          String(item.gaveta_id ?? "") !== filters.gaveta.trim()
        )
          return false;
        if (filters.setor && (item.setor ?? "") !== filters.setor) return false;
        if (
          filters.lote.trim() &&
          !(item.lote ?? "")
            .toLowerCase()
            .includes(filters.lote.trim().toLowerCase())
        )
          return false;
        return true;
      });
    },
    [
      debouncedNome,
      filters.casela,
      filters.armario,
      filters.gaveta,
      filters.setor,
      filters.lote,
    ],
  );

  const loadStock = useCallback(async () => {
    if (!itemTypeFilter) {
      setItems([]);
      setTotalCount(0);
      return;
    }

    if (step !== StockWizardSteps.ITENS) {
      return;
    }

    if (usingPassedData && passedData) {
      const base = passedData.filter(
        (i) => toCatalogOperationType(i.tipo_item) === itemTypeFilter,
      );
      const filtered = applyLocalFilters(base);
      setTotalCount(filtered.length);
      const start = (stockPage - 1) * STOCK_OUT_PAGE_SIZE;
      setItems(filtered.slice(start, start + STOCK_OUT_PAGE_SIZE));
      return;
    }

    setLoadingStock(true);
    try {
      const { data, total } = await fetchStockPage(
        stockPage,
        STOCK_OUT_PAGE_SIZE,
        {
          nome: debouncedNome.trim() || undefined,
          casela: filters.casela || undefined,
          setor: filters.setor || undefined,
          lote: filters.lote.trim() || undefined,
          armario: filters.armario.trim() || undefined,
          gaveta: filters.gaveta.trim() || undefined,
          itemType: itemTypeFilter,
          onlyInStock: true,
        },
      );
      setItems((data ?? []) as StockItemRaw[]);
      setTotalCount(Number(total ?? 0));
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao carregar estoque",
        description: "Não foi possível carregar os dados.",
        variant: "error",
        duration: 3000,
      });
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoadingStock(false);
    }
  }, [
    itemTypeFilter,
    usingPassedData,
    passedData,
    applyLocalFilters,
    stockPage,
    debouncedNome,
    filters.casela,
    filters.armario,
    filters.gaveta,
    filters.setor,
    filters.lote,
    step,
  ]);

  useEffect(() => {
    void loadStock();
  }, [loadStock]);

  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef(effectiveFilters);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = effectiveFilters;
      return;
    }

    const filtersChanged =
      prevFiltersRef.current.nome !== effectiveFilters.nome ||
      prevFiltersRef.current.casela !== effectiveFilters.casela ||
      prevFiltersRef.current.setor !== effectiveFilters.setor ||
      prevFiltersRef.current.lote !== effectiveFilters.lote;

    if (filtersChanged) {
      setStockPage(1);
      setSelected(null);
      prevFiltersRef.current = effectiveFilters;
    }
  }, [effectiveFilters]);

  useEffect(() => {
    setStockPage(1);
    setSelected(null);
  }, [operationType]);

  const totalPages = Math.max(1, Math.ceil(totalCount / STOCK_OUT_PAGE_SIZE));

  useEffect(() => {
    setStockPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const handleNomeFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, nome: value }));
  }, []);

  const handleLoteFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, lote: value }));
  }, []);

  const handleSelectType = (type: OperationType) => {
    setOperationType(type);
    setSelected(null);
    setStockPage(1);
    setStep(StockWizardSteps.ITENS);
  };

  const handleSelectItem = (item: StockItemRaw | null) => {
    setSelected(item);
    setDrawerOpen(Boolean(item));
  };

  const handleConfirm = async (qty: number) => {
    if (!selected) return;
    if (!canSaida) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para dar saída no estoque.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await createStockOut({
        estoqueId: selected.estoque_id,
        tipo: toCatalogOperationType(selected.tipo_item),
        quantidade: qty,
      });

      toast({
        title: "Saída registrada!",
        description: "Item removido do estoque.",
        variant: "success",
        duration: 3000,
      });

      router.push("/stock");
    } catch (err: unknown) {
      toast({
        title: "Erro ao registrar saída",
        description: getErrorMessage(
          err,
          "Não foi possível registar a saída. Tente novamente.",
          "StockOut:submit",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Saída de Estoque">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm max-w-7xl mx-auto mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="min-w-0">
            <label className="block text-xs text-muted-foreground mb-1">
              Nome
            </label>
            <TableFilter
              placeholder="Buscar por nome"
              onFilterChange={handleNomeFilterChange}
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Casela
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full border border-input bg-background p-2 rounded-lg flex justify-between items-center min-w-0 gap-2"
                >
                  <span
                    className={
                      filters.casela
                        ? "truncate text-left"
                        : "truncate text-left text-muted-foreground"
                    }
                  >
                    {filters.casela
                      ? (() => {
                          const found = caselaOptions.find(
                            (o) => o.value === filters.casela,
                          );
                          if (found?.label) return found.label;
                          const id = Number(filters.casela);
                          const r = residents.find((x) => x.casela === id);
                          return r
                            ? formatResidentCaselaAutocompleteLabel(r)
                            : `Casela ${filters.casela}`;
                        })()
                      : "Todas as caselas"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar por nome ou casela…"
                    value={caselaSearch}
                    onValueChange={setCaselaSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum item encontrado</CommandEmpty>
                    <CommandGroup>
                      {filteredCaselaOptions.map((o) => (
                        <CommandItem
                          key={o.value}
                          value={`${o.value}-${o.label}`}
                          onSelect={() => {
                            setFilters((prev) => ({
                              ...prev,
                              casela: prev.casela === o.value ? "" : o.value,
                            }));
                            setCaselaSearch("");
                          }}
                        >
                          {o.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Setor
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full border border-input bg-background p-2 rounded-lg flex justify-between items-center min-w-0 gap-2"
                >
                  <span
                    className={
                      filters.setor
                        ? "truncate text-left"
                        : "truncate text-left text-muted-foreground"
                    }
                  >
                    {filters.setor
                      ? setorOptions.find((o) => o.value === filters.setor)
                          ?.label || filters.setor
                      : "Todos os setores"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar setor..."
                    value={setorSearch}
                    onValueChange={setSetorSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum setor encontrado</CommandEmpty>
                    <CommandGroup>
                      {filteredSetorOptions.map((o) => (
                        <CommandItem
                          key={o.value}
                          value={o.value}
                          onSelect={() => {
                            setFilters((prev) => ({
                              ...prev,
                              setor: prev.setor === o.value ? "" : o.value,
                            }));
                            setSetorSearch("");
                          }}
                        >
                          {o.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="min-w-0">
            <label className="block text-xs text-muted-foreground mb-1">
              Lote
            </label>
            <TableFilter
              placeholder="Buscar por lote"
              onFilterChange={handleLoteFilterChange}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden max-w-7xl mx-auto rounded-xl border border-border bg-card p-8 md:p-10 shadow-sm mt-8">
        <div
          className={cn(
            "min-h-[380px] flex flex-col gap-4 w-full",
            step === StockWizardSteps.ITENS
              ? "items-stretch"
              : "items-center justify-center",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {step === StockWizardSteps.TIPO && (
              <motion.div
                key="tipo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-md"
              >
                <StepType value={operationType} onSelect={handleSelectType} />
              </motion.div>
            )}

            {step === StockWizardSteps.ITENS && (
              <motion.div
                key="itens"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="w-full"
              >
                <div className="w-full min-w-0 space-y-4">
                  <StockOutTable
                    items={items}
                    selected={selected}
                    loading={loadingStock}
                    onSelect={handleSelectItem}
                  />

                  <StockOutDrawer
                    open={drawerOpen}
                    item={selected}
                    submitting={false}
                    onOpenChange={(open) => {
                      setDrawerOpen(open);
                      if (!open) setSelected(null);
                    }}
                    onConfirm={(qty) => void handleConfirm(qty)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === StockWizardSteps.ITENS && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {totalCount === 0 ? (
                <>Nenhum item encontrado para os filtros atuais.</>
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-medium text-foreground">
                    {(stockPage - 1) * STOCK_OUT_PAGE_SIZE + 1}–
                    {Math.min(stockPage * STOCK_OUT_PAGE_SIZE, totalCount)}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {totalCount}
                  </span>
                </>
              )}
            </p>
            <Pagination
              page={stockPage}
              totalPages={totalPages}
              onChange={setStockPage}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
