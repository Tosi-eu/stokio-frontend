import Layout from "@/components/Layout";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary.hook";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Skeleton } from "@/components/ui/skeleton";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_PAGE_SIZE, paginate } from "@/helpers/paginacao.helper";

import EditableTable from "@/components/EditableTable";
import { DashboardStatsCard } from "@/components/DashboardStatsCard";

const DashboardChartCard = lazy(() =>
  import("@/components/DashboardChartCard").then((module) => ({
    default: module.DashboardChartCard,
  })),
);
import {
  StockDistributionItem,
  RecentMovement,
  MedicineRankingItem,
} from "@/interfaces/interfaces";
import StockProportionCard from "@/components/StockProportionCard";
import { prepareStockDistributionData } from "@/helpers/estoque.helper";
import { SectorType } from "@/utils/enums";
import { useMaxSectionRows } from "@/hooks/use-max-selection-rows";
import { getCabinets, getDrawers } from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { useUiDisplay } from "@/context/ui-display-context";
import {
  formatArmarioDisplay,
  formatCaselaDisplay,
  formatGavetaDisplay,
  cabinetCategoryByNumero,
  drawerCategoryByNumero,
} from "@/helpers/ui-display.helper";

export default function Dashboard() {
  const navigate = useNavigate();
  const { uiDisplay } = useUiDisplay();

  const [cabinetList, setCabinetList] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);
  const [drawerList, setDrawerList] = useState<
    Array<{ numero: number; categoria: string }>
  >([]);
  const cabMap = useMemo(
    () => cabinetCategoryByNumero(cabinetList),
    [cabinetList],
  );
  const drwMap = useMemo(
    () => drawerCategoryByNumero(drawerList),
    [drawerList],
  );

  const [belowMin, setBelowMin] = useState<number>(0);
  const [nearMin, setNearMin] = useState<number>(0);
  const [expired, setExpired] = useState<number>(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState<number>(0);
  const [cabinetStockData, setCabinetStockData] = useState<
    Array<{ label: string; total: number }>
  >([]);
  const [drawerStockData, setDrawerStockData] = useState<
    Array<{ label: string; total: number }>
  >([]);
  const [nonMovementPage, setNonMovementPage] = useState(1);
  const [recentMovementsPage, setRecentMovementsPage] = useState(1);

  const [nursingDistribution, setNursingDistribution] = useState<
    StockDistributionItem[]
  >([]);
  const [pharmacyDistribution, setPharmacyDistribution] = useState<
    StockDistributionItem[]
  >([]);

  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);

  const [mostMovData, setMostMovData] = useState<MedicineRankingItem[]>([]);
  const [leastMovData, setLeastMovData] = useState<MedicineRankingItem[]>([]);
  const [nonMovementProducts, setNonMovementProducts] = useState<unknown[]>([]);
  const [loadingNonMovement, setLoadingNonMovement] = useState(true);
  const [loadingRecentMovements, setLoadingRecentMovements] = useState(true);

  const {
    summary,
    isLoading: loadingSummary,
    error: summaryError,
  } = useDashboardSummary();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cabs, drs] = await Promise.all([
          fetchAllPaginated((p, l) => getCabinets(p, l), 100),
          fetchAllPaginated((p, l) => getDrawers(p, l), 100),
        ]);
        if (cancelled) return;
        setCabinetList(
          cabs.map((c: { numero: number; categoria: string }) => ({
            numero: c.numero,
            categoria: c.categoria,
          })),
        );
        setDrawerList(
          drs.map((d: { numero: number; categoria: string }) => ({
            numero: d.numero,
            categoria: d.categoria,
          })),
        );
      } catch {
        if (!cancelled) {
          setCabinetList([]);
          setDrawerList([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (summaryError) {
      toast({
        title: "Erro ao carregar dados",
        description:
          summaryError instanceof Error
            ? summaryError.message
            : "Não foi possível carregar os dados do dashboard.",
        variant: "error",
        duration: 3000,
      });
    }
  }, [summaryError]);

  useEffect(() => {
    if (!summary) return;
    try {
      setLoadingNonMovement(true);
      setLoadingRecentMovements(true);

      const a = summary.alerts || {};
      setBelowMin(a.belowMin ?? 0);
      setNearMin(a.nearMin ?? 0);
      setExpired(a.expired ?? 0);
      setExpiringSoonCount(a.expiringSoon ?? 0);

      const recent = summary.recentMovements || [];
      setRecentMovements(
        recent.slice(0, DEFAULT_PAGE_SIZE).map((m) => {
          const armNum = m.CabinetModel?.num_armario;
          return {
            name: m.MedicineModel?.nome || m.InputModel?.nome || "-",
            type: m.tipo,
            operator: m.LoginModel?.login || "-",
            casela: formatCaselaDisplay(
              m.ResidentModel?.num_casela,
              m.ResidentModel?.nome,
              uiDisplay,
              m.setor,
            ),
            quantity: m.quantidade,
            patient: m.ResidentModel ? m.ResidentModel.nome : "-",
            cabinet: formatArmarioDisplay(
              armNum,
              armNum != null ? cabMap.get(armNum) ?? null : null,
              uiDisplay.armario,
            ),
            date: m.data,
          };
        }),
      );

      setNonMovementProducts(
        Array.isArray(summary.nonMovementProducts)
          ? summary.nonMovementProducts.slice(0, DEFAULT_PAGE_SIZE)
          : [],
      );

      const more = summary.medicineRankingMore?.data || [];
      setMostMovData(
        more.map((item) => ({
          name: item.medicamento?.nome ?? "-",
          substance: item.medicamento?.principio_ativo ?? "-",
          total: item.total_movimentado ?? 0,
          entradas: item.total_entradas ?? 0,
          saidas: item.total_saidas ?? 0,
        })),
      );

      const less = summary.medicineRankingLess?.data || [];
      setLeastMovData(
        less.map((item) => ({
          name: item.medicamento?.nome ?? "-",
          substance: item.medicamento?.principio_ativo ?? "-",
          total: item.total_movimentado ?? 0,
          entradas: item.total_entradas ?? 0,
          saidas: item.total_saidas ?? 0,
        })),
      );

      const nursingRes = summary.nursingProportion;
      const pharmacyRes = summary.pharmacyProportion;
      if (nursingRes) {
        setNursingDistribution(
          prepareStockDistributionData(nursingRes, SectorType.ENFERMAGEM).sort(
            (a, b) => b.rawValue - a.rawValue,
          ),
        );
      }
      if (pharmacyRes) {
        setPharmacyDistribution(
          prepareStockDistributionData(pharmacyRes, SectorType.FARMACIA).sort(
            (a, b) => b.rawValue - a.rawValue,
          ),
        );
      }

      const cabinetRes = summary.cabinetStockData;
      const drawerRes = summary.drawerStockData;
      if (cabinetRes?.data) {
        setCabinetStockData(
          cabinetRes.data.map((arm) => ({
            label: formatArmarioDisplay(
              arm.armario_id,
              cabMap.get(arm.armario_id) ?? null,
              uiDisplay.armario,
            ),
            total: Number(arm.total_geral) || 0,
          })),
        );
      }
      if (drawerRes?.data) {
        setDrawerStockData(
          drawerRes.data.map((drawer) => ({
            label: formatGavetaDisplay(
              drawer.gaveta_id,
              drwMap.get(drawer.gaveta_id) ?? null,
              uiDisplay.gaveta,
            ),
            total: Number(drawer.total_geral) || 0,
          })),
        );
      }
    } finally {
      setLoadingNonMovement(false);
      setLoadingRecentMovements(false);
    }
  }, [summary, uiDisplay, cabMap, drwMap]);

  const stats = useMemo(
    () => [
      {
        label: "Itens Abaixo do Estoque Mínimo",
        value: belowMin,
        onClick: () => navigate("/stock?filter=belowMin"),
      },
      {
        label: "Itens Próximos do Estoque Mínimo",
        value: nearMin,
        onClick: () => navigate("/stock?filter=nearMin"),
      },
      {
        label: "Itens Vencidos",
        value: expired,
        onClick: () => navigate("/stock?filter=expired"),
      },
      {
        label: "Itens com Vencimento Próximo",
        value: expiringSoonCount,
        onClick: () => navigate("/stock?filter=expiringSoon"),
      },
    ],
    [belowMin, nearMin, expired, expiringSoonCount, navigate],
  );

  const COLORS = useMemo(
    () => [
      "#0EA5E9",
      "#FACC15",
      "#10B981",
      "#EF4444",
      "#8B5CF6",
      "#F97316",
      "#14B8A6",
      "#6366F1",
    ],
    [],
  );

  const minRowsMovements = useMaxSectionRows(
    [nonMovementProducts, recentMovements],
    { min: DEFAULT_PAGE_SIZE },
  );

  const paginatedNonMovement = useMemo(
    () => paginate(nonMovementProducts, nonMovementPage),
    [nonMovementProducts, nonMovementPage],
  );

  const paginatedRecentMovements = useMemo(
    () => paginate(recentMovements, recentMovementsPage),
    [recentMovements, recentMovementsPage],
  );

  return (
    <Layout>
      <div className="space-y-10 pt-10">
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loadingSummary
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="flex flex-col items-center py-8">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-12 w-16" />
                    </CardContent>
                  </Card>
                ))
              : stats.map((stat, index) => (
                  <DashboardStatsCard
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    onClick={stat.onClick}
                  />
                ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Produtos com Maior Tempo Sem Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableTable
                columns={[
                  { key: "nome", label: "Nome" },
                  { key: "detalhe", label: "Detalhe" },
                  { key: "dias_parados", label: "Dias Parados" },
                  {
                    key: "ultima_movimentacao",
                    label: "Data",
                  },
                ]}
                data={paginatedNonMovement as Record<string, unknown>[]}
                showAddons={false}
                minRows={minRowsMovements}
                loading={loadingNonMovement}
              />
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <span className="text-sm text-slate-500">
                  Página {nonMovementPage} de{" "}
                  {Math.max(
                    1,
                    Math.ceil(nonMovementProducts.length / DEFAULT_PAGE_SIZE),
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    disabled={nonMovementPage === 1}
                    onClick={() => setNonMovementPage((p) => p - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    disabled={
                      nonMovementPage * DEFAULT_PAGE_SIZE >=
                      nonMovementProducts.length
                    }
                    onClick={() => setNonMovementPage((p) => p + 1)}
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Movimentações Recentes
              </CardTitle>
            </CardHeader>

            <CardContent>
              <EditableTable
                columns={[
                  { key: "name", label: "Produto" },
                  { key: "type", label: "Tipo" },
                  { key: "casela", label: "Casela" },
                  { key: "quantity", label: "Quantidade" },
                  { key: "patient", label: "Paciente" },
                  { key: "date", label: "Data" },
                ]}
                data={
                  paginatedRecentMovements as unknown as Record<
                    string,
                    unknown
                  >[]
                }
                minRows={minRowsMovements}
                showAddons={false}
                loading={loadingRecentMovements}
              />
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <span className="text-sm text-slate-500">
                  Página {recentMovementsPage} de{" "}
                  {Math.max(
                    1,
                    Math.ceil(recentMovements.length / DEFAULT_PAGE_SIZE),
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    disabled={recentMovementsPage === 1}
                    onClick={() => setRecentMovementsPage((p) => p - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    disabled={
                      recentMovementsPage * DEFAULT_PAGE_SIZE >=
                      recentMovements.length
                    }
                    onClick={() => setRecentMovementsPage((p) => p + 1)}
                  >
                    Próximo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Top 10 Medicações Mais Movimentadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableTable
                columns={[
                  { key: "name", label: "Nome" },
                  { key: "substance", label: "Princípio Ativo" },
                  { key: "total", label: "Total" },
                  { key: "entradas", label: "Entradas" },
                  { key: "saidas", label: "Saídas" },
                ]}
                data={mostMovData as unknown as Record<string, unknown>[]}
                showAddons={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Top 10 Medicações Menos Movimentadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableTable
                columns={[
                  { key: "name", label: "Nome" },
                  { key: "substance", label: "Princípio Ativo" },
                  { key: "total", label: "Total" },
                  { key: "entradas", label: "Entradas" },
                  { key: "saidas", label: "Saídas" },
                ]}
                data={leastMovData as unknown as Record<string, unknown>[]}
                showAddons={false}
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<SkeletonCard />}>
            <DashboardChartCard
              title="Quantidade de Itens por Armário"
              data={cabinetStockData}
              gradientId="barFillCabinet"
              gradientColors={{ start: "#0284c7", end: "#0369a1" }}
            />
          </Suspense>

          <Suspense fallback={<SkeletonCard />}>
            <DashboardChartCard
              title="Quantidade de Itens por Gaveta"
              data={drawerStockData}
              gradientId="barFillDrawer"
              gradientColors={{ start: "#34d399", end: "#059669" }}
            />
          </Suspense>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockProportionCard
            title="Proporção de Estoque da Farmácia"
            data={pharmacyDistribution}
            colors={COLORS}
          />

          <StockProportionCard
            title="Proporção de Estoque da Enfermagem"
            data={nursingDistribution}
            colors={COLORS}
          />
        </section>
      </div>
    </Layout>
  );
}
