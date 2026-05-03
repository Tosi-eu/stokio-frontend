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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ExecutiveSummary } from "../types";
import type { SummaryListKind } from "../hooks/useAdminSummary";
import {
  getAdminActiveUsersThisMonth,
  getAdminMovementsThisMonth,
} from "@/api/requests";
import type {
  AdminActiveUserThisMonth,
  AdminMetricsResponse,
  StockHistoryEntry,
} from "@/api/requests";
import {
  formatDateTimePtBr,
  formatDateToPtBr,
  formatValidityDate,
} from "@/helpers/dates.helper";

interface AdminTabResumoProps {
  metrics?: AdminMetricsResponse | null;
  summary: ExecutiveSummary | null;
  loadingSummary: boolean;
  expandedSummary: SummaryListKind | null;
  summaryListData: Record<string, unknown>[];
  loadingSummaryList: boolean;
  loadSummaryList: (kind: SummaryListKind) => void;
  expiringDays: 30 | 60 | 90;
  setExpiringDays: (v: 30 | 60 | 90) => void;
  expiringItems: Array<{
    nome: string;
    tipo_item: string;
    validade: string;
    dias_para_vencer: number;
    quantidade: number;
    setor: string;
    lote?: string | null;
  }>;
  expiringItemsTotal: number;
  expiringItemsPage: number;
  setExpiringItemsPage: (v: number | ((p: number) => number)) => void;
  loadingExpiringItems: boolean;
  consumptionStart: string;
  setConsumptionStart: (v: string) => void;
  consumptionEnd: string;
  setConsumptionEnd: (v: string) => void;
  consumptionByItemData: {
    items: Array<{
      nome: string;
      tipo_item: string;
      entrada: number;
      saida: number;
    }>;
    subtotal: { entrada: number; saida: number };
  };
  loadingConsumptionByItem: boolean;
  fetchConsumptionByItem: () => void;
  stockHistoryItemType: "medicamento" | "insumo";
  setStockHistoryItemType: (v: "medicamento" | "insumo") => void;
  stockHistoryItemSearch: string;
  setStockHistoryItemSearch: (v: string) => void;
  stockHistoryItemOptions: { id: number; nome: string }[];
  stockHistorySelectedItem: { id: number; nome: string } | null;
  setStockHistorySelectedItem: (v: { id: number; nome: string } | null) => void;
  loadingStockHistoryItemSearch: boolean;
  stockHistoryItemPopoverOpen: boolean;
  setStockHistoryItemPopoverOpen: (v: boolean) => void;
  stockHistoryLote: string;
  setStockHistoryLote: (v: string) => void;
  stockHistoryData: Array<{
    id: number;
    data: string;
    tipo: string;
    nome: string;
    quantidade: number;
    setor: string;
    lote?: string | null;
    operador: string;
    residente?: string | null;
  }>;
  stockHistoryTotal: number;
  loadingStockHistory: boolean;
  fetchStockHistoryByItem: (itemId: number) => void;
  fetchStockHistoryByLote: () => void;
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
}: AdminTabResumoProps) {
  const [metricsDialog, setMetricsDialog] = useState<
    null | "activeUsers" | "movements"
  >(null);
  const [metricsPage, setMetricsPage] = useState(1);
  const [metricsLimit, setMetricsLimit] = useState(25);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [summaryListPage, setSummaryListPage] = useState(1);
  const [summaryListPageSize, setSummaryListPageSize] = useState(25);

  const [activeUsersRows, setActiveUsersRows] = useState<
    AdminActiveUserThisMonth[]
  >([]);
  const [activeUsersTotal, setActiveUsersTotal] = useState(0);

  const [movementsRows, setMovementsRows] = useState<StockHistoryEntry[]>([]);
  const [movementsTotal, setMovementsTotal] = useState(0);

  const metricsTotalPages = useMemo(() => {
    const total =
      metricsDialog === "activeUsers" ? activeUsersTotal : movementsTotal;
    return Math.max(1, Math.ceil(total / metricsLimit));
  }, [activeUsersTotal, movementsTotal, metricsLimit, metricsDialog]);

  useEffect(() => {
    if (!metricsDialog) return;
    const id = setTimeout(() => setMetricsPage(1), 0);
    return () => clearTimeout(id);
  }, [metricsDialog]);

  useEffect(() => {
    const id = setTimeout(() => setSummaryListPage(1), 0);
    return () => clearTimeout(id);
  }, [expandedSummary]);

  useEffect(() => {
    if (!metricsDialog) return;
    let cancelled = false;
    const timeoutId = setTimeout(() => setMetricsLoading(true), 0);

    (metricsDialog === "activeUsers"
      ? getAdminActiveUsersThisMonth({ page: metricsPage, limit: metricsLimit })
      : getAdminMovementsThisMonth({ page: metricsPage, limit: metricsLimit })
    )
      .then((res) => {
        if (cancelled) return;
        if (metricsDialog === "activeUsers") {
          setActiveUsersRows(Array.isArray(res?.data) ? res.data : []);
          setActiveUsersTotal(Number(res?.total) || 0);
        } else {
          setMovementsRows(Array.isArray(res?.data) ? res.data : []);
          setMovementsTotal(Number(res?.total) || 0);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (metricsDialog === "activeUsers") {
          setActiveUsersRows([]);
          setActiveUsersTotal(0);
        } else {
          setMovementsRows([]);
          setMovementsTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setMetricsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [metricsDialog, metricsPage, metricsLimit]);

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
                      {consumptionByItemData.items.map((row, idx) => (
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
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Histórico por item ou lote (rastreabilidade)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Consulte movimentações por medicamento/insumo (busque pelo nome) ou
            por lote.
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
                              fetchStockHistoryByItem(opt.id);
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
                onClick={fetchStockHistoryByLote}
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
              <p className="text-sm text-muted-foreground">
                Total: {stockHistoryTotal} registro(s).
              </p>
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

      <Dialog
        open={metricsDialog != null}
        onOpenChange={(open) => {
          if (!open) setMetricsDialog(null);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {metricsDialog === "activeUsers"
                ? "Usuários ativos este mês"
                : "Movimentações este mês"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2">
            <label className="text-sm text-muted-foreground">
              Itens por página
            </label>
            <Select
              value={String(metricsLimit)}
              onValueChange={(v) => {
                setMetricsLimit(Number(v));
                setMetricsPage(1);
              }}
            >
              <SelectTrigger className="w-24">
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

          <div className="border rounded-md overflow-auto max-h-[420px]">
            {metricsLoading ? (
              <div className="flex items-center gap-2 p-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {metricsDialog === "activeUsers" ? (
                      <>
                        <TableHead>Nome</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead className="whitespace-nowrap">
                          Último acesso
                        </TableHead>
                        <TableHead className="text-right whitespace-nowrap">
                          Acessos
                        </TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="whitespace-nowrap">
                          Data
                        </TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right whitespace-nowrap">
                          Qtd
                        </TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead>Residente</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricsDialog === "activeUsers" ? (
                    activeUsersRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground"
                        >
                          Nenhum usuário ativo no mês.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeUsersRows.map((u) => {
                        const fullName = [u.first_name, u.last_name]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                        const last = u.last_login_at
                          ? formatDateTimePtBr(u.last_login_at)
                          : "-";
                        return (
                          <TableRow key={u.id}>
                            <TableCell>{fullName || u.login}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {u.login}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {last}
                            </TableCell>
                            <TableCell className="text-right">
                              {u.logins_count ?? 0}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  ) : movementsRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        Nenhuma movimentação no mês.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movementsRows.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDateToPtBr(m.data)}
                        </TableCell>
                        <TableCell>{m.tipo}</TableCell>
                        <TableCell>{m.nome}</TableCell>
                        <TableCell className="text-right">
                          {m.quantidade}
                        </TableCell>
                        <TableCell>{m.setor}</TableCell>
                        <TableCell>{m.operador}</TableCell>
                        <TableCell>{m.residente ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={metricsPage <= 1}
              onClick={() => setMetricsPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Página {metricsPage} de {metricsTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={metricsPage >= metricsTotalPages}
              onClick={() =>
                setMetricsPage((p) => Math.min(metricsTotalPages, p + 1))
              }
            >
              Próxima
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
