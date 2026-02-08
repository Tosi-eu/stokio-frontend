import Layout from "@/components/Layout";
import { useEffect, useState, useMemo, memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SkeletonTable } from "@/components/SkeletonTable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_PAGE_SIZE,
  fetchAllPaginated,
  paginate,
} from "@/helpers/paginacao.helper";

import EditableTable from "@/components/EditableTable";
import { DashboardStatsCard } from "@/components/DashboardStatsCard";

const DashboardChartCard = lazy(() =>
  import("@/components/DashboardChartCard").then((module) => ({
    default: module.DashboardChartCard,
  })),
);
import {
  getInputMovements,
  getMedicineMovements,
  getMedicineRanking,
  getNonMovementProducts,
  getStock,
  getStockProportions,
  getTodayMedicineNotifications,
  getTomorrowReplacementNotifications,
  updateNotification,
} from "@/api/requests";
import {
  StockStatusItem,
  CabinetStockItem,
  StockDistributionItem,
  RecentMovement,
  MedicineRankingItem,
  RawMovement,
  DrawerStockItem,
} from "@/interfaces/interfaces";
const NotificationReminderModal = lazy(
  () => import("@/components/NotificationModal"),
);
const StockReplacementModal = lazy(
  () =>
    import("@/components/StockReplacementModal").then((m) => ({
      default: m.default,
    })),
);
import StockProportionCard from "@/components/StockProportionCard";
import { prepareStockDistributionData } from "@/helpers/estoque.helper";
import { SectorType } from "@/utils/enums";
import { useMaxSectionRows } from "@/hooks/use-max-selection-rows";

export default function Dashboard() {
  const navigate = useNavigate();

  const [noStock, setNoStock] = useState<number>(0);
  const [belowMin, setBelowMin] = useState<number>(0);
  const [expired, setExpired] = useState<number>(0);
  const [expiringSoon, setExpiringSoon] = useState<StockStatusItem[]>([]);
  const [cabinetStockData, setCabinetStockData] = useState<CabinetStockItem[]>(
    [],
  );
  const [drawerStockData, setDrawerStockData] = useState<DrawerStockItem[]>([]);
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
  const [nonMovementProducts, setNonMovementProducts] = useState<any[]>([]);
  const [loadingNonMovement, setLoadingNonMovement] = useState(true);
  const [loadingRecentMovements, setLoadingRecentMovements] = useState(true);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState([]);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementItems, setReplacementItems] = useState<
    import("@/components/StockReplacementModal").StockReplacementItem[]
  >([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingNonMovement(true);
        setLoadingRecentMovements(true);
        const [
          stockList,
          medicamentosMov,
          insumosMov,
          nursingRes,
          pharmacyRes,
          cabinetRes,
          drawerRes,
        ] = await Promise.all([
          fetchAllPaginated((page, limit) =>
            getStock(page, limit).then((res) => res),
          ),

          fetchAllPaginated((page, limit) =>
            getMedicineMovements({ page, limit, days: 7 }).then((res) => res),
          ),

          fetchAllPaginated((page, limit) =>
            getInputMovements({ page, limit, days: 7 }).then((res) => res),
          ),

          getStockProportions("enfermagem"),
          getStockProportions("farmacia"),
          getStock(1, 10, { type: "armarios" }),
          getStock(1, 20, { type: "gavetas" }),
        ]);

        const [medMoreRes, medLessRes, nonMovementRes] = await Promise.all([
          getMedicineRanking("more"),
          getMedicineRanking("less"),
          getNonMovementProducts(),
        ]);

        const recentMovements = [
          ...medicamentosMov.map((m: RawMovement) => ({
            name: m.MedicineModel?.nome || "-",
            type: m.tipo,
            operator: m.LoginModel?.login || "-",
            casela: m.ResidentModel?.num_casela ?? "-",
            quantity: m.quantidade,
            patient: m.ResidentModel ? m.ResidentModel.nome : "-",
            cabinet: m.CabinetModel?.num_armario ?? "-",
            date: m.data,
          })),

          ...insumosMov.map((m: RawMovement) => ({
            name: m.InputModel?.nome || "-",
            type: m.tipo,
            operator: m.LoginModel?.login || "-",
            casela: m.ResidentModel?.num_casela ?? "-",
            quantity: m.quantidade,
            patient: m.ResidentModel ? m.ResidentModel.nome : "-",
            cabinet: m.CabinetModel?.num_armario ?? "-",
            date: m.data,
          })),
        ].sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));

        const noStockItems = (stockList as any).filter(
          (i) => i.st_quantidade === "critical",
        );

        const itemsInStockWarning = (stockList as any).filter(
          (i) => i.st_quantidade === "low",
        );

        const expiredItems = (stockList as any).filter(
          (i) => i.st_expiracao === "expired" && i.quantidade > 0,
        );

        const expiringSoonItems = (stockList as any).filter(
          (i) =>
            i.st_expiracao === "warning" ||
            (i.st_expiracao === "critical" && i.quantidade > 0),
        );

        setNoStock(noStockItems.length);
        setBelowMin(itemsInStockWarning.length);
        setExpired(expiredItems.length);
        setExpiringSoon(expiringSoonItems);

        setRecentMovements(recentMovements.slice(0, DEFAULT_PAGE_SIZE));
        setNonMovementProducts(
          Array.isArray(nonMovementRes)
            ? nonMovementRes.slice(0, DEFAULT_PAGE_SIZE)
            : [],
        );

        setMostMovData(
          medMoreRes.data.map((item) => ({
            name: item.medicamento.nome,
            substance: item.medicamento.principio_ativo,
            total: item.total_movimentado,
            entradas: item.total_entradas,
            saidas: item.total_saidas,
          })),
        );

        setLeastMovData(
          medLessRes.data.map((item) => ({
            name: item.medicamento.nome,
            substance: item.medicamento.principio_ativo,
            total: item.total_movimentado,
            entradas: item.total_entradas,
            saidas: item.total_saidas,
          })),
        );

        setNursingDistribution(
          prepareStockDistributionData(nursingRes, SectorType.ENFERMAGEM).sort(
            (a, b) => b.rawValue - a.rawValue,
          ),
        );

        setPharmacyDistribution(
          prepareStockDistributionData(pharmacyRes, SectorType.FARMACIA).sort(
            (a, b) => b.rawValue - a.rawValue,
          ),
        );

        const formattedCabinetData = cabinetRes.data.map((arm: any) => ({
          cabinet: arm.armario_id,
          total: Number(arm.total_geral) || 0,
        }));
        setCabinetStockData(formattedCabinetData);

        const formattedDrawerData = drawerRes.data.map((drawer: any) => ({
          drawer: drawer.gaveta_id,
          total: Number(drawer.total_geral) || 0,
        }));
        setDrawerStockData(formattedDrawerData);
      } catch (err: any) {
        toast({
          title: "Erro ao carregar dados",
          description:
            err?.message || "Não foi possível carregar os dados do dashboard.",
          variant: "error",
          duration: 3000,
        });
      } finally {
        setLoadingNonMovement(false);
        setLoadingRecentMovements(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    async function fetchReminders() {
      try {
        const res = await getTodayMedicineNotifications();
        console.log('gt', res)
        const notifications = res.items;
        
        if (notifications.length > 0) {
          setNotifList(notifications);
          setNotifOpen(true);
        
          await Promise.all(
            notifications.map((n) =>
              updateNotification(n.id, { visto: true })
            ),
          );
        }
        
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as notificações do dia.";
        toast({
          title: "Erro ao carregar notificações",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
      }
    }

    fetchReminders();
  }, []);

  useEffect(() => {
    async function fetchReplacementReminders() {
      try {
        const res = await getTomorrowReplacementNotifications();
        console.log('gt2', res)
        const items = res.items;

        if (items.length > 0) {
          setReplacementItems(items);
          setReplacementOpen(true);
        }
      } catch { /* NO-OP */}
    }

    fetchReplacementReminders();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Itens Abaixo do Estoque Mínimo",
        value: noStock,
        onClick: () => navigate("/stock?filter=belowMin"),
      },
      {
        label: "Itens Próximos do Estoque Mínimo",
        value: belowMin,
        onClick: () => navigate("/stock?filter=nearMin"),
      },
      {
        label: "Itens Vencidos",
        value: expired,
        onClick: () => navigate("/stock?filter=expired"),
      },
      {
        label: "Itens com Vencimento Próximo",
        value: expiringSoon.length,
        onClick: () => navigate("/stock?filter=expiringSoon"),
      },
    ],
    [noStock, belowMin, expired, expiringSoon, navigate],
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
            {stats.map((stat, index) => (
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
                data={paginatedNonMovement}
                showAddons={false}
                minRows={minRowsMovements}
                loading={loadingNonMovement}
              />
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  disabled={nonMovementPage === 1}
                  onClick={() => setNonMovementPage((p) => p - 1)}
                >
                  Anterior
                </button>

                <button
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  disabled={
                    nonMovementPage * DEFAULT_PAGE_SIZE >=
                    nonMovementProducts.length
                  }
                  onClick={() => setNonMovementPage((p) => p + 1)}
                >
                  Próximo
                </button>
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
                data={paginatedRecentMovements}
                minRows={minRowsMovements}
                showAddons={false}
                loading={loadingRecentMovements}
              />
              <div className="flex justify-center gap-2 mt-4">
                <button
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  disabled={recentMovementsPage === 1}
                  onClick={() => setRecentMovementsPage((p) => p - 1)}
                >
                  Anterior
                </button>

                <button
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  disabled={
                    recentMovementsPage * DEFAULT_PAGE_SIZE >=
                    recentMovements.length
                  }
                  onClick={() => setRecentMovementsPage((p) => p + 1)}
                >
                  Próximo
                </button>
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
                data={mostMovData}
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
                data={leastMovData}
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
              dataKey="cabinet"
              gradientId="barFillCabinet"
              gradientColors={{ start: "#0284c7", end: "#0369a1" }}
            />
          </Suspense>

          <Suspense fallback={<SkeletonCard />}>
            <DashboardChartCard
              title="Quantidade de Itens por Gaveta"
              data={drawerStockData}
              dataKey="drawer"
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

      <Suspense fallback={null}>
        <NotificationReminderModal
          open={notifOpen}
          events={notifList}
          onClose={() => setNotifOpen(false)}
        />
        <StockReplacementModal
          open={replacementOpen}
          items={replacementItems}
          onClose={() => setReplacementOpen(false)}
        />
      </Suspense>
    </Layout>
  );
}
