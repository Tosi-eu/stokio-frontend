import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StockItem } from "@/interfaces/interfaces";
import { lazy, Suspense } from "react";

const ReportModal = lazy(() => import("@/components/ReportModal"));
import {
  getStockFilterOptions,
  removeIndividualMedicineFromStock,
  resumeMedicineFromStock,
  suspendMedicineFromStock,
  removeIndividualInputFromStock,
  resumeInputFromStock,
  suspendInputFromStock,
  transferStockSector,
  getResidents,
} from "@/api/requests";
import { ItemStockType, SectorType } from "@/utils/enums";
import { StockActionType, StockItemType } from "@/interfaces/types";
import {
  fetchStockPage,
  formatStockItems,
  buildFilterOptionsFromApi,
} from "@/helpers/stock-list.helper";
import ConfirmActionModal from "@/components/ConfirmationActionModal";
import TransferQuantityModal from "@/components/TransferQuantityModal";
import {
  actionConfig,
  actionMessages,
  actionTitles,
} from "@/helpers/toaster.helper";
import { toast } from "@/hooks/use-toast.hook";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, X } from "lucide-react";
import { TableFilter } from "@/components/TableFilter";

const FILTER_LABELS: Record<string, string> = {
  belowMin: "Abaixo do estoque mínimo",
  nearMin: "Próximos do estoque mínimo",
  expired: "Vencidos",
  expiringSoon: "Vencimento próximo",
};

export default function Stock() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const filter = params.get("filter"); // "noStock" | "belowMin" | "expired" | "expiringSoon"

  const stockBreadcrumb = useMemo(
    () =>
      filter && FILTER_LABELS[filter]
        ? [
            { label: "Estoque", path: "/stock" },
            { label: FILTER_LABELS[filter] },
          ]
        : undefined,
    [filter],
  );

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [items, setItems] = useState<StockItem[]>([]);
  const [apiFilterOptions, setApiFilterOptions] = useState<{
    cabinets: number[];
    caselas: number[];
    lots: string[];
  } | null>(null);
  const [page, setPage] = useState(1);
  const limit = 8;
  const [hasNext, setHasNext] = useState(false);
  const [filters, setFilters] = useState({
    nome: "",
    casela: "",
    armario: "",
    setor: "",
    lote: "",
  });

  const [debouncedNome, setDebouncedNome] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [armarioSearch, setArmarioSearch] = useState("");
  const [caselaSearch, setCaselaSearch] = useState("");

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedNome(filters.nome);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters.nome]);

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
      nome: debouncedNome,
    }),
    [debouncedNome, filters],
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: StockActionType;
    row: StockItem | null;
  }>({ type: null, row: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState<
    Array<{ casela: number; name: string }>
  >([]);

  async function loadStock(pageToLoad: number, currentFilters = filters) {
    setLoading(true);
    try {
      const { data, hasNext } = await fetchStockPage(
        pageToLoad,
        limit,
        currentFilters,
        filter,
      );
      setItems(formatStockItems(data));
      setHasNext(hasNext);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os itens do estoque.";
      toast({
        title: "Erro ao carregar estoque",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadFilterOptions() {
    try {
      const res = await getStockFilterOptions();
      setApiFilterOptions(res ?? null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as opções de filtro.";
      toast({
        title: "Erro ao carregar opções",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
    }
  }

  async function loadResidents() {
    try {
      const allResidents = await fetchAllPaginated(
        (page, limit) => getResidents(page, limit),
        100,
      );
      setResidents(
        allResidents.map((r: { casela: number; name: string }) => ({
          casela: r.casela,
          name: r.name,
        })),
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os residentes.";
      toast({
        title: "Erro ao carregar residentes",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadStock(1), loadFilterOptions(), loadResidents()]);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

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
      prevFiltersRef.current.armario !== effectiveFilters.armario ||
      prevFiltersRef.current.setor !== effectiveFilters.setor ||
      prevFiltersRef.current.lote !== effectiveFilters.lote;

    if (filtersChanged) {
      setPage(1);
      prevFiltersRef.current = effectiveFilters;
    }
  }, [effectiveFilters]);

  const prevFilterRef = useRef<string | null>(undefined);

  useEffect(() => {
    const hadFilter =
      prevFilterRef.current != null && prevFilterRef.current !== undefined;
    const nowCleared = filter == null;
    prevFilterRef.current = filter ?? null;
    if (hadFilter && nowCleared) {
      setPage(1);
    }
  }, [filter]);

  useEffect(() => {
    loadStock(page, effectiveFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadStock is stable, intentional deps
  }, [page, effectiveFilters, filter]);

  const handleNomeFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, nome: value }));
  }, []);
  const handleLoteFilterChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, lote: value }));
  }, []);

  const filterOptions = useMemo(
    () =>
      buildFilterOptionsFromApi(apiFilterOptions, {
        residents,
        setor: filters.setor,
      }),
    [apiFilterOptions, residents, filters.setor],
  );

  const displayItems = useMemo(() => {
    return items.map((item) => {
      const caselaDisplay =
        item.sector === "enfermagem" && item.casela != null
          ? (residents.find((r) => r.casela === item.casela)?.name ??
            String(item.casela))
          : (item.casela ?? "-");
      return { ...item, caselaDisplay };
    });
  }, [items, residents]);

  const filteredCabinets = useMemo(() => {
    if (!armarioSearch) return filterOptions.cabinets;

    return filterOptions.cabinets.filter((c) =>
      c.value.startsWith(armarioSearch.trim()),
    );
  }, [armarioSearch, filterOptions.cabinets]);

  const filteredCaselas = useMemo(() => {
    if (!caselaSearch) return filterOptions.caselas;
    const term = caselaSearch.trim().toLowerCase();
    return filterOptions.caselas.filter(
      (c) =>
        c.value.startsWith(caselaSearch.trim()) ||
        c.label.toLowerCase().includes(term),
    );
  }, [caselaSearch, filterOptions.caselas]);

  const columns = [
    { key: "stockType", label: "Tipo", editable: false },
    { key: "name", label: "Nome", editable: true },
    { key: "activeSubstance", label: "Princípio Ativo", editable: true },
    { key: "description", label: "Descrição", editable: true },
    { key: "expiry", label: "Validade", editable: true },
    { key: "quantity", label: "Quantidade", editable: true },
    { key: "cabinet", label: "Armário", editable: false },
    { key: "drawer", label: "Gaveta", editable: false },
    { key: "caselaDisplay", label: "Casela", editable: false },
    { key: "daysToReplacement", label: "Dias para Repor", editable: false },
    { key: "origin", label: "Origem", editable: false },
    { key: "sector", label: "Setor", editable: false },
    { key: "destination", label: "Destino", editable: false },
    { key: "detail", label: "Observação", editable: false },
    { key: "status", label: "Status", editable: false },
    { key: "lot", label: "Lote", editable: false },
  ];

  const requestTransferSector = (row: StockItem) => {
    setPendingAction({
      type: "transfer",
      row,
    });
    setTransferModalOpen(true);
  };

  const requestRemoveIndividual = (row: StockItem) => {
    setPendingAction({
      type: "remove",
      row,
    });
    setConfirmOpen(true);
  };

  const requestSuspend = (row: StockItem) => {
    setPendingAction({
      type: "suspend",
      row,
    });
    setConfirmOpen(true);
  };

  const requestResume = (row: StockItem) => {
    setPendingAction({
      type: "resume",
      row,
    });
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction.row || !pendingAction.type) return;

    const { row, type } = pendingAction;

    setActionLoading(true);

    try {
      if (type === "remove") {
        if (row.itemType === "medicamento") {
          await removeIndividualMedicineFromStock(row.id);
        } else if (row.itemType === "insumo") {
          await removeIndividualInputFromStock(row.id);
        }
      }

      if (type === "suspend") {
        if (row.itemType === "medicamento") {
          await suspendMedicineFromStock(row.id);
        } else if (row.itemType === "insumo") {
          await suspendInputFromStock(row.id);
        }
      }

      if (type === "resume") {
        if (row.itemType === "medicamento") {
          await resumeMedicineFromStock(row.id);
        } else if (row.itemType === "insumo") {
          await resumeInputFromStock(row.id);
        }
      }

      await loadStock(page);

      const messages =
        typeof actionMessages[type] === "function"
          ? actionMessages[type](row)
          : actionMessages[type];

      toast({
        title: messages.success,
        variant: "success",
        duration: 3000,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao executar a ação.";

      const messages =
        typeof actionMessages[type] === "function"
          ? actionMessages[type](row)
          : actionMessages[type];

      toast({
        title: messages.error,
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });

      await loadStock(page);
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setPendingAction({ type: null, row: null });
    }
  };

  const handleTransferConfirm = async (
    quantity: number,
    casela?: number,
    destino?: string,
    details?: string,
    options?: { bypassCasela: boolean; dias_para_repor: number | null },
  ) => {
    if (!pendingAction.row || pendingAction.type !== "transfer") return;

    const { row } = pendingAction;
    setActionLoading(true);

    try {
      await transferStockSector({
        estoque_id: row.id,
        setor: SectorType.ENFERMAGEM,
        itemType: row.itemType as StockItemType,
        quantidade: quantity,
        casela_id: casela ?? null,
        destino: destino ?? null,
        observacao: details ?? null,
        bypassCasela: options?.bypassCasela ?? false,
        dias_para_repor: options?.dias_para_repor ?? null,
      });

      await loadStock(page);

      const messages = actionMessages.transfer(row);
      toast({ title: messages.success, variant: "success", duration: 3000 });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao transferir o item.";

      const messages = actionMessages.transfer(row);
      toast({
        title: messages.error,
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });

      await loadStock(page);
    } finally {
      setActionLoading(false);
      setTransferModalOpen(false);
      setPendingAction({ type: null, row: null });
    }
  };

  return (
    <Layout
      title="Estoque de Medicamentos e Insumos"
      breadcrumb={stockBreadcrumb}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3 justify-end mt-8">
          <button
            onClick={() => navigate("/stock/out")}
            className="
                h-12 px-6 rounded-lg font-semibold
                bg-red-600 text-white
                shadow-md hover:bg-red-700 hover:shadow-lg active:bg-red-800 active:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all ease-in-out duration-200
              "
          >
            Saída de Estoque
          </button>

          <button
            onClick={() => setReportModalOpen(true)}
            className="
                h-12 px-6 rounded-lg font-semibold
                bg-primary text-primary-foreground
                shadow-md hover:bg-primary/90 hover:shadow-lg active:bg-primary/80 active:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all ease-in-out duration-200
              "
          >
            Gerar Relatório
          </button>
        </div>

        {filter && FILTER_LABELS[filter] && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Exibindo:{" "}
              <span className="font-medium text-foreground">
                {FILTER_LABELS[filter]}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                navigate("/stock");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/90 hover:bg-accent rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <X className="h-4 w-4" />
              Limpar filtro
            </button>
          </div>
        )}

        {apiFilterOptions !== null && (
          <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm">
            <div className="flex items-end gap-4">
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-700 mb-1">Nome</label>
                <TableFilter
                  placeholder="Buscar por nome"
                  onFilterChange={handleNomeFilterChange}
                />
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-700 mb-1">
                  Setor
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white truncate">
                      <span className="truncate">
                        {filters.setor
                          ? filterOptions.sectors.find(
                              (s) => s.value === filters.setor,
                            )?.label || filters.setor
                          : "Selecione"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() =>
                            setFilters((prev) => ({ ...prev, setor: "" }))
                          }
                        >
                          Todos
                        </CommandItem>
                        {filterOptions.sectors.map((sector) => (
                          <CommandItem
                            key={sector.value}
                            value={sector.value}
                            onSelect={() =>
                              setFilters((prev) => ({
                                ...prev,
                                setor:
                                  prev.setor === sector.value
                                    ? ""
                                    : sector.value,
                              }))
                            }
                          >
                            {sector.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-700 mb-1">
                  Armário
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white truncate">
                      <span className="truncate">
                        {filters.armario
                          ? `Armário ${filters.armario}`
                          : "Selecione"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar armário"
                        value={armarioSearch}
                        onValueChange={setArmarioSearch}
                      />
                      <CommandGroup>
                        {filteredCabinets.map((cabinet) => (
                          <CommandItem
                            key={cabinet.value}
                            value={cabinet.value}
                            onSelect={() => {
                              setFilters((prev) => ({
                                ...prev,
                                armario:
                                  prev.armario === cabinet.value
                                    ? ""
                                    : cabinet.value,
                              }));
                              setArmarioSearch("");
                            }}
                          >
                            {cabinet.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-700 mb-1">
                  Casela
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full border border-gray-300 p-2 rounded-lg flex justify-between items-center bg-white truncate">
                      <span className="truncate">
                        {filters.casela
                          ? filters.setor === "enfermagem"
                            ? (residents.find(
                                (r) => r.casela === Number(filters.casela),
                              )?.name ?? `Casela ${filters.casela}`)
                            : `Casela ${filters.casela}`
                          : "Selecione"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar casela"
                        value={caselaSearch}
                        onValueChange={setCaselaSearch}
                      />
                      <CommandGroup>
                        {filteredCaselas.map((casela) => (
                          <CommandItem
                            key={casela.value}
                            value={casela.value}
                            onSelect={() => {
                              setFilters((prev) => ({
                                ...prev,
                                casela:
                                  prev.casela === casela.value
                                    ? ""
                                    : casela.value,
                              }));
                              setCaselaSearch("");
                            }}
                          >
                            {casela.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs text-gray-700 mb-1">Lote</label>
                <TableFilter
                  placeholder="Buscar por lote"
                  onFilterChange={handleLoteFilterChange}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          {loading ? (
            <SkeletonTable rows={8} cols={columns.length} />
          ) : (
            <EditableTable
              data={displayItems as unknown as Record<string, unknown>[]}
              columns={columns}
              showAddons={true}
              currentPage={page}
              hasNextPage={hasNext}
              onNextPage={() => setPage((p) => p + 1)}
              onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
              onTransferSector={(row) =>
                requestTransferSector(row as unknown as StockItem)
              }
              onRemoveIndividual={(row) =>
                requestRemoveIndividual(row as unknown as StockItem)
              }
              onSuspend={(row) => requestSuspend(row as unknown as StockItem)}
              onResume={(row) => requestResume(row as unknown as StockItem)}
              onDeleteSuccess={() => {
                loadStock(page);
              }}
              entityType="stock"
            />
          )}
        </div>
      </div>

      <ConfirmActionModal
        open={confirmOpen}
        loading={actionLoading}
        title={pendingAction.type ? actionTitles[pendingAction.type] : ""}
        description={
          pendingAction.type
            ? actionConfig[pendingAction.type].description(pendingAction.row)
            : ""
        }
        confirmLabel="Confirmar"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmOpen(false)}
      />

      <TransferQuantityModal
        open={transferModalOpen}
        item={
          pendingAction.row && pendingAction.type === "transfer"
            ? {
                name: pendingAction.row.name,
                quantity: pendingAction.row.quantity,
                sector: pendingAction.row.sector,
                itemType: pendingAction.row.itemType,
                isGeneralMedicine:
                  pendingAction.row.tipo === ItemStockType.GERAL,
                casela: pendingAction.row.casela ?? null,
                daysToReplacement: pendingAction.row.daysToReplacement ?? null,
                medicamentoId: pendingAction.row.medicamentoId ?? null,
              }
            : null
        }
        residents={residents}
        onConfirm={handleTransferConfirm}
        onCancel={() => {
          setTransferModalOpen(false);
          setPendingAction({ type: null, row: null });
        }}
        loading={actionLoading}
      />

      <Suspense fallback={null}>
        <ReportModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      </Suspense>
    </Layout>
  );
}
