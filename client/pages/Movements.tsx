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
import { PageSurfaceCard } from "@/components/page/PageSurfaceCard";
import { PageSection } from "@/components/page/PageSection";
import { pageStackClass } from "@/components/page/page-ui.constants";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine } from "lucide-react";
import type { Column, RawMovement } from "@/interfaces/interfaces";
import { useTenant } from "@/hooks/use-tenant.hook";
import { getPreviewMovementRows } from "@/helpers/preview-mock-data";
import { MovementType } from "@/utils/enums";
import { getErrorMessage } from "@/helpers/validation.helper";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { useTenantSetores } from "@/hooks/use-tenant-setores.hook";
import {
  buildSectorFilterOptions,
  getEnabledSectors,
} from "@/helpers/tenant-sectors.helper";
import { matchesResidentCaselaSearch } from "@/helpers/resident-casela-autocomplete.helper";
import type {
  MovementFilters,
  MovementRow,
} from "@/components/movements/movements.types";
import { DEFAULT_MOVEMENT_FILTERS } from "@/components/movements/movements.types";
import {
  MOVEMENTS_REQUEST_LIMIT,
  MOVEMENTS_TABLE_LIMIT,
} from "@/components/movements/movements.constants";
import { MOVEMENTS_TABLE_COLUMNS } from "@/components/movements/movements.table-columns";
import { applyMovementFilters } from "@/components/movements/movements.filters";
import { normalizeMovement } from "@/components/movements/movements.normalize";
import { MovementsFiltersSection } from "@/components/movements/MovementsFiltersSection";

const TABLE_COLUMNS = MOVEMENTS_TABLE_COLUMNS as unknown as Column[];

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
  const [residentPopoverOpen, setResidentPopoverOpen] = useState<{
    entries: boolean;
    exits: boolean;
    transfers: boolean;
  }>({ entries: false, exits: false, transfers: false });

  const [cabinetOptions, setCabinetOptions] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);
  const [drawerOptions, setDrawerOptions] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);

  const [entriesFilters, setEntriesFilters] = useState(
    DEFAULT_MOVEMENT_FILTERS,
  );
  const [exitsFilters, setExitsFilters] = useState(DEFAULT_MOVEMENT_FILTERS);
  const [transfersFilters, setTransfersFilters] = useState(
    DEFAULT_MOVEMENT_FILTERS,
  );

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
    return residentOptions.filter((r) =>
      matchesResidentCaselaSearch(r, residentSearch),
    );
  }, [residentOptions, residentSearch]);

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

  const normalizeMovementRow = useCallback(
    (item: RawMovement) =>
      normalizeMovement(item, { uiDisplay, cabinetOptions }),
    [uiDisplay, cabinetOptions],
  );

  async function fetchEntries() {
    const requestId = +entriesRequestId.current;
    setLoadingEntries(true);

    try {
      const [insumos, medicamentos] = await Promise.all([
        getInputMovements({
          type: MovementType.IN,
          limit: MOVEMENTS_REQUEST_LIMIT,
          page: entriesInputPage,
        }),
        getMedicineMovements({
          type: MovementType.IN,
          limit: MOVEMENTS_REQUEST_LIMIT,
          page: entriesMedicinePage,
        }),
      ]);

      if (requestId !== entriesRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovementRow),
        ...medicamentos.data.map(normalizeMovementRow),
      ].sort((a, b) => b._movementDateSort - a._movementDateSort);

      const filtered = applyMovementFilters(
        merged,
        entriesFilters,
        uiDisplay.gaveta,
      );
      const slice = filtered.slice(0, MOVEMENTS_TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setEntries(getPreviewMovementRows("entrada") as MovementRow[]);
        setEntriesHasNext(false);
      } else {
        setEntries(slice);
        setEntriesHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            filtered.length > MOVEMENTS_TABLE_LIMIT,
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
          limit: MOVEMENTS_REQUEST_LIMIT,
          page: exitsInputPage,
        }),
        getMedicineMovements({
          type: MovementType.OUT,
          limit: MOVEMENTS_REQUEST_LIMIT,
          page: exitsMedicinePage,
        }),
      ]);

      if (requestId !== exitsRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovementRow),
        ...medicamentos.data.map(normalizeMovementRow),
      ].sort((a, b) => b._movementDateSort - a._movementDateSort);

      const filtered = applyMovementFilters(
        merged,
        exitsFilters,
        uiDisplay.gaveta,
      );
      const slice = filtered.slice(0, MOVEMENTS_TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setExits(getPreviewMovementRows("saida") as MovementRow[]);
        setExitsHasNext(false);
      } else {
        setExits(slice);
        setExitsHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            filtered.length > MOVEMENTS_TABLE_LIMIT,
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
          limit: MOVEMENTS_REQUEST_LIMIT,
          page: transfersInputPage,
        }),
        getMedicineMovements({
          type: MovementType.TRANSFER,
          limit: MOVEMENTS_REQUEST_LIMIT,
          page: transfersMedicinePage,
        }),
      ]);

      if (requestId !== transfersRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovementRow),
        ...medicamentos.data.map(normalizeMovementRow),
      ].sort((a, b) => b._movementDateSort - a._movementDateSort);

      const filtered = applyMovementFilters(
        merged,
        transfersFilters,
        uiDisplay.gaveta,
      );
      const slice = filtered.slice(0, MOVEMENTS_TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setTransfers(getPreviewMovementRows("transferencia") as MovementRow[]);
        setTransfersHasNext(false);
      } else {
        setTransfers(slice);
        setTransfersHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            filtered.length > MOVEMENTS_TABLE_LIMIT,
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

  return (
    <Layout
      title="Movimentações"
      description="Entradas, saídas e transferências de medicamentos e insumos, com filtros por localização e residente."
    >
      <PageSurfaceCard className="w-full overflow-x-auto p-6 sm:p-8">
        <div className={pageStackClass}>
          <PageSection title="Entradas" icon={ArrowDownToLine}>
            <MovementsFiltersSection
              filters={entriesFilters}
              uiKey="entries"
              uiDisplay={uiDisplay}
              cabinetOptions={cabinetOptions}
              drawerOptions={drawerOptions}
              sectorOptions={sectorOptions}
              filteredResidentOptions={filteredResidentOptions}
              residentOptions={residentOptions}
              residentPopoverOpen={residentPopoverOpen}
              setResidentPopoverOpen={setResidentPopoverOpen}
              residentSearch={residentSearch}
              setResidentSearch={setResidentSearch}
              actions={{
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
                  setEntriesFilters(DEFAULT_MOVEMENT_FILTERS);
                  resetEntriesPaging();
                },
              }}
            />

            {loadingEntries ? (
              <SkeletonTable rows={5} cols={TABLE_COLUMNS.length} />
            ) : (
              <EditableTable
                data={entries}
                columns={TABLE_COLUMNS}
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
          </PageSection>

          <PageSection title="Saídas" icon={ArrowUpFromLine}>
            <MovementsFiltersSection
              filters={exitsFilters}
              uiKey="exits"
              uiDisplay={uiDisplay}
              cabinetOptions={cabinetOptions}
              drawerOptions={drawerOptions}
              sectorOptions={sectorOptions}
              filteredResidentOptions={filteredResidentOptions}
              residentOptions={residentOptions}
              residentPopoverOpen={residentPopoverOpen}
              setResidentPopoverOpen={setResidentPopoverOpen}
              residentSearch={residentSearch}
              setResidentSearch={setResidentSearch}
              actions={{
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
                onLote: makeTextSetter(
                  setExitsFilters,
                  resetExitsPaging,
                  "lote",
                ),
                onClear: () => {
                  setExitsFilters(DEFAULT_MOVEMENT_FILTERS);
                  resetExitsPaging();
                },
              }}
            />

            {loadingExits ? (
              <SkeletonTable rows={5} cols={TABLE_COLUMNS.length} />
            ) : (
              <EditableTable
                data={exits}
                columns={TABLE_COLUMNS}
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
          </PageSection>

          <PageSection title="Transferências" icon={ArrowLeftRight}>
            <MovementsFiltersSection
              filters={transfersFilters}
              uiKey="transfers"
              uiDisplay={uiDisplay}
              cabinetOptions={cabinetOptions}
              drawerOptions={drawerOptions}
              sectorOptions={sectorOptions}
              filteredResidentOptions={filteredResidentOptions}
              residentOptions={residentOptions}
              residentPopoverOpen={residentPopoverOpen}
              setResidentPopoverOpen={setResidentPopoverOpen}
              residentSearch={residentSearch}
              setResidentSearch={setResidentSearch}
              actions={{
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
                  setTransfersFilters(DEFAULT_MOVEMENT_FILTERS);
                  resetTransfersPaging();
                },
              }}
            />

            {loadingTransfers ? (
              <SkeletonTable rows={5} cols={TABLE_COLUMNS.length} />
            ) : (
              <EditableTable
                data={transfers}
                columns={TABLE_COLUMNS}
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
          </PageSection>
        </div>
      </PageSurfaceCard>
    </Layout>
  );
}
