import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { TableFilter } from "@/components/TableFilter";
import { useToast } from "@/hooks/use-toast.hook";
import { getInputs } from "@/api/requests";
import { DEFAULT_PAGE_SIZE } from "@/helpers/paginacao.helper";

const columns = [
  { key: "nome", label: "Nome", editable: true },
  { key: "descricao", label: "Descrição", editable: true },
  { key: "estoque_minimo", label: "Estoque Mínimo", editable: true },
];

export default function Inputs() {
  const [inputs, setInputs] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  async function fetchInputs() {
    setLoading(true);
    try {
      const res = await getInputs(
        page,
        DEFAULT_PAGE_SIZE,
        searchFilter || undefined,
      );
      setInputs(res.data as unknown as Record<string, unknown>[]);
      setHasNext(res.hasNext);
      setTotal(res.total);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro inesperado";
      toast({
        title: "Erro ao carregar insumos",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  }, [total]);

  const hasNextPage = useMemo(() => {
    return hasNext;
  }, [hasNext]);

  useEffect(() => {
    fetchInputs();
  }, [page, searchFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchFilter]);

  return (
    <Layout title="Insumos">
      <div className="pt-12">
        <div className="max-w-3xl mx-auto mt-10 bg-white border border-slate-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
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
              data={inputs}
              columns={columns}
              entityType="inputs"
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
