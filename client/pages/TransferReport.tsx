import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";
import { getTransferReport } from "@/api/requests";
import { PageSurfaceCard } from "@/components/page/PageSurfaceCard";
import { EmptyStateCard } from "@/components/medical-record-exports/medical-record-exports.shared";
import { ArrowLeftRight } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant.hook";
import { formatCaselaLabel } from "@/helpers/storage-location-display.helper";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import { getErrorMessage } from "@/helpers/validation.helper";

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
  const { uiDisplay } = useTenant();
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
      const errorMessage = getErrorMessage(
        err,
        "Não foi possível carregar as transferências.",
        "TransferReport:load",
      );
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
    data: formatDateToPtBr(transfer.data),
    armario: transfer.armario ? String(transfer.armario) : "-",
    casela: formatCaselaLabel(uiDisplay.casela, {
      caselaId: transfer.casela,
      residentName: transfer.residente,
    }),
    residente: transfer.residente || "-",
  }));

  return (
    <Layout
      title="Transferências - Farmácia para Enfermaria"
      description="Relação das transferências registradas no dia atual."
    >
      <PageSurfaceCard className="w-full space-y-6 p-6 sm:p-8">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Transferências do dia</p>
          <p>
            Total:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {total}
            </span>{" "}
            transferências
          </p>
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={columns.length} />
        ) : transfers.length === 0 ? (
          <EmptyStateCard
            icon={ArrowLeftRight}
            title="Nenhuma transferência hoje"
            description="Quando houver movimentações registradas para o dia, elas aparecerão nesta tabela."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="sticky top-0 z-10 border-b border-border/60 bg-muted/95 shadow-sm backdrop-blur-sm">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left font-semibold text-foreground"
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
                    className="border-b border-border/50 transition-colors duration-200 hover:bg-muted/50"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-foreground/90"
                      >
                        {row[col.key as keyof typeof row] || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Total do dia:{" "}
              <span className="font-medium tabular-nums text-foreground">
                {total}
              </span>{" "}
              transferências
            </div>
          </div>
        )}
      </PageSurfaceCard>
    </Layout>
  );
}
