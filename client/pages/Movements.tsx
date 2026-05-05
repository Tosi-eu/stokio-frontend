import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";

import { getInputMovements, getMedicineMovements } from "@/api/requests";
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
  cabinet: number | string;
  drawerDisplay: string;
  resident: string;
  type: string | undefined;
  sector: string;
  lot: string;
};

export default function InputMovements() {
  const { uiDisplay, previewMode } = useTenant();
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

  function normalizeMovement(item: RawMovement): MovementRow {
    const isMedicine = item.medicamento_id != null;
    const gavetaCat = item.DrawerModel?.DrawerCategoryModel?.nome;

    const sortMs = new Date(item.data as string).getTime();
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
      cabinet: item.armario_id ?? "-",
      drawerDisplay: formatGavetaLabel(uiDisplay.gaveta, {
        gavetaId: item.gaveta_id,
        categoriaNome: gavetaCat,
      }),
      resident: formatCaselaLabel(uiDisplay.casela, {
        caselaId: item.ResidentModel?.num_casela,
        residentName: item.ResidentModel?.nome,
      }),
      type: item.tipo,
      sector: item.setor ?? "-",
      lot: item.lote ?? "-",
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

      const slice = merged.slice(0, TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setEntries(getPreviewMovementRows("entrada") as MovementRow[]);
        setEntriesHasNext(false);
      } else {
        setEntries(slice);
        setEntriesHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            merged.length > TABLE_LIMIT,
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

      const slice = merged.slice(0, TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setExits(getPreviewMovementRows("saida") as MovementRow[]);
        setExitsHasNext(false);
      } else {
        setExits(slice);
        setExitsHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            merged.length > TABLE_LIMIT,
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

      const slice = merged.slice(0, TABLE_LIMIT);
      if (previewMode && slice.length === 0) {
        setTransfers(getPreviewMovementRows("transferencia") as MovementRow[]);
        setTransfersHasNext(false);
      } else {
        setTransfers(slice);
        setTransfersHasNext(
          insumos.hasNext ||
            medicamentos.hasNext ||
            merged.length > TABLE_LIMIT,
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
  }, [entriesInputPage, entriesMedicinePage, uiDisplay]);

  useEffect(() => {
    fetchExits();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchExits stable
  }, [exitsInputPage, exitsMedicinePage, uiDisplay]);

  useEffect(() => {
    fetchTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchTransfers stable
  }, [transfersInputPage, transfersMedicinePage, uiDisplay]);

  return (
    <Layout title="Movimentações">
      <div className="w-full flex justify-center p-10">
        <Card className="w-full max-w-[95%] xl:max-w-7xl bg-white border shadow-md p-8 space-y-6 overflow-x-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Entradas</h2>

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
