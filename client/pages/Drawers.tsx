import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { getDrawers } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import type { Drawer } from "@/interfaces/interfaces";

const DEFAULT_LIMIT = 10;

const columns = [
  { key: "numero", label: "Número", editable: false },
  { key: "categoria", label: "Categoria", editable: false },
];

export default function Drawers() {
  const [drawers, setDrawers] = useState<Drawer[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchDrawers(pageNumber: number) {
    setLoading(true);
    try {
      const res = await getDrawers(pageNumber, DEFAULT_LIMIT);

      setDrawers(Array.isArray(res.data) ? res.data : []);
      setPage(res.page ?? pageNumber);
      setHasNextPage(Boolean(res.hasNext));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro inesperado";
      toast({
        title: "Erro ao carregar gavetas",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrawers(1);
  }, []);

  return (
    <Layout title="Gavetas">
      <div className="pt-12">
        <div className="max-w-3xl mx-auto mt-10 bg-white border border-slate-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
          {loading ? (
            <SkeletonTable rows={5} cols={columns.length} />
          ) : (
            <EditableTable
              data={drawers as unknown as Record<string, unknown>[]}
              columns={columns}
              entityType="drawers"
              currentPage={page}
              hasNextPage={hasNextPage}
              onNextPage={() => {
                if (hasNextPage) {
                  fetchDrawers(page + 1);
                }
              }}
              onPrevPage={() => {
                if (page > 1) {
                  fetchDrawers(page - 1);
                }
              }}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
