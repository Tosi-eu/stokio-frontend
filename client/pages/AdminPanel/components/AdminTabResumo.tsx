import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Users,
  Pill,
  Bandage,
  Archive,
  Grid,
  Loader2,
  Search,
  Activity,
  LogIn,
} from "lucide-react";
import { formatDateToPtBr, formatValidityDate } from "@/helpers/dates.helper";
import type { MedicineAbcBundleRow } from "@/api/requests";
import type { AdminTabResumoProps } from "./admin-tab-resumo/admin-tab-resumo.types";
import { useAdminTabResumoMetrics } from "./admin-tab-resumo/useAdminTabResumoMetrics";
import { AdminTabResumoMetricsDialog } from "./admin-tab-resumo/AdminTabResumoMetricsDialog";

function AbcClassBadge({ c }: { c: "A" | "B" | "C" }) {
  const cls =
    c === "A"
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : c === "B"
        ? "bg-amber-100 text-amber-900 border border-amber-200"
        : "bg-slate-100 text-slate-700 border border-slate-200";
  return (
    <span
      className={`inline-flex min-w-[1.25rem] justify-center rounded px-1.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {c}
    </span>
  );
}

function AbcMovementTable({
  title,
  section,
  refreshKey,
}: {
  title: string;
  section:
    | { total_movimentado: number; rows: MedicineAbcBundleRow[] }
    | undefined;
  refreshKey: number;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const rows = section?.rows ?? [];
  const total = section?.total_movimentado ?? 0;

  useEffect(() => {
    setPage(1);
  }, [refreshKey, rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mb-8 last:mb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="text-xs text-muted-foreground">
          Volume total: <strong>{total}</strong> unidades
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Nenhum medicamento com movimentação neste tipo no período.
        </p>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto max-h-[320px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">ABC</TableHead>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Princípio ativo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">% do total</TableHead>
                  <TableHead className="text-right">% acum.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((row, idx) => (
                  <TableRow key={`${row.medicamento_id}-${idx}`}>
                    <TableCell>
                      <AbcClassBadge c={row.class} />
                    </TableCell>
                    <TableCell>{row.nome}</TableCell>
                    <TableCell
                      className="max-w-[180px] truncate"
                      title={row.principio_ativo}
                    >
                      {row.principio_ativo || "—"}
                    </TableCell>
                    <TableCell className="text-right">{row.qtd}</TableCell>
                    <TableCell className="text-right">
                      {row.share_of_total.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {row.cumulative_share.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > pageSize ? (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próximo
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function AdminTabResumo({
  metrics,
  summary,
  loadingSummary,
  expandedSummary,
  summaryListData,
  loadingSummaryList,
  loadSummaryList,
  expiringDays,
  setExpiringDays,
  expiringItems,
  expiringItemsTotal,
  expiringItemsPage,
  setExpiringItemsPage,
  loadingExpiringItems,
  consumptionStart,
  setConsumptionStart,
  consumptionEnd,
  setConsumptionEnd,
  consumptionByItemData,
  loadingConsumptionByItem,
  fetchConsumptionByItem,
  stockHistoryItemType,
  setStockHistoryItemType,
  stockHistoryItemSearch,
  setStockHistoryItemSearch,
  stockHistoryItemOptions,
  stockHistorySelectedItem,
  setStockHistorySelectedItem,
  loadingStockHistoryItemSearch,
  stockHistoryItemPopoverOpen,
  setStockHistoryItemPopoverOpen,
  stockHistoryLote,
  setStockHistoryLote,
  stockHistoryData,
  stockHistoryTotal,
  loadingStockHistory,
  fetchStockHistoryByItem,
  fetchStockHistoryByLote,
  stockHistoryPage,
  setStockHistoryPage,
  stockHistoryLimit,
  setStockHistoryLimit,
  abcDays,
  setAbcDays,
  abcBundle,
  loadingAbc,
}: AdminTabResumoProps) {
  const metricsVm = useAdminTabResumoMetrics();
  const { setMetricsDialog } = metricsVm;

  const [summaryListPage, setSummaryListPage] = useState(1);
  const [summaryListPageSize, setSummaryListPageSize] = useState(25);

  const [consumptionPage, setConsumptionPage] = useState(1);
  const [consumptionPageSize, setConsumptionPageSize] = useState(25);

  useEffect(() => {
    setConsumptionPage(1);
  }, [consumptionPageSize, consumptionByItemData.items.length]);

  const consumptionTotalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(consumptionByItemData.items.length / consumptionPageSize),
      ),
    [consumptionByItemData.items.length, consumptionPageSize],
  );

  const consumptionRows = useMemo(() => {
    const start = (consumptionPage - 1) * consumptionPageSize;
    return consumptionByItemData.items.slice(
      start,
      start + consumptionPageSize,
    );
  }, [consumptionByItemData.items, consumptionPage, consumptionPageSize]);

  const stockHistoryTotalPages = useMemo(
    () => Math.max(1, Math.ceil(stockHistoryTotal / stockHistoryLimit)),
    [stockHistoryTotal, stockHistoryLimit],
  );

  useEffect(() => {
    const id = setTimeout(() => setSummaryListPage(1), 0);
    return () => clearTimeout(id);
  }, [expandedSummary]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Visão geral do abrigo</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSummary ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : summary ? (
            <>
              {metrics != null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Card
                    className="bg-muted/40 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setMetricsDialog("movements")}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-2xl font-bold">
                            {metrics.movementsThisMonth}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Movimentações este mês
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Clique para listar
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="bg-muted/40 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setMetricsDialog("activeUsers")}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <LogIn className="h-8 w-8 text-sky-600" />
                        <div>
                          <p className="text-2xl font-bold">
                            {metrics.activeUsersThisMonth}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Usuários ativos este mês
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Clique para listar
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card
                  className={`bg-muted/40 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "residents" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => loadSummaryList("residents")}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">
                          {summary.residents}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Residentes
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Clique para listar
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`bg-muted/40 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "medicines" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => loadSummaryList("medicines")}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Pill className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">
                          {summary.medicines}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Medicamentos
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Clique para listar
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`bg-muted/40 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "inputs" ? "ring-2 ring-amber-500" : ""}`}
                  onClick={() => loadSummaryList("inputs")}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Bandage className="h-8 w-8 text-amber-600" />
                      <div>
                        <p className="text-2xl font-bold">{summary.inputs}</p>
                        <p className="text-sm text-muted-foreground">Insumos</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Clique para listar
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`bg-muted/40 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "cabinets" ? "ring-2 ring-primary/70" : ""}`}
                  onClick={() => loadSummaryList("cabinets")}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Archive className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{summary.cabinets}</p>
                        <p className="text-sm text-muted-foreground">
                          Armários
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Clique para listar
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`bg-muted/40 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "drawers" ? "ring-2 ring-sky-500/80" : ""}`}
                  onClick={() => loadSummaryList("drawers")}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Grid className="h-8 w-8 text-sky-600" />
                      <div>
                        <p className="text-2xl font-bold">{summary.drawers}</p>
                        <p className="text-sm text-muted-foreground">Gavetas</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Clique para listar
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {expandedSummary && (
                <div className="mt-6 border rounded-md overflow-auto max-h-[400px]">
                  <h3 className="text-sm font-medium p-2 border-b bg-slate-50">
                    {expandedSummary === "residents" && "Lista de residentes"}
                    {expandedSummary === "medicines" && "Lista de medicamentos"}
                    {expandedSummary === "inputs" && "Lista de insumos"}
                    {expandedSummary === "cabinets" && "Lista de armários"}
                    {expandedSummary === "drawers" && "Lista de gavetas"}
                  </h3>
                  {loadingSummaryList ? (
                    <div className="flex items-center gap-2 p-4 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-end gap-2 p-2 border-b bg-slate-50">
                        <span className="text-xs text-muted-foreground">
                          Itens/página
                        </span>
                        <Select
                          value={String(summaryListPageSize)}
                          onValueChange={(v) => {
                            setSummaryListPageSize(Number(v));
                            setSummaryListPage(1);
                          }}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            {expandedSummary === "residents" && (
                              <>
                                <TableHead>Casela</TableHead>
                                <TableHead>Nome</TableHead>
                              </>
                            )}
                            {expandedSummary === "medicines" && (
                              <>
                                <TableHead>Nome</TableHead>
                                <TableHead>Princípio ativo</TableHead>
                                <TableHead>Dosagem</TableHead>
                                <TableHead>Unidade</TableHead>
                              </>
                            )}
                            {expandedSummary === "inputs" && (
                              <>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                              </>
                            )}
                            {expandedSummary === "cabinets" && (
                              <>
                                <TableHead>Número</TableHead>
                                <TableHead>Categoria</TableHead>
                              </>
                            )}
                            {expandedSummary === "drawers" && (
                              <>
                                <TableHead>Número</TableHead>
                                <TableHead>Categoria</TableHead>
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summaryListData.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={
                                  expandedSummary === "medicines" ? 4 : 2
                                }
                                className="text-center text-muted-foreground"
                              >
                                Nenhum registro
                              </TableCell>
                            </TableRow>
                          ) : (
                            summaryListData
                              .slice(
                                (summaryListPage - 1) * summaryListPageSize,
                                (summaryListPage - 1) * summaryListPageSize +
                                  summaryListPageSize,
                              )
                              .map(
                                (row: Record<string, unknown>, idx: number) => (
                                  <TableRow key={idx}>
                                    {expandedSummary === "residents" && (
                                      <>
                                        <TableCell>
                                          {String(row.casela ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.name ?? "-")}
                                        </TableCell>
                                      </>
                                    )}
                                    {expandedSummary === "medicines" && (
                                      <>
                                        <TableCell>
                                          {String(row.nome ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.principio_ativo ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.dosagem ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.unidade_medida ?? "-")}
                                        </TableCell>
                                      </>
                                    )}
                                    {expandedSummary === "inputs" && (
                                      <>
                                        <TableCell>
                                          {String(row.nome ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.descricao ?? "-")}
                                        </TableCell>
                                      </>
                                    )}
                                    {expandedSummary === "cabinets" && (
                                      <>
                                        <TableCell>
                                          {String(row.numero ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.categoria ?? "-")}
                                        </TableCell>
                                      </>
                                    )}
                                    {expandedSummary === "drawers" && (
                                      <>
                                        <TableCell>
                                          {String(row.numero ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.categoria ?? "-")}
                                        </TableCell>
                                      </>
                                    )}
                                  </TableRow>
                                ),
                              )
                          )}
                        </TableBody>
                      </Table>

                      {summaryListData.length > summaryListPageSize && (
                        <div className="flex items-center justify-center gap-2 p-2 border-t bg-white">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={summaryListPage <= 1}
                            onClick={() =>
                              setSummaryListPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Página {summaryListPage} de{" "}
                            {Math.max(
                              1,
                              Math.ceil(
                                summaryListData.length / summaryListPageSize,
                              ),
                            )}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              summaryListPage >=
                              Math.ceil(
                                summaryListData.length / summaryListPageSize,
                              )
                            }
                            onClick={() =>
                              setSummaryListPage((p) =>
                                Math.min(
                                  Math.ceil(
                                    summaryListData.length /
                                      summaryListPageSize,
                                  ),
                                  p + 1,
                                ),
                              )
                            }
                          >
                            Próxima
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              Não foi possível carregar o resumo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Itens a vencer (próximos X dias)</CardTitle>
          <Select
            value={String(expiringDays)}
            onValueChange={(v) => {
              setExpiringDays(Number(v) as 30 | 60 | 90);
              setExpiringItemsPage(1);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loadingExpiringItems ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Dias p/ vencer</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Lote</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiringItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-4"
                        >
                          Nenhum item a vencer no período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expiringItems.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.nome}</TableCell>
                          <TableCell>{row.tipo_item}</TableCell>
                          <TableCell>
                            {formatValidityDate(row.validade)}
                          </TableCell>
                          <TableCell>{row.dias_para_vencer}</TableCell>
                          <TableCell>{row.quantidade}</TableCell>
                          <TableCell>{row.setor}</TableCell>
                          <TableCell>{row.lote ?? "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={expiringItemsPage === 1}
                  onClick={() => setExpiringItemsPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-slate-600 self-center">
                  Página {expiringItemsPage} ({expiringItemsTotal} itens)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={expiringItemsPage * 10 >= expiringItemsTotal}
                  onClick={() => setExpiringItemsPage((p) => p + 1)}
                >
                  Próximo
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 pb-2">
          <div>
            <CardTitle>Curva ABC (medicamentos)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Classes por volume acumulado (A ≤80%, B ≤95%, C restante) por tipo
              de movimentação — decisões de priorização e compras.
            </p>
          </div>
          <Select
            value={String(abcDays)}
            onValueChange={(v) => {
              setAbcDays(Number(v));
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="365">365 dias</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loadingAbc ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando curva ABC...
            </div>
          ) : abcBundle ? (
            <>
              <p className="text-xs text-muted-foreground mb-6">
                Período considerado:{" "}
                <strong>
                  {formatDateToPtBr(abcBundle.period.start)} —{" "}
                  {formatDateToPtBr(abcBundle.period.end)}
                </strong>
              </p>
              <AbcMovementTable
                title="Entradas"
                section={abcBundle.entrada}
                refreshKey={abcDays}
              />
              <AbcMovementTable
                title="Saídas"
                section={abcBundle.saida}
                refreshKey={abcDays}
              />
              <AbcMovementTable
                title="Transferências"
                section={abcBundle.transferencia}
                refreshKey={abcDays}
              />
            </>
          ) : (
            <p className="text-muted-foreground py-4">
              Não foi possível carregar a curva ABC.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Consumo por período (por item)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quantidade de entradas e saídas por medicamento/insumo no intervalo
            de datas.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Início</Label>
              <Input
                type="date"
                value={consumptionStart}
                onChange={(e) => setConsumptionStart(e.target.value)}
                className="w-[140px]"
              />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input
                type="date"
                value={consumptionEnd}
                onChange={(e) => setConsumptionEnd(e.target.value)}
                className="w-[140px]"
              />
            </div>
            <Button
              type="button"
              onClick={fetchConsumptionByItem}
              disabled={loadingConsumptionByItem}
            >
              {loadingConsumptionByItem ? "Carregando..." : "Buscar"}
            </Button>
          </div>
          {loadingConsumptionByItem ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <>
              <div className="flex items-center justify-end gap-2">
                <Label className="text-xs text-muted-foreground">
                  Itens por página
                </Label>
                <Select
                  value={String(consumptionPageSize)}
                  onValueChange={(v) => {
                    setConsumptionPageSize(Number(v));
                    setConsumptionPage(1);
                  }}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Entradas</TableHead>
                      <TableHead>Saídas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consumptionByItemData.items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-4"
                        >
                          Nenhum dado no período. Defina as datas e clique em
                          Buscar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {consumptionRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{row.nome}</TableCell>
                            <TableCell>
                              {row.tipo_item === "medicamento"
                                ? "Medicamento"
                                : "Insumo"}
                            </TableCell>
                            <TableCell>{row.entrada}</TableCell>
                            <TableCell>{row.saida}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-100 font-medium">
                          <TableCell colSpan={2}>Subtotal</TableCell>
                          <TableCell>
                            {consumptionByItemData.subtotal.entrada}
                          </TableCell>
                          <TableCell>
                            {consumptionByItemData.subtotal.saida}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {consumptionByItemData.items.length > consumptionPageSize ? (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={consumptionPage <= 1}
                    onClick={() =>
                      setConsumptionPage((p) => Math.max(1, p - 1))
                    }
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Página {consumptionPage} de {consumptionTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={consumptionPage >= consumptionTotalPages}
                    onClick={() =>
                      setConsumptionPage((p) =>
                        Math.min(consumptionTotalPages, p + 1),
                      )
                    }
                  >
                    Próximo
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico por item ou lote</CardTitle>
          <p className="text-sm text-muted-foreground">
            Busque o produto pelo nome ou por lote.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label className="text-xs">Buscar por item (nome)</Label>
              <div className="flex gap-2 mt-1 items-center flex-wrap">
                <Select
                  value={stockHistoryItemType}
                  onValueChange={(v) => {
                    setStockHistoryItemType(v as "medicamento" | "insumo");
                    setStockHistorySelectedItem(null);
                    setStockHistoryItemSearch("");
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medicamento">Medicamento</SelectItem>
                    <SelectItem value="insumo">Insumo</SelectItem>
                  </SelectContent>
                </Select>
                <Popover
                  open={stockHistoryItemPopoverOpen}
                  onOpenChange={setStockHistoryItemPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="min-w-[220px] justify-between"
                    >
                      {stockHistorySelectedItem
                        ? stockHistorySelectedItem.nome
                        : "Digite para buscar pelo nome..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder={
                            stockHistoryItemType === "medicamento"
                              ? "Buscar medicamento..."
                              : "Buscar insumo..."
                          }
                          value={stockHistoryItemSearch}
                          onChange={(e) =>
                            setStockHistoryItemSearch(e.target.value)
                          }
                          className="h-11 border-0 rounded-none bg-transparent py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <CommandEmpty>
                        {loadingStockHistoryItemSearch
                          ? "Carregando..."
                          : stockHistoryItemSearch.length < 2
                            ? "Digite ao menos 2 caracteres"
                            : "Nenhum resultado."}
                      </CommandEmpty>
                      <CommandGroup>
                        {stockHistoryItemOptions.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={String(opt.id)}
                            onSelect={() => {
                              setStockHistorySelectedItem(opt);
                              setStockHistoryItemSearch("");
                              setStockHistoryItemPopoverOpen(false);
                              setStockHistoryPage(1);
                              fetchStockHistoryByItem(opt.id, 1);
                            }}
                          >
                            {opt.nome}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <Label className="text-xs">Buscar por lote</Label>
                <Input
                  placeholder="Lote"
                  value={stockHistoryLote}
                  onChange={(e) => setStockHistoryLote(e.target.value)}
                  className="w-[160px] mt-1"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={loadingStockHistory || !stockHistoryLote.trim()}
                onClick={() => {
                  setStockHistoryPage(1);
                  fetchStockHistoryByLote(1);
                }}
              >
                Buscar por lote
              </Button>
            </div>
          </div>
          {loadingStockHistory && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          )}
          {stockHistoryData.length > 0 && (
            <>
              <div className="flex items-center justify-end gap-2">
                <Label className="text-xs text-muted-foreground">
                  Itens por página
                </Label>
                <Select
                  value={String(stockHistoryLimit)}
                  onValueChange={(v) => {
                    const n = Number(v);
                    setStockHistoryLimit(n);
                    setStockHistoryPage(1);
                    if (stockHistorySelectedItem) {
                      fetchStockHistoryByItem(stockHistorySelectedItem.id, 1);
                    } else if (stockHistoryLote.trim()) {
                      fetchStockHistoryByLote(1);
                    }
                  }}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Residente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockHistoryData.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDateToPtBr(row.data)}</TableCell>
                        <TableCell>{row.tipo}</TableCell>
                        <TableCell>{row.nome}</TableCell>
                        <TableCell>{row.quantidade}</TableCell>
                        <TableCell>{row.setor}</TableCell>
                        <TableCell>{row.lote ?? "-"}</TableCell>
                        <TableCell>{row.operador}</TableCell>
                        <TableCell>{row.residente ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={stockHistoryPage <= 1}
                  onClick={() => {
                    const next = Math.max(1, stockHistoryPage - 1);
                    setStockHistoryPage(next);
                    if (stockHistorySelectedItem) {
                      fetchStockHistoryByItem(
                        stockHistorySelectedItem.id,
                        next,
                      );
                    } else {
                      fetchStockHistoryByLote(next);
                    }
                  }}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Página {stockHistoryPage} de {stockHistoryTotalPages} • Total:{" "}
                  {stockHistoryTotal}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={stockHistoryPage >= stockHistoryTotalPages}
                  onClick={() => {
                    const next = Math.min(
                      stockHistoryTotalPages,
                      stockHistoryPage + 1,
                    );
                    setStockHistoryPage(next);
                    if (stockHistorySelectedItem) {
                      fetchStockHistoryByItem(
                        stockHistorySelectedItem.id,
                        next,
                      );
                    } else {
                      fetchStockHistoryByLote(next);
                    }
                  }}
                >
                  Próximo
                </Button>
              </div>
            </>
          )}
          {!loadingStockHistory &&
            stockHistoryData.length === 0 &&
            stockHistoryTotal === 0 &&
            (stockHistorySelectedItem || stockHistoryLote.trim()) && (
              <p className="text-muted-foreground">
                Nenhum movimento encontrado.
              </p>
            )}
        </CardContent>
      </Card>

      <AdminTabResumoMetricsDialog vm={metricsVm} />
    </>
  );
}
