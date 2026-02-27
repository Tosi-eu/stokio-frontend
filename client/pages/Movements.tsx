import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";

import { getInputMovements, getMedicineMovements } from "@/api/requests";
import { Card } from "@/components/ui/card";
import type { RawMovement } from "@/interfaces/interfaces";

const TABLE_LIMIT = 10;
const REQUEST_LIMIT = 5;

export default function InputMovements() {
  const [entriesInputPage, setEntriesInputPage] = useState(1);
  const [entriesMedicinePage, setEntriesMedicinePage] = useState(1);
  const [entriesHasNext, setEntriesHasNext] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const entriesRequestId = useRef(0);

  const [exitsInputPage, setExitsInputPage] = useState(1);
  const [exitsMedicinePage, setExitsMedicinePage] = useState(1);
  const [exitsHasNext, setExitsHasNext] = useState(false);
  const [exits, setExits] = useState<any[]>([]);
  const [loadingExits, setLoadingExits] = useState(true);
  const exitsRequestId = useRef(0);

  const columnsBase = [
    { key: "name", label: "Produto", editable: false },
    { key: "additionalData", label: "Complemento", editable: false },
    { key: "quantity", label: "Quantidade", editable: false },
    { key: "operator", label: "Usuário", editable: false },
    { key: "movementDate", label: "Data", editable: false },
    { key: "cabinet", label: "Armário", editable: false },
    { key: "drawer", label: "Gaveta", editable: false },
    { key: "resident", label: "Casela", editable: false },
    { key: "sector", label: "Setor", editable: false },
    { key: "lot", label: "Lote", editable: false },
  ];

  function normalizeMovement(item: RawMovement) {
    const isMedicine = item.medicamento_id != null;

    return {
      id: item.id,
      name: isMedicine ? item.MedicineModel?.nome : item.InputModel?.nome,
      additionalData: isMedicine
        ? item.MedicineModel?.principio_ativo
        : (item.InputModel?.descricao ?? "-"),
      quantity: item.quantidade,
      operator: item.LoginModel?.first_name,
      movementDate: item.data,
      cabinet: item.armario_id ?? "-",
      drawer: item.gaveta_id ?? "-",
      resident: item.ResidentModel?.num_casela ?? "-",
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
          type: "entrada",
          limit: REQUEST_LIMIT,
          page: entriesInputPage,
        }),
        getMedicineMovements({
          type: "entrada",
          limit: REQUEST_LIMIT,
          page: entriesMedicinePage,
        }),
      ]);

      if (requestId !== entriesRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovement),
        ...medicamentos.data.map(normalizeMovement),
      ].sort(
        (a, b) =>
          new Date(b.movementDate).getTime() -
          new Date(a.movementDate).getTime(),
      );

      setEntries(merged.slice(0, TABLE_LIMIT));
      setEntriesHasNext(
        insumos.hasNext || medicamentos.hasNext || merged.length > TABLE_LIMIT,
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as movimentações de entrada.";
      toast({
        title: "Erro ao carregar entradas",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
      setEntries([]);
      setEntriesHasNext(false);
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
          type: "saida",
          limit: REQUEST_LIMIT,
          page: exitsInputPage,
        }),
        getMedicineMovements({
          type: "saida",
          limit: REQUEST_LIMIT,
          page: exitsMedicinePage,
        }),
      ]);

      if (requestId !== exitsRequestId.current) return;

      const merged = [
        ...insumos.data.map(normalizeMovement),
        ...medicamentos.data.map(normalizeMovement),
      ].sort(
        (a, b) =>
          new Date(b.movementDate).getTime() -
          new Date(a.movementDate).getTime(),
      );

      setExits(merged.slice(0, TABLE_LIMIT));
      setExitsHasNext(
        insumos.hasNext || medicamentos.hasNext || merged.length > TABLE_LIMIT,
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as movimentações de saída.";
      toast({
        title: "Erro ao carregar saídas",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
      setExits([]);
      setExitsHasNext(false);
    } finally {
      setLoadingExits(false);
    }
  }

  useEffect(() => {
    fetchEntries();
  }, [entriesInputPage, entriesMedicinePage]);

  useEffect(() => {
    fetchExits();
  }, [exitsInputPage, exitsMedicinePage]);

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
              />
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
