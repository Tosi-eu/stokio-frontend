import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { TableFilter } from "@/components/TableFilter";
import { useToast } from "@/hooks/use-toast.hook";
import { getInputs } from "@/api/requests";
import { DEFAULT_PAGE_SIZE } from "@/helpers/paginacao.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import { PREVIEW_INPUTS } from "@/helpers/preview-mock-data";

const columns = [
  { key: "nome", label: "Nome", editable: true },
  { key: "descricao", label: "Descrição", editable: true },
  { key: "estoque_minimo", label: "Estoque Mínimo", editable: true },
  { key: "preco", label: "Preço (R$)", editable: true },
];

export default function Inputs() {
  const { previewMode } = useTenant();
  const [inputs, setInputs] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const { toast } = useToast();

  async function fetchInputs() {
    setLoading(true);
    try {
      const res = await getInputs(
        page,
        DEFAULT_PAGE_SIZE,
        searchFilter || undefined,
      );
      const rows = res.data as unknown as Record<string, unknown>[];
      if (previewMode && rows.length === 0) {
        setInputs(PREVIEW_INPUTS);
        setHasNext(false);
      } else {
        setInputs(rows);
        setHasNext(res.hasNext);
      }
    } catch (err: unknown) {
      if (previewMode) {
        setInputs(PREVIEW_INPUTS);
        setHasNext(false);
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Erro inesperado";
        toast({
          title: "Erro ao carregar insumos",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const hasNextPage = useMemo(() => {
    return hasNext;
  }, [hasNext]);

  useEffect(() => {
    fetchInputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchInputs is stable, deps are page/searchFilter
  }, [page, searchFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchFilter]);

  return (
    <Layout title="Insumos">
      <div className="pt-12">
        <div className="max-w-6xl mx-auto mt-10 bg-white border border-slate-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
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
              readOnly={previewMode}
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
