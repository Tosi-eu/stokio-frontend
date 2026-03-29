import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";
import { getCabinets, getTransferReport } from "@/api/requests";
import { Card } from "@/components/ui/card";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { useUiDisplay } from "@/context/ui-display-context";
import {
  formatArmarioDisplay,
  formatCaselaDisplay,
  cabinetCategoryByNumero,
} from "@/helpers/ui-display.helper";

const columns = [
  { key: "medicamento", label: "Medicamento", editable: false },
  { key: "principio_ativo", label: "Princípio Ativo", editable: false },
  { key: "quantidade", label: "Quantidade", editable: false },
  { key: "operador", label: "Operador", editable: false },
  { key: "data", label: "Data da Transferência", editable: false },
  { key: "armario", label: "Armário", editable: false },
  { key: "casela", label: "Casela", editable: false },
  { key: "residente", label: "Residente", editable: false },
];

interface TransferData {
  data: string;
  tipo_item: "medicamento" | "insumo";
  nome: string;
  principio_ativo?: string | null;
  quantidade: number;
  casela: number | null;
  residente: string | null;
  armario: number | null;
  gaveta: number | null;
  setor: string;
  lote: string | null;
  usuario: string;
}

export default function TransferReport() {
  const { uiDisplay } = useUiDisplay();
  const [cabinetList, setCabinetList] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);
  const cabMap = useMemo(
    () => cabinetCategoryByNumero(cabinetList),
    [cabinetList],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cabs = await fetchAllPaginated((p, l) => getCabinets(p, l), 100);
        if (cancelled) return;
        setCabinetList(
          cabs.map((c: { numero: number; categoria: string }) => ({
            numero: c.numero,
            categoria: c.categoria,
          })),
        );
      } catch {
        if (!cancelled) setCabinetList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  async function fetchTransfers() {
    setLoading(true);
    try {
      const data = (await getTransferReport()) as TransferData[];

      setTransfers(data);
      setTotal(data.length);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as transferências.";
      toast({
        title: "Erro ao carregar transferências",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
      setTransfers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransfers();
  }, []);

  const tableData = transfers.map((transfer) => ({
    medicamento: transfer.nome,
    principio_ativo: transfer.principio_ativo || "-",
    quantidade: String(transfer.quantidade),
    operador: transfer.usuario,
    data: transfer.data,
    armario: formatArmarioDisplay(
      transfer.armario,
      transfer.armario != null ? (cabMap.get(transfer.armario) ?? null) : null,
      uiDisplay.armario,
    ),
    casela: formatCaselaDisplay(
      transfer.casela,
      transfer.residente,
      uiDisplay,
      transfer.setor,
    ),
    residente: transfer.residente || "-",
  }));

  return (
    <Layout title="Transferências - Farmácia para Enfermaria">
      <div className="w-full flex justify-center p-10">
        <Card className="w-full max-w-[95%] xl:max-w-7xl bg-white border shadow-md p-8 space-y-6">
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              <p className="font-semibold">Transferências do dia atual</p>
              <p>
                Total: <strong>{total}</strong> transferências
              </p>
            </div>

            {loading ? (
              <SkeletonTable rows={5} cols={columns.length} />
            ) : transfers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhuma transferência encontrada hoje.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-slate-50 transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-sm text-slate-700"
                          >
                            {row[col.key as keyof typeof row] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-slate-600">
                    Total: {total} transferências do dia
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
