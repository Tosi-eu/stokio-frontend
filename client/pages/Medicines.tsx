import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import EditableTable from "@/components/EditableTable";
import { SkeletonTable } from "@/components/SkeletonTable";
import { TableFilter } from "@/components/TableFilter";
import { PageSurfaceCard } from "@/components/page/PageSurfaceCard";
import { EmptyStateCard } from "@/components/medical-record-exports/medical-record-exports.shared";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { getMedicines } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { DEFAULT_PAGE_SIZE } from "@/helpers/paginacao.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import { PREVIEW_MEDICINES } from "@/helpers/preview-mock-data";
import { getErrorMessage } from "@/helpers/validation.helper";

const columns = [
  { key: "nome", label: "Nome" },
  { key: "principio_ativo", label: "Princípio Ativo" },
  { key: "dosagem", label: "Dosagem" },
  { key: "unidade_medida", label: "Unidade" },
  { key: "estoque_minimo", label: "Estoque Mínimo" },
  { key: "preco", label: "Preço (R$)" },
];

export default function Medicines() {
  const { previewMode } = useTenant();
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
      const rows = res.data as unknown as Record<string, unknown>[];
      if (previewMode && rows.length === 0) {
        setMedicines(PREVIEW_MEDICINES);
        setHasNext(false);
        setTotal(PREVIEW_MEDICINES.length);
      } else {
        setMedicines(rows);
        setHasNext(res.hasNext);
        setTotal(res.total);
      }
    } catch (err: unknown) {
      if (previewMode) {
        setMedicines(PREVIEW_MEDICINES);
        setHasNext(false);
        setTotal(PREVIEW_MEDICINES.length);
      } else {
        const errorMessage = getErrorMessage(
          err,
          "Não foi possível carregar os medicamentos.",
          "Medicines:load",
        );
        toast({
          title: "Erro ao carregar medicamentos",
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
    fetchMedicines();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchMedicines is stable
  }, [page, searchFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchFilter]);

  return (
    <Layout
      title="Medicamentos"
      description="Cadastro consultável com busca e paginação."
    >
      <PageSurfaceCard className="w-full p-6">
        <div className="mb-4">
          <TableFilter
            placeholder="Buscar por nome"
            onFilterChange={setSearchFilter}
          />
        </div>
        {loading ? (
          <SkeletonTable rows={5} cols={columns.length} />
        ) : medicines.length === 0 ? (
          <EmptyStateCard
            icon={Pill}
            title="Nenhum medicamento encontrado"
            description={
              searchFilter
                ? "Tente outro termo de busca ou limpe o filtro."
                : "Cadastre medicamentos para vê-los listados aqui."
            }
          >
            {!previewMode ? (
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href="/medicines/register">Cadastrar medicamento</Link>
              </Button>
            ) : null}
          </EmptyStateCard>
        ) : (
          <EditableTable
            data={medicines}
            columns={columns}
            entityType="medicines"
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
      </PageSurfaceCard>
    </Layout>
  );
}
