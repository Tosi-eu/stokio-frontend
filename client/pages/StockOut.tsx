import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { toast } from "@/hooks/use-toast.hook";
import { useRouter } from "next/navigation";
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
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { stockOutQuantitySchema } from "@/schemas/stock-out.schema";
import { getErrorMessage } from "@/helpers/validation.helper";

import { AnimatePresence, motion } from "framer-motion";
import Pagination from "@/components/Pagination";
import QuantityStep from "@/components/QuantityStep";

import { OperationType, StockWizardSteps } from "@/utils/enums";
import { StockItemRaw } from "@/interfaces/interfaces";
import StepType from "@/components/StepType";
import StepItems from "@/components/StepItens";

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
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { TableFilter } from "@/components/TableFilter";

/** Itens por página — alinhado à API; evita carregar milhares de linhas na memória. */
const PAGE_SIZE = 24;

export default function StockOut() {
  const { uiDisplay } = useTenant();
  const { canMovementTipo } = usePermissionMatrix();
  const canSaida = canMovementTipo("saida");
  const router = useRouter();
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

  const [stockPage, setStockPage] = useState(1);

  const [filters, setFilters] = useState({
    nome: "",
    casela: "",
    setor: "",
    lote: "",
  });

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

  const quantityForm = useFormWithZod(stockOutQuantitySchema, {
    defaultValues: {
      quantity: 0,
    },
  });

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
        if (!cancelled) setResidents(mapped);
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
        displayCasela: uiDisplay.casela,
        caselaSetor: uiDisplay.caselaSetor,
        armarioMode: uiDisplay.armario,
      }),
    [
      apiFilterOptions,
      residents,
      filters.setor,
      uiDisplay.casela,
      uiDisplay.caselaSetor,
      uiDisplay.armario,
    ],
  );

  const caselaOptions = filterOptions.caselas;
  const setorOptions = filterOptions.sectors;
  const loteOptions = filterOptions.lots;

  const applyLocalFilters = useCallback(
    (list: StockItemRaw[]) => {
      const q = debouncedNome.trim().toLowerCase();
      return list.filter((item) => {
        if (q && !(item.nome ?? "").toLowerCase().includes(q)) return false;
        if (filters.casela && String(item.casela_id ?? "") !== filters.casela)
          return false;
        if (filters.setor && (item.setor ?? "") !== filters.setor) return false;
        if (filters.lote && (item.lote ?? "") !== filters.lote) return false;
        return true;
      });
    },
    [debouncedNome, filters.casela, filters.setor, filters.lote],
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
      const base = passedData.filter((i) => i.tipo_item === itemTypeFilter);
      const filtered = applyLocalFilters(base);
      setTotalCount(filtered.length);
      const start = (stockPage - 1) * PAGE_SIZE;
      setItems(filtered.slice(start, start + PAGE_SIZE));
      return;
    }

    setLoadingStock(true);
    try {
      const { data, total } = await fetchStockPage(stockPage, PAGE_SIZE, {
        nome: debouncedNome.trim() || undefined,
        casela: filters.casela || undefined,
        setor: filters.setor || undefined,
        lote: filters.lote || undefined,
        itemType: itemTypeFilter,
      });
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setStockPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const handleNomeFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, nome: value }));
  }, []);

  const handleSelectType = (type: OperationType) => {
    setOperationType(type);
    setSelected(null);
    setStockPage(1);
    setStep(StockWizardSteps.ITENS);
  };

  const handleSelectItem = (item: StockItemRaw | null) => {
    setSelected(item);
    if (item) {
      quantityForm.reset({ quantity: 0 });
      setStep(StockWizardSteps.QUANTIDADE);
    }
  };

  const handleConfirm = async () => {
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

    const isValid = await quantityForm.trigger();
    if (!isValid) return;

    const qty = quantityForm.getValues("quantity");
    if (!qty || qty <= 0 || qty > selected.quantidade) return;

    try {
      await createStockOut({
        estoqueId: selected.estoque_id,
        tipo: selected.tipo_item as OperationType,
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

  const handleBack = () => {
    if (step === StockWizardSteps.ITENS) setStep(StockWizardSteps.TIPO);
    else if (step === StockWizardSteps.QUANTIDADE)
      setStep(StockWizardSteps.ITENS);
  };

  const handleNext = () => {
    if (step === StockWizardSteps.TIPO && operationType !== "Selecione")
      setStep(StockWizardSteps.ITENS);
    else if (step === StockWizardSteps.ITENS && selected)
      setStep(StockWizardSteps.QUANTIDADE);
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
                  className="w-full border border-input bg-background p-2 rounded-lg flex justify-between items-center truncate"
                >
                  {filters.casela
                    ? (caselaOptions.find((o) => o.value === filters.casela)
                        ?.label ?? `Casela ${filters.casela}`)
                    : "Selecione"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar casela..." />
                  <CommandEmpty>Nenhum item encontrado</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() =>
                        setFilters((prev) => ({
                          ...prev,
                          casela: "",
                        }))
                      }
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.casela ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Todas
                    </CommandItem>
                    {caselaOptions.map((o) => (
                      <CommandItem
                        key={o.value}
                        value={o.value}
                        onSelect={() =>
                          setFilters((prev) => ({
                            ...prev,
                            casela: prev.casela === o.value ? "" : o.value,
                          }))
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.casela === o.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {o.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
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
                  className="w-full border border-input bg-background p-2 rounded-lg flex justify-between items-center truncate"
                >
                  {filters.setor || "Selecione"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar setor..." />
                  <CommandEmpty>Nenhum setor encontrado</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() =>
                        setFilters((prev) => ({ ...prev, setor: "" }))
                      }
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.setor ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Todos
                    </CommandItem>
                    {setorOptions.map((o) => (
                      <CommandItem
                        key={o.value}
                        value={o.value}
                        onSelect={() =>
                          setFilters((prev) => ({
                            ...prev,
                            setor: prev.setor === o.value ? "" : o.value,
                          }))
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.setor === o.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {o.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Lote
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full border border-input bg-background p-2 rounded-lg flex justify-between items-center truncate"
                >
                  {filters.lote || "Selecione"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar lote..." />
                  <CommandEmpty>Nenhum lote encontrado</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() =>
                        setFilters((prev) => ({ ...prev, lote: "" }))
                      }
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          !filters.lote ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Todos
                    </CommandItem>
                    {loteOptions.map((o) => (
                      <CommandItem
                        key={o.value}
                        value={o.value}
                        onSelect={() =>
                          setFilters((prev) => ({
                            ...prev,
                            lote: prev.lote === o.value ? "" : o.value,
                          }))
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.lote === o.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {o.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden max-w-7xl mx-auto rounded-xl border border-border bg-card p-8 md:p-10 shadow-sm mt-8">
        {step !== StockWizardSteps.TIPO && (
          <button
            onClick={handleBack}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full border bg-white shadow"
          >
            ←
          </button>
        )}

        {step !== StockWizardSteps.QUANTIDADE && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full border bg-white shadow"
          >
            →
          </button>
        )}

        <div className="min-h-[380px] flex flex-col items-center justify-center gap-4">
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
                <>
                  {loadingStock && (
                    <p className="text-sm text-muted-foreground text-center">
                      Carregando itens…
                    </p>
                  )}
                  <StepItems
                    items={items}
                    selected={selected}
                    onSelectItem={handleSelectItem}
                  />
                </>
              </motion.div>
            )}

            {step === StockWizardSteps.QUANTIDADE && (
              <motion.div
                key="quantidade"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-6xl"
              >
                <QuantityStep
                  item={selected}
                  quantity={quantityForm.watch("quantity") || 0}
                  quantityRegister={quantityForm.register("quantity", {
                    valueAsNumber: true,
                  })}
                  quantityErrors={quantityForm.formState.errors}
                  isSubmitting={quantityForm.formState.isSubmitting}
                  onBack={() => {
                    quantityForm.reset();
                    setStep(StockWizardSteps.ITENS);
                  }}
                  onConfirm={handleConfirm}
                />
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
                    {(stockPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(stockPage * PAGE_SIZE, totalCount)}
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
