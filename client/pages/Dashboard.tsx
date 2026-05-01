import Layout from "@/components/Layout";
import {
  useEffect,
  useState,
  useMemo,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary.hook";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast.hook";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Skeleton } from "@/components/ui/skeleton";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_PAGE_SIZE,
  fetchAllPaginated,
  paginate,
} from "@/helpers/paginacao.helper";
import { getCabinets, getDrawers } from "@/api/requests";
import {
  cabinetCategoryByNumero,
  drawerCategoryByNumero,
  formatArmarioDisplay,
  formatGavetaDisplay,
} from "@/helpers/ui-display.helper";

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
import { useTenant } from "@/hooks/use-tenant.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import { formatCaselaLabel } from "@/helpers/storage-location-display.helper";
import { PREVIEW_CABINETS, PREVIEW_DRAWERS } from "@/helpers/preview-mock-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardWidgetShell } from "@/components/dashboard/DashboardWidgetShell";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout.hook";
import {
  DASHBOARD_WIDGET_LABELS,
  type DashboardWidgetId,
} from "@/constants/dashboard-widgets";
import {
  formatTenantSectorKeyLabel,
  getEnabledSectors,
} from "@/helpers/tenant-sectors.helper";
import { formatDateToPtBr } from "@/helpers/dates.helper";

export default function Dashboard() {
  const { uiDisplay, previewMode, modules, tenantId } = useTenant();
  const { can } = usePermissionMatrix();
  const canEditDashboard =
    can("dashboard", "create") ||
    can("dashboard", "update") ||
    can("dashboard", "delete");
  const router = useRouter();
  const enabledSectors = useMemo(() => getEnabledSectors(modules), [modules]);
  const showPharmacySector = enabledSectors.includes("farmacia");
  const showNursingSector = enabledSectors.includes("enfermagem");
  const dashLayout = useDashboardLayout(tenantId);
  const [addWidgetsOpen, setAddWidgetsOpen] = useState(false);

  useEffect(() => {
    if (!canEditDashboard && dashLayout.editMode) {
      dashLayout.setEditMode(false);
    }
  }, [canEditDashboard, dashLayout]);

  const widgetVisible = useCallback(
    (id: DashboardWidgetId) => dashLayout.isVisible(id),
    [dashLayout],
  );

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
        const cabMapped = cabs.map(
          (c: { numero: number; categoria: string }) => ({
            numero: c.numero,
            categoria: c.categoria,
          }),
        );
        const drwMapped = drs.map(
          (d: { numero: number; categoria: string }) => ({
            numero: d.numero,
            categoria: d.categoria,
          }),
        );
        if (previewMode && cabMapped.length === 0 && drwMapped.length === 0) {
          setCabinetList(PREVIEW_CABINETS);
          setDrawerList(PREVIEW_DRAWERS);
        } else {
          setCabinetList(cabMapped);
          setDrawerList(drwMapped);
        }
      } catch {
        if (!cancelled) {
          if (previewMode) {
            setCabinetList(PREVIEW_CABINETS);
            setDrawerList(PREVIEW_DRAWERS);
          } else {
            setCabinetList([]);
            setDrawerList([]);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewMode]);

  useEffect(() => {
    if (summaryError && !previewMode) {
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
  }, [summaryError, previewMode]);

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
        recent.slice(0, DEFAULT_PAGE_SIZE).map((m) => ({
          name: m.MedicineModel?.nome || m.InputModel?.nome || "-",
          type: m.tipo,
          operator: m.LoginModel?.login || "-",
          casela: formatCaselaLabel(uiDisplay.casela, {
            caselaId: m.ResidentModel?.num_casela,
            residentName: m.ResidentModel?.nome,
          }),
          quantity: m.quantidade,
          patient: m.ResidentModel ? m.ResidentModel.nome : "-",
          cabinet: m.CabinetModel?.num_armario ?? "-",
          date: formatDateToPtBr(m.data as string),
        })),
      );

      setNonMovementProducts(
        Array.isArray(summary.nonMovementProducts)
          ? summary.nonMovementProducts
              .slice(0, DEFAULT_PAGE_SIZE)
              .map((row: Record<string, unknown>) => ({
                ...row,
                ultima_movimentacao: formatDateToPtBr(
                  row.ultima_movimentacao as string,
                ),
              }))
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
      } else {
        setNursingDistribution([]);
      }
      if (pharmacyRes) {
        setPharmacyDistribution(
          prepareStockDistributionData(pharmacyRes, SectorType.FARMACIA).sort(
            (a, b) => b.rawValue - a.rawValue,
          ),
        );
      } else {
        setPharmacyDistribution([]);
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
        onClick: () => router.push("/stock?filter=belowMin"),
      },
      {
        label: "Itens Próximos do Estoque Mínimo",
        value: nearMin,
        onClick: () => router.push("/stock?filter=nearMin"),
      },
      {
        label: "Itens Vencidos",
        value: expired,
        onClick: () => router.push("/stock?filter=expired"),
      },
      {
        label: "Itens com Vencimento Próximo",
        value: expiringSoonCount,
        onClick: () => router.push("/stock?filter=expiringSoon"),
      },
    ],
    [belowMin, nearMin, expired, expiringSoonCount, router],
  );

  const COLORS = useMemo(
    () => [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-6))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-8))",
      "hsl(var(--chart-7))",
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

  const showKpis = widgetVisible("kpis");
  const showNonMovement = widgetVisible("nonMovement");
  const showRecentMovements = widgetVisible("recentMovements");
  const showMostMoved = widgetVisible("mostMoved");
  const showLeastMoved = widgetVisible("leastMoved");
  const showCabinetChart = widgetVisible("cabinetChart");
  const showDrawerChart = widgetVisible("drawerChart");
  const showPharmacyChart =
    showPharmacySector && widgetVisible("pharmacyProportion");
  const showNursingChart =
    showNursingSector && widgetVisible("nursingProportion");

  const movementGridClass =
    showNonMovement && showRecentMovements
      ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
      : "grid grid-cols-1 gap-6";

  const rankingGridClass =
    showMostMoved && showLeastMoved
      ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
      : "grid grid-cols-1 gap-6";

  const barGridClass =
    showCabinetChart && showDrawerChart
      ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
      : "grid grid-cols-1 gap-6";

  const proportionGridClass =
    showPharmacyChart && showNursingChart
      ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
      : "grid grid-cols-1 gap-6";

  return (
    <Layout>
      <div className="space-y-8 sm:space-y-10 pt-2 sm:pt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight">
              Painel
            </h1>
            <p className="text-sm text-muted-foreground">
              Resumo do estoque e movimentações. Setores ativos:{" "}
              {enabledSectors.map(formatTenantSectorKeyLabel).join(" · ")}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {canEditDashboard ? (
              <>
                <Button
                  type="button"
                  variant={dashLayout.editMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => dashLayout.setEditMode(!dashLayout.editMode)}
                >
                  {dashLayout.editMode
                    ? "Concluir edição"
                    : "Personalizar painel"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={dashLayout.hiddenForPicker.length === 0}
                  onClick={() => setAddWidgetsOpen(true)}
                >
                  Adicionar componentes
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <Dialog open={addWidgetsOpen} onOpenChange={setAddWidgetsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Componentes ocultos</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Escolha o que deseja exibir novamente no painel.
            </p>
            <ul className="space-y-2 max-h-64 overflow-y-auto py-2">
              {dashLayout.hiddenForPicker.map((id) => (
                <li key={id}>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => {
                      dashLayout.show(id);
                      setAddWidgetsOpen(false);
                    }}
                  >
                    {DASHBOARD_WIDGET_LABELS[id]}
                  </Button>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddWidgetsOpen(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showKpis ? (
          <DashboardWidgetShell
            id="kpis"
            editMode={dashLayout.editMode}
            wide={dashLayout.isWide("kpis")}
            allowWide={false}
            onHide={() => dashLayout.hide("kpis")}
            onToggleWide={() => dashLayout.toggleWide("kpis")}
          >
            <section>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
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
          </DashboardWidgetShell>
        ) : null}

        {showNonMovement || showRecentMovements ? (
          <section className={movementGridClass}>
            {showNonMovement ? (
              <DashboardWidgetShell
                id="nonMovement"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("nonMovement")}
                onHide={() => dashLayout.hide("nonMovement")}
                onToggleWide={() => dashLayout.toggleWide("nonMovement")}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center font-display text-lg tracking-tight">
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
                      <span className="text-sm text-muted-foreground">
                        Página {nonMovementPage} de{" "}
                        {Math.max(
                          1,
                          Math.ceil(
                            nonMovementProducts.length / DEFAULT_PAGE_SIZE,
                          ),
                        )}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border border-border rounded-md bg-background disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={nonMovementPage === 1}
                          onClick={() => setNonMovementPage((p) => p - 1)}
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border border-border rounded-md bg-background disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              </DashboardWidgetShell>
            ) : null}

            {showRecentMovements ? (
              <DashboardWidgetShell
                id="recentMovements"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("recentMovements")}
                onHide={() => dashLayout.hide("recentMovements")}
                onToggleWide={() => dashLayout.toggleWide("recentMovements")}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center font-display text-lg tracking-tight">
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
                      <span className="text-sm text-muted-foreground">
                        Página {recentMovementsPage} de{" "}
                        {Math.max(
                          1,
                          Math.ceil(recentMovements.length / DEFAULT_PAGE_SIZE),
                        )}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border border-border rounded-md bg-background disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={recentMovementsPage === 1}
                          onClick={() => setRecentMovementsPage((p) => p - 1)}
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border border-border rounded-md bg-background disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              </DashboardWidgetShell>
            ) : null}
          </section>
        ) : null}

        {showMostMoved || showLeastMoved ? (
          <section className={rankingGridClass}>
            {showMostMoved ? (
              <DashboardWidgetShell
                id="mostMoved"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("mostMoved")}
                onHide={() => dashLayout.hide("mostMoved")}
                onToggleWide={() => dashLayout.toggleWide("mostMoved")}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center font-display text-lg tracking-tight">
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
              </DashboardWidgetShell>
            ) : null}

            {showLeastMoved ? (
              <DashboardWidgetShell
                id="leastMoved"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("leastMoved")}
                onHide={() => dashLayout.hide("leastMoved")}
                onToggleWide={() => dashLayout.toggleWide("leastMoved")}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center font-display text-lg tracking-tight">
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
                      data={
                        leastMovData as unknown as Record<string, unknown>[]
                      }
                      showAddons={false}
                    />
                  </CardContent>
                </Card>
              </DashboardWidgetShell>
            ) : null}
          </section>
        ) : null}

        {showCabinetChart || showDrawerChart ? (
          <section className={barGridClass}>
            {showCabinetChart ? (
              <DashboardWidgetShell
                id="cabinetChart"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("cabinetChart")}
                onHide={() => dashLayout.hide("cabinetChart")}
                onToggleWide={() => dashLayout.toggleWide("cabinetChart")}
              >
                <Suspense fallback={<SkeletonCard />}>
                  <DashboardChartCard
                    title="Quantidade de Itens por Armário"
                    data={cabinetStockData}
                    gradientId="barFillCabinet"
                    gradientColors={{
                      start: "hsl(215 52% 42%)",
                      end: "hsl(222 48% 28%)",
                    }}
                  />
                </Suspense>
              </DashboardWidgetShell>
            ) : null}

            {showDrawerChart ? (
              <DashboardWidgetShell
                id="drawerChart"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("drawerChart")}
                onHide={() => dashLayout.hide("drawerChart")}
                onToggleWide={() => dashLayout.toggleWide("drawerChart")}
              >
                <Suspense fallback={<SkeletonCard />}>
                  <DashboardChartCard
                    title="Quantidade de Itens por Gaveta"
                    data={drawerStockData}
                    gradientId="barFillDrawer"
                    gradientColors={{
                      start: "hsl(191 72% 48%)",
                      end: "hsl(205 55% 38%)",
                    }}
                  />
                </Suspense>
              </DashboardWidgetShell>
            ) : null}
          </section>
        ) : null}

        {showPharmacyChart || showNursingChart ? (
          <section className={proportionGridClass}>
            {showPharmacyChart ? (
              <DashboardWidgetShell
                id="pharmacyProportion"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("pharmacyProportion")}
                onHide={() => dashLayout.hide("pharmacyProportion")}
                onToggleWide={() => dashLayout.toggleWide("pharmacyProportion")}
              >
                <StockProportionCard
                  title="Proporção de Estoque da Farmácia"
                  data={pharmacyDistribution}
                  colors={COLORS}
                />
              </DashboardWidgetShell>
            ) : null}

            {showNursingChart ? (
              <DashboardWidgetShell
                id="nursingProportion"
                editMode={dashLayout.editMode}
                wide={dashLayout.isWide("nursingProportion")}
                onHide={() => dashLayout.hide("nursingProportion")}
                onToggleWide={() => dashLayout.toggleWide("nursingProportion")}
              >
                <StockProportionCard
                  title="Proporção de Estoque da Enfermagem"
                  data={nursingDistribution}
                  colors={COLORS}
                />
              </DashboardWidgetShell>
            ) : null}
          </section>
        ) : null}
      </div>
    </Layout>
  );
}
