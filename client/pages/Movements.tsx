import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";

import {
  getCabinets,
  getDrawers,
  getInputMovements,
  getMedicineMovements,
  getResidents,
} from "@/api/requests";
import { Card } from "@/components/ui/card";
import type { RawMovement } from "@/interfaces/interfaces";
import { useTenant } from "@/hooks/use-tenant.hook";
import { getPreviewMovementRows } from "@/helpers/preview-mock-data";
import { MovementType } from "@/utils/enums";
import {
  formatCaselaLabel,
  formatGavetaLabel,
} from "@/helpers/storage-location-display.helper";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import { getErrorMessage } from "@/helpers/validation.helper";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useTenantSetores } from "@/hooks/use-tenant-setores.hook";
import {
  buildSectorFilterOptions,
  getEnabledSectors,
} from "@/helpers/tenant-sectors.helper";

const TABLE_LIMIT = 10;
const REQUEST_LIMIT = 5;

type MovementRow = {
  id: number | undefined;
  name: string | undefined;
  additionalData: string | null | undefined;
  quantity: number | undefined;
  operator: string | undefined;
  movementDate: string;
  _movementDateSort: number;
  cabinet: number | string; // display
  cabinetNumber: number | null;
  cabinetCategory: string | null;
  drawerDisplay: string; // display (depende do uiDisplay)
  drawerNumber: number | null;
  drawerCategory: string | null;
  resident: string; // display
  residentCasela: number | null;
  residentName: string | null;
  type: string | undefined;
  sector: string; // display / key
  lot: string; // display
};

type MovementFilters = {
  produto: string;
  armario: string;
  gaveta: string;
  casela: string;
  setor: string;
  lote: string;
};

const DEFAULT_FILTERS: MovementFilters = {
  produto: "",
  armario: "",
  gaveta: "",
  casela: "",
  setor: "",
  lote: "",
};

export default function InputMovements() {
  const { uiDisplay, previewMode, modules } = useTenant();
  const { labelByKey } = useTenantSetores();
  const [entriesInputPage, setEntriesInputPage] = useState(1);
  const [entriesMedicinePage, setEntriesMedicinePage] = useState(1);
  const [entriesHasNext, setEntriesHasNext] = useState(false);
  const [entries, setEntries] = useState<MovementRow[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const entriesRequestId = useRef(0);

  const [exitsInputPage, setExitsInputPage] = useState(1);
  const [exitsMedicinePage, setExitsMedicinePage] = useState(1);
  const [exitsHasNext, setExitsHasNext] = useState(false);
  const [exits, setExits] = useState<MovementRow[]>([]);
  const [loadingExits, setLoadingExits] = useState(true);
  const exitsRequestId = useRef(0);

  const [transfersInputPage, setTransfersInputPage] = useState(1);
  const [transfersMedicinePage, setTransfersMedicinePage] = useState(1);
  const [transfersHasNext, setTransfersHasNext] = useState(false);
  const [transfers, setTransfers] = useState<MovementRow[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);
  const transfersRequestId = useRef(0);

  const [residentOptions, setResidentOptions] = useState<
    Array<{ casela: number; name: string }>
  >([]);
  const [residentSearch, setResidentSearch] = useState("");
  const [residentPopoverOpen, setResidentPopoverOpen] = useState(false);

  const [cabinetOptions, setCabinetOptions] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);
  const [drawerOptions, setDrawerOptions] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);

  const [entriesFilters, setEntriesFilters] =
    useState<MovementFilters>(DEFAULT_FILTERS);
  const [exitsFilters, setExitsFilters] =
    useState<MovementFilters>(DEFAULT_FILTERS);
  const [transfersFilters, setTransfersFilters] =
    useState<MovementFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [residents, cabinets, drawers] = await Promise.all([
          fetchAllPaginated<{ casela: number; name: string }>((p, l) =>
            getResidents(p, l).then((r) => ({
              data: (r.data ?? []).map((x) => ({
                casela: Number((x as { casela?: unknown }).casela),
                name: String((x as { name?: unknown }).name ?? ""),
              })),
              hasNext: r.hasNext ?? false,
            })),
          ),
          fetchAllPaginated<{ numero: number; categoria: string }>((p, l) =>
            getCabinets(p, l).then((r) => ({
              data: (r.data ?? []).map((x) => ({
                numero: Number((x as { numero?: unknown }).numero),
                categoria: String(
                  (x as { categoria?: unknown }).categoria ?? "",
                ),
              })),
              hasNext: r.hasNext ?? false,
            })),
          ),
          fetchAllPaginated<{ numero: number; categoria: string }>((p, l) =>
            getDrawers(p, l).then((r) => ({
              data: (r.data ?? []).map((x) => ({
                numero: Number((x as { numero?: unknown }).numero),
                categoria: String(
                  (x as { categoria?: unknown }).categoria ?? "",
                ),
              })),
              hasNext: r.hasNext ?? false,
            })),
          ),
        ]);
        if (cancelled) return;
        setResidentOptions((residents ?? []).filter((r) => r.casela));
        setCabinetOptions((cabinets ?? []).filter((c) => c.numero));
        setDrawerOptions((drawers ?? []).filter((d) => d.numero));
      } catch {
        if (cancelled) return;
        setResidentOptions([]);
        setCabinetOptions([]);
        setDrawerOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sectorOptions = useMemo(() => {
    return buildSectorFilterOptions(getEnabledSectors(modules), labelByKey);
  }, [modules, labelByKey]);

  const filteredResidentOptions = useMemo(() => {
    const q = residentSearch.trim().toLowerCase();
    if (!q) return residentOptions;
    if (/^\\d+$/.test(q)) {
      return residentOptions.filter((r) => String(r.casela).startsWith(q));
    }
    return residentOptions.filter((r) => r.name.toLowerCase().includes(q));
  }, [residentOptions, residentSearch]);

  function parseMovementDateMs(raw: unknown): number {
    const s = String(raw ?? "").trim();
    if (!s) return 0;
    // "YYYY-MM-DD" (sem horário) costuma virar UTC; forçamos data local.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      return new Date(y, mo, d, 12, 0, 0, 0).getTime();
    }
    const ms = Date.parse(s);
    if (Number.isFinite(ms)) return ms;
    const ms2 = Date.parse(s.replace(" ", "T"));
    return Number.isFinite(ms2) ? ms2 : 0;
  }

  const resetEntriesPaging = useCallback(() => {
    setEntriesInputPage(1);
    setEntriesMedicinePage(1);
  }, []);

  const resetExitsPaging = useCallback(() => {
    setExitsInputPage(1);
    setExitsMedicinePage(1);
  }, []);

  const resetTransfersPaging = useCallback(() => {
    setTransfersInputPage(1);
    setTransfersMedicinePage(1);
  }, []);

  const makeTextSetter = useCallback(
    (
      setFilters: React.Dispatch<React.SetStateAction<MovementFilters>>,
      resetPaging: () => void,
      key: "produto" | "armario" | "gaveta" | "casela" | "setor" | "lote",
    ) => {
      return (v: string) => {
        setFilters((p) => ({ ...p, [key]: v }));
        resetPaging();
      };
    },
    [],
  );

  const columnsBase = [
    { key: "name", label: "Produto", editable: false },
    { key: "additionalData", label: "Complemento", editable: false },
    { key: "quantity", label: "Quantidade", editable: false },
    { key: "operator", label: "Usuário", editable: false },
    { key: "movementDate", label: "Data", editable: false },
    { key: "cabinet", label: "Armário", editable: false },
    { key: "drawerDisplay", label: "Gaveta", editable: false },
    { key: "resident", label: "Casela", editable: false },
    { key: "sector", label: "Setor", editable: false },
    { key: "lot", label: "Lote", editable: false },
  ];

  const applyFilters = useCallback(
    (rows: MovementRow[], filters: MovementFilters): MovementRow[] => {
      const produto = filters.produto.trim().toLowerCase();
      const armario = filters.armario.trim();
      const gaveta = filters.gaveta.trim();
      const casela = filters.casela.trim();
      const setor = filters.setor.trim().toLowerCase();
      const lote = filters.lote.trim().toLowerCase();

      return rows.filter((r) => {
        if (produto) {
          const name = String(r.name ?? "").toLowerCase();
          const add = String(r.additionalData ?? "").toLowerCase();
          if (!name.includes(produto) && !add.includes(produto)) return false;
        }

        if (armario) {
          const n = Number(armario);
          if (!Number.isNaN(n)) {
            if (r.cabinetNumber !== n) return false;
          } else {
            const cat = String(r.cabinetCategory ?? "").toLowerCase();
            if (!cat.includes(armario.toLowerCase())) return false;
          }
        }

        if (gaveta) {
          if (uiDisplay.gaveta === "numero") {
            const n = Number(gaveta);
            if (Number.isNaN(n) || r.drawerNumber !== n) return false;
          } else {
            const cat = String(r.drawerCategory ?? "").toLowerCase();
            if (!cat.includes(gaveta.toLowerCase())) return false;
          }
        }

        if (casela) {
          const n = Number(casela);
          if (Number.isNaN(n) || r.residentCasela !== n) return false;
        }

        if (setor) {
          if (String(r.sector ?? "").toLowerCase() !== setor) return false;
        }

        if (lote) {
          if (
            !String(r.lot ?? "")
              .toLowerCase()
              .includes(lote)
          )
            return false;
        }

        return true;
      });
    },
    [uiDisplay.gaveta],
  );

  function normalizeMovement(item: RawMovement): MovementRow {
    const isMedicine = item.medicamento_id != null;
    const gavetaCat = item.DrawerModel?.DrawerCategoryModel?.nome;

    const sortMs = parseMovementDateMs(item.data);
    const residentName = item.ResidentModel?.nome ?? null;
    const residentCasela =
      typeof item.ResidentModel?.num_casela === "number"
        ? item.ResidentModel?.num_casela
        : item.ResidentModel?.num_casela != null
          ? Number(item.ResidentModel?.num_casela)
          : null;
    const cabinetNumber =
      typeof item.armario_id === "number"
        ? item.armario_id
        : item.armario_id != null
          ? Number(item.armario_id)
          : null;
    const drawerNumber =
      typeof item.gaveta_id === "number"
        ? item.gaveta_id
        : item.gaveta_id != null
          ? Number(item.gaveta_id)
          : null;
    const drawerCategory = gavetaCat?.trim() ? String(gavetaCat).trim() : null;
    const cabinetCategory =
      (cabinetNumber != null
        ? cabinetOptions.find((c) => c.numero === cabinetNumber)?.categoria
        : null) ?? null;
    const cabinetDisplay =
      uiDisplay.armario === "categoria"
        ? cabinetCategory?.trim()
          ? cabinetCategory.trim()
          : cabinetNumber != null
            ? `Armário ${cabinetNumber}`
            : "—"
        : cabinetNumber != null
          ? cabinetNumber
          : "—";
    return {
      id: item.id,
      name: isMedicine ? item.MedicineModel?.nome : item.InputModel?.nome,
      additionalData: isMedicine
        ? item.MedicineModel?.principio_ativo
        : (item.InputModel?.descricao ?? "-"),
      quantity: item.quantidade,
      operator: item.LoginModel?.first_name,
      movementDate: formatDateToPtBr(item.data as string),
      _movementDateSort: Number.isFinite(sortMs) ? sortMs : 0,
      cabinet: cabinetDisplay,
      cabinetNumber,
      cabinetCategory: cabinetCategory?.trim() ? cabinetCategory.trim() : null,
      drawerDisplay: formatGavetaLabel(uiDisplay.gaveta, {
        gavetaId: drawerNumber,
        categoriaNome: gavetaCat,
      }),
      drawerNumber,
      drawerCategory,
      resident: formatCaselaLabel(uiDisplay.casela, {
        caselaId: residentCasela,
        residentName,
      }),
      residentCasela:
        residentCasela != null && Number.isFinite(residentCasela)
          ? residentCasela
          : null,
      residentName: residentName?.trim() ? residentName.trim() : null,
      type: item.tipo,
      sector: item.setor ?? "",
      lot: item.lote ?? "",
    };
  }

  async function fetchEntries() {
    const requestId = +entriesRequestId.current;
    setLoadingEntries(true);

    try {
      const [insumos, medicamentos] = await Promise.all([
        getInputMovements({
          type: MovementType.IN,
          limit: REQUEST_LIMIT,
          page: entriesInputPage,
        }),
        getMedicineMovements({
          type: MovementType.IN,
          limit: REQUEST_LIMIT,
          page: entriesMedicinePage,
        }),
      ]);

      if (requestId !== entriesRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovement),
        ...medicamentos.data.map(normalizeMovement),
      ].sort((a, b) => b._movementDateSort - a._movementDateSort);

      const filtered = applyFilters(merged, entriesFilters);
      const slice = filtered.slice(0, TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setEntries(getPreviewMovementRows("entrada") as MovementRow[]);
        setEntriesHasNext(false);
      } else {
        setEntries(slice);
        setEntriesHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            filtered.length > TABLE_LIMIT,
        );
      }
    } catch (err: unknown) {
      if (previewMode) {
        setEntries(getPreviewMovementRows("entrada") as MovementRow[]);
        setEntriesHasNext(false);
      } else {
        const errorMessage = getErrorMessage(
          err,
          "Não foi possível carregar as movimentações de entrada.",
          "Movements:entries",
        );
        toast({
          title: "Erro ao carregar entradas",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
        setEntries([]);
        setEntriesHasNext(false);
      }
    } finally {
      setLoadingEntries(false);
    }
  }

  async function fetchExits() {
    const requestId = +exitsRequestId.current;
    setLoadingExits(true);

    try {
      const [insumos, medicamentos] = await Promise.all([
        getInputMovements({
          type: MovementType.OUT,
          limit: REQUEST_LIMIT,
          page: exitsInputPage,
        }),
        getMedicineMovements({
          type: MovementType.OUT,
          limit: REQUEST_LIMIT,
          page: exitsMedicinePage,
        }),
      ]);

      if (requestId !== exitsRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovement),
        ...medicamentos.data.map(normalizeMovement),
      ].sort((a, b) => b._movementDateSort - a._movementDateSort);

      const filtered = applyFilters(merged, exitsFilters);
      const slice = filtered.slice(0, TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setExits(getPreviewMovementRows("saida") as MovementRow[]);
        setExitsHasNext(false);
      } else {
        setExits(slice);
        setExitsHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            filtered.length > TABLE_LIMIT,
        );
      }
    } catch (err: unknown) {
      if (previewMode) {
        setExits(getPreviewMovementRows("saida") as MovementRow[]);
        setExitsHasNext(false);
      } else {
        const errorMessage = getErrorMessage(
          err,
          "Não foi possível carregar as movimentações de saída.",
          "Movements:exits",
        );
        toast({
          title: "Erro ao carregar saídas",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
        setExits([]);
        setExitsHasNext(false);
      }
    } finally {
      setLoadingExits(false);
    }
  }

  async function fetchTransfers() {
    const requestId = +transfersRequestId.current;
    setLoadingTransfers(true);

    try {
      const [insumos, medicamentos] = await Promise.all([
        getInputMovements({
          type: MovementType.TRANSFER,
          limit: REQUEST_LIMIT,
          page: transfersInputPage,
        }),
        getMedicineMovements({
          type: MovementType.TRANSFER,
          limit: REQUEST_LIMIT,
          page: transfersMedicinePage,
        }),
      ]);

      if (requestId !== transfersRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovement),
        ...medicamentos.data.map(normalizeMovement),
      ].sort((a, b) => b._movementDateSort - a._movementDateSort);

      const filtered = applyFilters(merged, transfersFilters);
      const slice = filtered.slice(0, TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setTransfers(getPreviewMovementRows("transferencia") as MovementRow[]);
        setTransfersHasNext(false);
      } else {
        setTransfers(slice);
        setTransfersHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            filtered.length > TABLE_LIMIT,
        );
      }
    } catch (err: unknown) {
      if (previewMode) {
        setTransfers(getPreviewMovementRows("transferencia") as MovementRow[]);
        setTransfersHasNext(false);
      } else {
        const errorMessage = getErrorMessage(
          err,
          "Não foi possível carregar as movimentações de transferência.",
          "Movements:transfers",
        );
        toast({
          title: "Erro ao carregar transferências",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
        setTransfers([]);
        setTransfersHasNext(false);
      }
    } finally {
      setLoadingTransfers(false);
    }
  }

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchEntries stable
  }, [entriesInputPage, entriesMedicinePage, uiDisplay, entriesFilters]);

  useEffect(() => {
    fetchExits();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchExits stable
  }, [exitsInputPage, exitsMedicinePage, uiDisplay, exitsFilters]);

  useEffect(() => {
    fetchTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchTransfers stable
  }, [transfersInputPage, transfersMedicinePage, uiDisplay, transfersFilters]);

  const filtersHeader = useCallback(
    (
      title: string,
      filters: MovementFilters,
      actions: {
        onProduto: (v: string) => void;
        onArmario: (v: string) => void;
        onGaveta: (v: string) => void;
        onCasela: (v: string) => void;
        onSetor: (v: string) => void;
        onLote: (v: string) => void;
        onClear: () => void;
      },
    ) => {
      return (
        <div className="grid gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div className="lg:col-span-2">
              <Label className="text-xs">Produto</Label>
              <Input
                value={filters.produto}
                onChange={(e) => actions.onProduto(e.target.value)}
                placeholder="Nome do produto"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Armário</Label>
              <Select
                value={filters.armario || "all"}
                onValueChange={(v) => actions.onArmario(v === "all" ? "" : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {cabinetOptions
                    .slice()
                    .sort((a, b) => a.numero - b.numero)
                    .map((c) => (
                      <SelectItem key={c.numero} value={String(c.numero)}>
                        {uiDisplay.armario === "categoria" &&
                        c.categoria?.trim()
                          ? c.categoria
                          : `Armário ${c.numero}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">
                {uiDisplay.gaveta === "categoria" ? "Categoria" : "Gaveta"}
              </Label>
              <Select
                value={filters.gaveta || "all"}
                onValueChange={(v) => actions.onGaveta(v === "all" ? "" : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {drawerOptions
                    .slice()
                    .sort((a, b) => a.numero - b.numero)
                    .map((d) => (
                      <SelectItem key={d.numero} value={String(d.numero)}>
                        {formatGavetaLabel(uiDisplay.gaveta, {
                          gavetaId: d.numero,
                          categoriaNome: d.categoria,
                        })}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Casela</Label>
              <Popover
                open={residentPopoverOpen}
                onOpenChange={setResidentPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between mt-1"
                  >
                    <span className="truncate">
                      {filters.casela
                        ? formatCaselaLabel(uiDisplay.casela, {
                            caselaId: Number(filters.casela),
                            residentName:
                              residentOptions.find(
                                (r) => r.casela === Number(filters.casela),
                              )?.name ?? null,
                          })
                        : "Selecione"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar casela ou nome..."
                      value={residentSearch}
                      onValueChange={setResidentSearch}
                    />
                    <CommandEmpty>Nenhum residente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          actions.onCasela("");
                          setResidentSearch("");
                          setResidentPopoverOpen(false);
                        }}
                      >
                        Todos
                      </CommandItem>
                      {filteredResidentOptions.map((r) => (
                        <CommandItem
                          key={r.casela}
                          value={String(r.casela)}
                          onSelect={() => {
                            actions.onCasela(String(r.casela));
                            setResidentSearch("");
                            setResidentPopoverOpen(false);
                          }}
                        >
                          {uiDisplay.casela === "nome"
                            ? `${r.name} (Casela ${r.casela})`
                            : `Casela ${r.casela} — ${r.name}`}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data</Label>
              <div className="mt-1 text-sm text-muted-foreground">
                Filtro removido
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            <div className="lg:col-span-2">
              <Label className="text-xs">Setor</Label>
              <Select
                value={filters.setor || "all"}
                onValueChange={(v) => actions.onSetor(v === "all" ? "" : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sectorOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label className="text-xs">Lote</Label>
              <Input
                value={filters.lote}
                onChange={(e) => actions.onLote(e.target.value)}
                placeholder="Ex.: ABC123"
                className="mt-1 max-w-[200px]"
              />
            </div>

            <div className="lg:col-span-2 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={actions.onClear}
                disabled={
                  !filters.produto.trim() &&
                  !filters.armario.trim() &&
                  !filters.gaveta.trim() &&
                  !filters.casela.trim() &&
                  !filters.setor.trim() &&
                  !filters.lote.trim()
                }
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </div>
      );
    },
    [
      cabinetOptions,
      drawerOptions,
      filteredResidentOptions,
      residentOptions,
      residentPopoverOpen,
      residentSearch,
      sectorOptions,
      uiDisplay.armario,
      uiDisplay.casela,
      uiDisplay.gaveta,
    ],
  );

  return (
    <Layout title="Movimentações">
      <div className="w-full flex justify-center p-10">
        <Card className="w-full max-w-[95%] xl:max-w-7xl bg-white border shadow-md p-8 space-y-6 overflow-x-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Entradas</h2>
            {filtersHeader("Entradas", entriesFilters, {
              onProduto: makeTextSetter(
                setEntriesFilters,
                resetEntriesPaging,
                "produto",
              ),
              onArmario: makeTextSetter(
                setEntriesFilters,
                resetEntriesPaging,
                "armario",
              ),
              onGaveta: makeTextSetter(
                setEntriesFilters,
                resetEntriesPaging,
                "gaveta",
              ),
              onCasela: makeTextSetter(
                setEntriesFilters,
                resetEntriesPaging,
                "casela",
              ),
              onSetor: makeTextSetter(
                setEntriesFilters,
                resetEntriesPaging,
                "setor",
              ),
              onLote: makeTextSetter(
                setEntriesFilters,
                resetEntriesPaging,
                "lote",
              ),
              onClear: () => {
                setEntriesFilters(DEFAULT_FILTERS);
                resetEntriesPaging();
              },
            })}

            {loadingEntries ? (
              <SkeletonTable rows={5} cols={columnsBase.length} />
            ) : (
              <EditableTable
                data={entries}
                columns={columnsBase}
                entityType="entries"
                currentPage={Math.max(entriesInputPage, entriesMedicinePage)}
                hasNextPage={entriesHasNext}
                onNextPage={() => {
                  setEntriesInputPage((p) => p + 1);
                  setEntriesMedicinePage((p) => p + 1);
                }}
                onPrevPage={() => {
                  setEntriesInputPage((p) => Math.max(1, p - 1));
                  setEntriesMedicinePage((p) => Math.max(1, p - 1));
                }}
                showAddons={false}
                readOnly={previewMode}
              />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Saídas</h2>
            {filtersHeader("Saídas", exitsFilters, {
              onProduto: makeTextSetter(
                setExitsFilters,
                resetExitsPaging,
                "produto",
              ),
              onArmario: makeTextSetter(
                setExitsFilters,
                resetExitsPaging,
                "armario",
              ),
              onGaveta: makeTextSetter(
                setExitsFilters,
                resetExitsPaging,
                "gaveta",
              ),
              onCasela: makeTextSetter(
                setExitsFilters,
                resetExitsPaging,
                "casela",
              ),
              onSetor: makeTextSetter(
                setExitsFilters,
                resetExitsPaging,
                "setor",
              ),
              onLote: makeTextSetter(setExitsFilters, resetExitsPaging, "lote"),
              onClear: () => {
                setExitsFilters(DEFAULT_FILTERS);
                resetExitsPaging();
              },
            })}

            {loadingExits ? (
              <SkeletonTable rows={5} cols={columnsBase.length} />
            ) : (
              <EditableTable
                data={exits}
                columns={columnsBase}
                entityType="exits"
                currentPage={Math.max(exitsInputPage, exitsMedicinePage)}
                hasNextPage={exitsHasNext}
                onNextPage={() => {
                  setExitsInputPage((p) => p + 1);
                  setExitsMedicinePage((p) => p + 1);
                }}
                onPrevPage={() => {
                  setExitsInputPage((p) => Math.max(1, p - 1));
                  setExitsMedicinePage((p) => Math.max(1, p - 1));
                }}
                showAddons={false}
                readOnly={previewMode}
              />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Transferências</h2>
            {filtersHeader("Transferências", transfersFilters, {
              onProduto: makeTextSetter(
                setTransfersFilters,
                resetTransfersPaging,
                "produto",
              ),
              onArmario: makeTextSetter(
                setTransfersFilters,
                resetTransfersPaging,
                "armario",
              ),
              onGaveta: makeTextSetter(
                setTransfersFilters,
                resetTransfersPaging,
                "gaveta",
              ),
              onCasela: makeTextSetter(
                setTransfersFilters,
                resetTransfersPaging,
                "casela",
              ),
              onSetor: makeTextSetter(
                setTransfersFilters,
                resetTransfersPaging,
                "setor",
              ),
              onLote: makeTextSetter(
                setTransfersFilters,
                resetTransfersPaging,
                "lote",
              ),
              onClear: () => {
                setTransfersFilters(DEFAULT_FILTERS);
                resetTransfersPaging();
              },
            })}

            {loadingTransfers ? (
              <SkeletonTable rows={5} cols={columnsBase.length} />
            ) : (
              <EditableTable
                data={transfers}
                columns={columnsBase}
                entityType="transfers"
                currentPage={Math.max(
                  transfersInputPage,
                  transfersMedicinePage,
                )}
                hasNextPage={transfersHasNext}
                onNextPage={() => {
                  setTransfersInputPage((p) => p + 1);
                  setTransfersMedicinePage((p) => p + 1);
                }}
                onPrevPage={() => {
                  setTransfersInputPage((p) => Math.max(1, p - 1));
                  setTransfersMedicinePage((p) => Math.max(1, p - 1));
                }}
                showAddons={false}
                readOnly={previewMode}
              />
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
