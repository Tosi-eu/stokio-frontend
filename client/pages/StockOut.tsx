import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { toast } from "@/hooks/use-toast.hook";
import { useNavigate, useLocation } from "react-router-dom";
import { createStockOut, getResidents, getStock } from "@/api/requests";
import { useUiDisplay } from "@/context/ui-display-context";
import {
  caselaFilterLabel,
  caselaModeForContext,
} from "@/helpers/ui-display.helper";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { stockOutQuantitySchema } from "@/schemas/stock-out.schema";

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

const UI_PAGE_SIZE = 6;

export default function StockOut() {
  const { uiDisplay } = useUiDisplay();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: passedData } = location.state || {};
  const [items, setItems] = useState<StockItemRaw[]>([]);
  const [residents, setResidents] = useState<
    Array<{ casela: number; name: string }>
  >([]);

  const [uiPage, setUiPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    nome: "",
    casela: "",
    setor: "",
    lote: "",
  });

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

  async function fetchStock() {
    try {
      if (passedData && passedData.length > 0) {
        const filtered =
          operationType !== "Selecione"
            ? passedData.filter(
                (item: StockItemRaw) => item.tipo_item === operationType,
              )
            : passedData;
        setItems(filtered as StockItemRaw[]);
      } else {
        const allItems = await fetchAllPaginated(
          (page, limit) => getStock(page, limit),
          100,
        );
        const filtered =
          operationType !== "Selecione"
            ? allItems.filter(
                (item: StockItemRaw) => item.tipo_item === operationType,
              )
            : allItems;
        setItems(filtered as StockItemRaw[]);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao carregar estoque",
        description: "Não foi possível carregar os dados.",
        variant: "error",
        duration: 3000,
      });
    }
  }

  useEffect(() => {
    fetchStock();
    const id = setTimeout(() => {
      setUiPage(1);
      setSelected(null);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchStock intentionally omitted
  }, [operationType]);

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

  const nameOptions = useMemo(
    () =>
      Array.from(new Set(items.map((i) => i.nome).filter(Boolean))).map(
        (name) => ({ label: name, value: name }),
      ),
    [items],
  );

  const caselaIdsFromItems = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((i) => i.casela_id)
            .filter((id): id is number => id !== null && id !== undefined),
        ),
      ),
    [items],
  );

  const caselaOptions = useMemo(() => {
    const sector = filters.setor || "";
    const eff = caselaModeForContext(
      uiDisplay.casela,
      uiDisplay.caselaSetor,
      sector,
    );
    if (filters.setor === "enfermagem" && residents.length > 0) {
      return residents
        .filter((r) => caselaIdsFromItems.includes(r.casela))
        .sort((a, b) =>
          eff === "nome"
            ? a.name.localeCompare(b.name, "pt-BR")
            : a.casela - b.casela,
        )
        .map((r) => ({
          label:
            eff === "nome"
              ? r.name
              : caselaFilterLabel(r.casela, r.name, uiDisplay, sector),
          value: String(r.casela),
        }));
    }
    return caselaIdsFromItems
      .sort((a, b) => {
        if (eff === "nome" && residents.length > 0) {
          const na = residents.find((r) => r.casela === a)?.name ?? "";
          const nb = residents.find((r) => r.casela === b)?.name ?? "";
          return na.localeCompare(nb, "pt-BR");
        }
        return a - b;
      })
      .map((id) => {
        const r = residents.find((x) => x.casela === id);
        return {
          label: caselaFilterLabel(id, r?.name ?? null, uiDisplay, sector),
          value: String(id),
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caselaIdsFromItems already from items
  }, [
    items,
    residents,
    filters.setor,
    caselaIdsFromItems,
    uiDisplay.casela,
    uiDisplay.caselaSetor,
  ]);

  const setorOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.setor).filter(Boolean)) as Set<string>,
      )
        .sort()
        .map((s) => ({ label: s, value: s })),
    [items],
  );

  const loteOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((i) => i.lote)
            .filter((l): l is string => l != null && l !== ""),
        ),
      )
        .sort()
        .map((l) => ({ label: l, value: l })),
    [items],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.nome && item.nome !== filters.nome) return false;
      if (filters.casela && String(item.casela_id ?? "") !== filters.casela)
        return false;
      if (filters.setor && (item.setor ?? "") !== filters.setor) return false;
      if (filters.lote && (item.lote ?? "") !== filters.lote) return false;
      return true;
    });
  }, [items, filters]);

  const paginatedItems = useMemo(() => {
    const start = (uiPage - 1) * UI_PAGE_SIZE;
    const end = start + UI_PAGE_SIZE;
    return filteredItems.slice(start, end);
  }, [filteredItems, uiPage]);

  useEffect(() => {
    const id = setTimeout(() => {
      setUiPage(1);
      setSelected(null);
      setTotalPages(
        Math.max(1, Math.ceil(filteredItems.length / UI_PAGE_SIZE)),
      );
    }, 0);
    return () => clearTimeout(id);
  }, [filteredItems]);

  const handleSelectType = (type: OperationType) => {
    setOperationType(type);
    setSelected(null);
    setUiPage(1);
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

      navigate("/stock");
    } catch (err: unknown) {
      toast({
        title: "Erro ao registrar saída",
        description: err instanceof Error ? err.message : "Erro inesperado.",
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
      <div className="bg-white p-6 rounded-lg border border-gray-300 max-w-7xl mx-auto mt-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Nome</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white">
                  {filters.nome || "Selecione"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar nome..." />
                  <CommandEmpty>Nenhum item encontrado</CommandEmpty>
                  <CommandGroup>
                    {nameOptions.map((o) => (
                      <CommandItem
                        key={o.value}
                        value={o.value}
                        onSelect={() =>
                          setFilters((prev) => ({
                            ...prev,
                            nome: prev.nome === o.value ? "" : o.value,
                          }))
                        }
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            filters.nome === o.value
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
            <label className="block text-xs text-gray-700 mb-1">Casela</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white">
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
            <label className="block text-xs text-gray-700 mb-1">Setor</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white">
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
            <label className="block text-xs text-gray-700 mb-1">Lote</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white">
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

      <div className="relative overflow-hidden max-w-7xl mx-auto bg-white border border-slate-400 rounded-xl p-10 px-16 shadow-sm mt-10">
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

        <div className="min-h-[380px] flex items-center justify-center">
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
                <StepItems
                  items={paginatedItems}
                  allItemsCount={filteredItems.length}
                  page={uiPage}
                  pageSize={UI_PAGE_SIZE}
                  totalPages={totalPages}
                  selected={selected}
                  onSelectItem={handleSelectItem}
                  onBack={() => setStep(StockWizardSteps.TIPO)}
                  setPage={setUiPage}
                />
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
          <div className="mt-8 flex justify-center">
            <Pagination
              page={uiPage}
              totalPages={totalPages}
              onChange={setUiPage}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
