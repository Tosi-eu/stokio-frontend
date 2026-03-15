import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { TableFilter } from "@/components/TableFilter";
import { getMedicines } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { DEFAULT_PAGE_SIZE } from "@/helpers/paginacao.helper";

const columns = [
  { key: "nome", label: "Nome" },
  { key: "principio_ativo", label: "Princípio Ativo" },
  { key: "dosagem", label: "Dosagem" },
  { key: "unidade_medida", label: "Unidade" },
  { key: "estoque_minimo", label: "Estoque Mínimo" },
];

export default function Medicines() {
  const [medicines, setMedicines] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [, setTotal] = useState(0);

  async function fetchMedicines() {
    setLoading(true);
    try {
      const res = await getMedicines(
        page,
        DEFAULT_PAGE_SIZE,
        searchFilter || undefined,
      );
      setMedicines(res.data as unknown as Record<string, unknown>[]);
      setHasNext(res.hasNext);
      setTotal(res.total);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro inesperado";
      toast({
        title: "Erro ao carregar medicamentos",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  const hasNextPage = useMemo(() => {
    return hasNext;
  }, [hasNext]);

  useEffect(() => {
    fetchMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchMedicines is stable
  }, [page, searchFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchFilter]);

  return (
    <Layout title="Medicamentos">
      <div className="pt-12">
        <div className="max-w-4xl mx-auto mt-10 bg-white border border-slate-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-4">
            <TableFilter
              placeholder="Buscar por nome"
              onFilterChange={setSearchFilter}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={5} cols={columns.length} />
          ) : (
            <EditableTable
              data={medicines}
              columns={columns}
              entityType="medicines"
              currentPage={page}
              hasNextPage={hasNextPage}
              onNextPage={() => {
                if (hasNextPage) {
                  setPage(page + 1);
                }
              }}
              onPrevPage={() => {
                if (page > 1) {
                  setPage(page - 1);
                }
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
