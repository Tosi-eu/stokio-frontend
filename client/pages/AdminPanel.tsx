import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useNavigate } from "react-router-dom";
import {
  getAdminUsers,
  getAdminInsights,
  getAdminStockHistory,
  updateAdminUser,
  deleteAdminUser,
  getReport,
  getResidents,
  getStock,
  getMedicines,
  getInputs,
  getResidentsCount,
  getCabinetsCount,
  getDrawersCount,
  getCabinets,
  getDrawers,
  getExpiringItems,
  getConsumptionByItem,
} from "@/api/requests";
import type {
  StockHistoryEntry,
  ExpiringItem,
  ConsumptionByItemRow,
} from "@/api/requests";
import type { StockListAlertItem } from "@/interfaces/interfaces";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import {
  createStockPDF,
  MovementPeriod,
  MovementsParams,
} from "@/components/StockReporter";
import {
  parseYearMonthToDate,
  formatValidityDate,
} from "@/helpers/dates.helper";
import { pdf } from "@react-pdf/renderer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Pencil,
  Trash2,
  PlusCircle,
  Edit,
  XCircle,
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Users,
  Pill,
  Package,
  Archive,
  Grid,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface AdminUser {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
}

interface AuditEvent {
  id: number;
  user_id: number | null;
  method: string;
  path: string;
  operation_type: string;
  resource: string | null;
  status_code: number;
  duration_ms: number | null;
  created_at: string;
  old_value: Record<string, unknown> | string | null;
  new_value: Record<string, unknown> | string | null;
}

interface InsightsData {
  created: number;
  updated: number;
  deleted: number;
  total: number;
  totalFiltered: number;
  events: AuditEvent[];
}

interface ExecutiveSummary {
  residents: number;
  medicines: number;
  inputs: number;
  cabinets: number;
  drawers: number;
}

interface AlertStockItem {
  nome: string;
  detalhe?: string | null;
  quantidade: number;
  minimo?: number;
  validade: string;
  setor: string;
  tipo_item: string;
}

interface ResidentOption {
  casela: number;
  name: string;
}

const AUDIT_OPERATION_LABEL: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Remoção",
};

function auditStatusLabel(code: number): string {
  if (code >= 200 && code <= 299) return "Sucesso";
  if (code >= 400 && code <= 499) return "Erro (não concluído)";
  if (code >= 500 && code <= 599) return "Erro no servidor";
  return String(code);
}
function auditValuePreview(
  raw: Record<string, unknown> | string | null | undefined,
): string {
  if (raw == null || (typeof raw === "string" && raw === "")) return "—";
  const o =
    typeof raw === "object"
      ? raw
      : (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return raw;
          }
        })();
  const one = JSON.stringify(o);
  return one.length > 60 ? one.slice(0, 57) + "…" : one;
}

type AuditDiffEntry = {
  key: string;
  oldVal: unknown;
  newVal: unknown;
  changed: boolean;
};

const FRONTEND_TO_BACKEND_KEY: Record<string, string> = {
  firstName: "first_name",
  lastName: "last_name",
  name: "nome",
  casela: "num_casela",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

function normalizeAuditKeys(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const canonical = FRONTEND_TO_BACKEND_KEY[k] ?? k;
    if (!(canonical in out)) {
      out[canonical] = v;
    }
  }
  return out;
}

function isIdKey(key: string): boolean {
  return key === "id" || key.endsWith("_id") || key.endsWith("Id");
}

function getAuditDiffEntries(
  oldVal: Record<string, unknown> | null | undefined,
  newVal: Record<string, unknown> | null | undefined,
): AuditDiffEntry[] {
  const oldObj =
    oldVal && typeof oldVal === "object" && !Array.isArray(oldVal)
      ? oldVal
      : {};
  const newObj =
    newVal && typeof newVal === "object" && !Array.isArray(newVal)
      ? newVal
      : {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  return Array.from(keys)
    .filter((key) => !isIdKey(key))
    .map((key) => {
      const a = oldObj[key];
      const b = newObj[key];
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return { key, oldVal: a, newVal: b, changed: aStr !== bStr };
    });
}

function formatDiffValue(v: unknown, key?: string): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  const str = String(v);
  if (key === "status") {
    const lower = str.toLowerCase();
    if (lower === "suspended") return "suspenso";
    if (lower === "active") return "ativo";
  }
  return str;
}

const AUDIT_FIELD_LABEL: Record<string, string> = {
  first_name: "Nome",
  last_name: "Sobrenome",
  login: "Login",
  role: "Privilégio",
  created_at: "Criado em",
  updated_at: "Atualizado em",
  num_casela: "Casela",
  nome: "Nome",
  dosagem: "Dosagem",
  principio_ativo: "Princípio ativo",
  unidade_medida: "Unidade de medida",
  estoque_minimo: "Estoque mínimo",
  descricao: "Descrição",
  numero: "Número",
  num_armario: "Número do armário",
  num_gaveta: "Número da gaveta",
  categoria_id: "ID da categoria",
  armario_id: "Armário",
  gaveta_id: "Gaveta",
  casela_id: "Casela",
  medicamento_id: "Medicamento",
  insumo_id: "Insumo",
  medicamento_nome: "Medicamento",
  insumo_nome: "Insumo",
  quantidade: "Quantidade",
  validade: "Validade",
  setor: "Setor",
  lote: "Lote",
  origem: "Origem",
  tipo: "Tipo",
  observacao: "Observação",
  dias_para_repor: "Dias para repor",
  destino: "Destino",
  status: "Status",
  preco: "Preço",
  suspended_at: "Suspenso em",
  ultima_reposicao: "Última reposição",
};

function auditFieldLabel(key: string): string {
  return AUDIT_FIELD_LABEL[key] ?? key;
}

const REPORT_OPTIONS = [
  { value: "insumos", label: "Insumos" },
  { value: "medicamentos", label: "Medicamentos" },
  { value: "residentes", label: "Residentes" },
  { value: "psicotropicos", label: "Psicotrópicos" },
  { value: "insumos_medicamentos", label: "Insumos e Medicamentos" },
  { value: "residente_consumo", label: "Consumo por Residente" },
  { value: "transferencias", label: "Transferências" },
  { value: "movimentacoes", label: "Movimentações" },
  { value: "medicamentos_residente", label: "Medicamentos por Residente" },
  { value: "medicamentos_vencidos", label: "Medicamentos Vencidos" },
  { value: "expiringSoon", label: "Próximos ao Vencimento" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [insightDays, setInsightDays] = useState(30);
  const [insightDaysInput, setInsightDaysInput] = useState("30");
  const [insightFilter, setInsightFilter] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(25);
  const [auditCompareEvent, setAuditCompareEvent] = useState<AuditEvent | null>(
    null,
  );

  const {
    data: insightsData,
    isLoading: loadingInsights,
    isError: insightsError,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: [
      "admin",
      "insights",
      insightDays,
      eventsPage,
      eventsPageSize,
      insightFilter,
    ],
    queryFn: () =>
      getAdminInsights({
        days: insightDays,
        limit: eventsPageSize,
        page: eventsPage,
        operationType: insightFilter ?? undefined,
      }),
    enabled: user?.role === "admin",
  });

  const insights = useMemo(() => {
    if (!insightsData) return null;
    return {
      created: insightsData.created ?? 0,
      updated: insightsData.updated ?? 0,
      deleted: insightsData.deleted ?? 0,
      total: insightsData.total ?? 0,
      totalFiltered: insightsData.totalFiltered ?? 0,
      events: insightsData.events ?? [],
    } as InsightsData;
  }, [insightsData]);
  const [editModal, setEditModal] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [formEdit, setFormEdit] = useState({
    firstName: "",
    lastName: "",
    login: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState<
    "residents" | "medicines" | "inputs" | "cabinets" | "drawers" | null
  >(null);
  const [summaryListData, setSummaryListData] = useState<
    Record<string, unknown>[]
  >([]);
  const [loadingSummaryList, setLoadingSummaryList] = useState(false);

  const [alerts, setAlerts] = useState<{
    noStock: AlertStockItem[];
    belowMin: AlertStockItem[];
    expired: AlertStockItem[];
    expiringSoon: AlertStockItem[];
  }>({
    noStock: [],
    belowMin: [],
    expired: [],
    expiringSoon: [],
  });
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [reportResidents, setReportResidents] = useState<ResidentOption[]>([]);
  const [selectedReportResident, setSelectedReportResident] = useState<
    number | null
  >(null);
  const [reportMovementPeriod, setReportMovementPeriod] =
    useState<MovementPeriod>(MovementPeriod.DIARIO);
  const [reportMovementDate, setReportMovementDate] = useState<Date | null>(
    null,
  );
  const [reportMovementMonth, setReportMovementMonth] = useState("");
  const [reportStartDate, setReportStartDate] = useState<Date | null>(null);
  const [reportEndDate, setReportEndDate] = useState<Date | null>(null);
  const [reportTransferDate, setReportTransferDate] = useState<Date | null>(
    null,
  );

  const [stockHistoryItemType, setStockHistoryItemType] = useState<
    "medicamento" | "insumo"
  >("medicamento");
  const [stockHistoryItemId, setStockHistoryItemId] = useState("");
  const [stockHistoryLote, setStockHistoryLote] = useState("");
  const [stockHistoryData, setStockHistoryData] = useState<StockHistoryEntry[]>(
    [],
  );
  const [stockHistoryTotal, setStockHistoryTotal] = useState(0);
  const [stockHistoryPage, setStockHistoryPage] = useState(1);
  const [loadingStockHistory, setLoadingStockHistory] = useState(false);
  const [expiringDays, setExpiringDays] = useState<30 | 60 | 90>(30);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [expiringItemsTotal, setExpiringItemsTotal] = useState(0);
  const [expiringItemsPage, setExpiringItemsPage] = useState(1);
  const [loadingExpiringItems, setLoadingExpiringItems] = useState(false);
  const [consumptionStart, setConsumptionStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [consumptionEnd, setConsumptionEnd] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [consumptionByItemData, setConsumptionByItemData] = useState<{
    items: ConsumptionByItemRow[];
    subtotal: { entrada: number; saida: number };
  }>({ items: [], subtotal: { entrada: 0, saida: 0 } });
  const [loadingConsumptionByItem, setLoadingConsumptionByItem] =
    useState(false);
  const [reportTransferPeriod, setReportTransferPeriod] =
    useState<MovementPeriod>(MovementPeriod.DIARIO);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [reportPreviewLoading, setReportPreviewLoading] = useState(false);
  const [loadingReportResidents, setLoadingReportResidents] = useState(false);
  const [reportResidentSearch, setReportResidentSearch] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    loadUsers();
  }, [user?.role, navigate]);

  useEffect(() => {
    if (user?.role === "admin") {
      loadSummary();
      loadAlerts();
    }
  }, [user?.role]);

  useEffect(() => {
    let cancelled = false;
    setLoadingExpiringItems(true);
    getExpiringItems(expiringDays, expiringItemsPage, 10)
      .then((res) => {
        if (!cancelled) {
          setExpiringItems(res.data);
          setExpiringItemsTotal(res.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExpiringItems([]);
          setExpiringItemsTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingExpiringItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expiringDays, expiringItemsPage]);

  function fetchConsumptionByItem() {
    setLoadingConsumptionByItem(true);
    getConsumptionByItem(consumptionStart, consumptionEnd)
      .then(setConsumptionByItemData)
      .catch(() =>
        setConsumptionByItemData({
          items: [],
          subtotal: { entrada: 0, saida: 0 },
        }),
      )
      .finally(() => setLoadingConsumptionByItem(false));
  }

  useEffect(() => {
    if (user?.role === "admin") fetchConsumptionByItem();
  }, [user?.role]);

  async function loadSummary() {
    setLoadingSummary(true);
    try {
      const [medRes, inpRes, residentsRes, cabinetsRes, drawersRes] =
        await Promise.all([
          getMedicines(1, 1).then((r: { total?: number }) => r.total ?? 0),
          getInputs(1, 1).then((r: { total?: number }) => r.total ?? 0),
          getResidentsCount().then((r: { count?: number }) => r.count ?? 0),
          getCabinetsCount().then((r: { count?: number }) => r.count ?? 0),
          getDrawersCount().then((r: { count?: number }) => r.count ?? 0),
        ]);
      setSummary({
        residents: residentsRes,
        medicines: medRes,
        inputs: inpRes,
        cabinets: cabinetsRes,
        drawers: drawersRes,
      });
    } catch (err) {
      toast({
        title: "Erro ao carregar resumo",
        variant: "error",
      });
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadSummaryList(
    kind: "residents" | "medicines" | "inputs" | "cabinets" | "drawers",
  ) {
    if (expandedSummary === kind) {
      setExpandedSummary(null);
      return;
    }
    setExpandedSummary(kind);
    setLoadingSummaryList(true);
    setSummaryListData([]);
    try {
      const limit = 500;
      const toList = (
        r: { data?: unknown[]; hasNext?: boolean; total?: number },
        page: number,
      ): { data: Record<string, unknown>[]; hasNext: boolean } => ({
        data: (r.data ?? []) as Record<string, unknown>[],
        hasNext: r.hasNext ?? (r.total != null && page * limit < r.total),
      });
      let list: Record<string, unknown>[];
      if (kind === "residents") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) =>
            getResidents(p, l).then((r) => ({
              data: (r.data ?? []) as Record<string, unknown>[],
              hasNext: r.hasNext ?? false,
            })),
          limit,
        );
      } else if (kind === "medicines") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getMedicines(p, l).then((r) => toList(r, p)),
          limit,
        );
      } else if (kind === "inputs") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getInputs(p, l).then((r) => toList(r, p)),
          limit,
        );
      } else if (kind === "cabinets") {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getCabinets(p, l).then((r) => toList(r, p)),
          limit,
        );
      } else {
        list = await fetchAllPaginated<Record<string, unknown>>(
          (p, l) => getDrawers(p, l).then((r) => toList(r, p)),
          limit,
        );
      }
      setSummaryListData(Array.isArray(list) ? list : []);
    } catch (err) {
      toast({
        title: "Erro ao carregar lista",
        variant: "error",
      });
      setSummaryListData([]);
    } finally {
      setLoadingSummaryList(false);
    }
  }

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const stockList = await fetchAllPaginated<StockListAlertItem>(
        (page, limit) =>
          getStock(page, limit).then((res) => ({
            data: Array.isArray(res?.data)
              ? (res.data as StockListAlertItem[])
              : [],
            hasNext: Boolean(res?.hasNext),
          })),
      );
      const noStock = stockList
        .filter((i) => i.st_quantidade === "critical")
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) ?? 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      const belowMin = stockList
        .filter((i) => i.st_quantidade === "low")
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) ?? 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      const expired = stockList
        .filter((i) => i.st_expiracao === "expired" && (i.quantidade ?? 0) > 0)
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) ?? 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      const expiringSoon = stockList
        .filter(
          (i) =>
            i.st_expiracao === "warning" ||
            (i.st_expiracao === "critical" && (i.quantidade ?? 0) > 0),
        )
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) ?? 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      setAlerts({ noStock, belowMin, expired, expiringSoon });
    } catch (err) {
      toast({
        title: "Erro ao carregar alertas",
        variant: "error",
      });
      setAlerts({
        noStock: [],
        belowMin: [],
        expired: [],
        expiringSoon: [],
      });
    } finally {
      setLoadingAlerts(false);
    }
  }

  useEffect(() => {
    if (
      selectedReportType === "residente_consumo" ||
      selectedReportType === "medicamentos_residente"
    ) {
      loadReportResidents();
    }
  }, [selectedReportType]);

  async function loadReportResidents() {
    setLoadingReportResidents(true);
    try {
      const list = await fetchAllPaginated<ResidentOption>(getResidents);
      setReportResidents(list);
    } catch {
      setReportResidents([]);
    } finally {
      setLoadingReportResidents(false);
    }
  }

  async function handleGenerateReport() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    const tipo = selectedReportType;
    setReportStatus("loading");
    try {
      let response: unknown;
      if (tipo === "movimentacoes") {
        let params: MovementsParams;
        if (reportMovementPeriod === MovementPeriod.DIARIO) {
          if (!reportMovementDate) {
            toast({ title: "Selecione a data", variant: "error" });
            setReportStatus("idle");
            return;
          }
          params = {
            periodo: MovementPeriod.DIARIO,
            data: reportMovementDate.toISOString().split("T")[0],
          };
        } else if (reportMovementPeriod === MovementPeriod.MENSAL) {
          if (!reportMovementMonth) {
            toast({ title: "Selecione o mês", variant: "error" });
            setReportStatus("idle");
            return;
          }
          params = { periodo: MovementPeriod.MENSAL, mes: reportMovementMonth };
        } else {
          if (!reportStartDate || !reportEndDate) {
            toast({
              title: "Selecione o intervalo de datas",
              variant: "error",
            });
            setReportStatus("idle");
            return;
          }
          params = {
            periodo: MovementPeriod.INTERVALO,
            data_inicial: reportStartDate.toISOString().split("T")[0],
            data_final: reportEndDate.toISOString().split("T")[0],
          };
        }
        response = await getReport("movimentacoes", undefined, params);
      } else if (tipo === "transferencias") {
        let params: MovementsParams;
        if (reportTransferPeriod === MovementPeriod.DIARIO) {
          if (!reportTransferDate) {
            toast({
              title: "Selecione a data da transferência",
              variant: "error",
            });
            setReportStatus("idle");
            return;
          }
          params = {
            periodo: MovementPeriod.DIARIO,
            data: reportTransferDate.toISOString().split("T")[0],
          };
        } else {
          if (!reportStartDate || !reportEndDate) {
            toast({
              title: "Selecione o intervalo de datas",
              variant: "error",
            });
            setReportStatus("idle");
            return;
          }
          params = {
            periodo: MovementPeriod.INTERVALO,
            data_inicial: reportStartDate.toISOString().split("T")[0],
            data_final: reportEndDate.toISOString().split("T")[0],
          };
        }
        response = await getReport("transferencias", undefined, params);
      } else {
        const casela =
          tipo === "residente_consumo" || tipo === "medicamentos_residente"
            ? (selectedReportResident ?? undefined)
            : undefined;
        response = await getReport(tipo, casela);
      }
      const doc = createStockPDF(
        tipo,
        response as Parameters<typeof createStockPDF>[1],
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${tipo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setReportStatus("success");
      toast({ title: "Relatório gerado", variant: "success" });
    } catch (e) {
      console.error(e);
      setReportStatus("error");
      toast({ title: "Erro ao gerar relatório", variant: "error" });
    }
  }

  async function handlePreviewReport() {
    if (!selectedReportType) {
      toast({ title: "Selecione um tipo de relatório", variant: "error" });
      return;
    }
    const tipo = selectedReportType;
    setReportPreviewLoading(true);
    try {
      let response: unknown;
      if (tipo === "movimentacoes") {
        let params: MovementsParams;
        if (reportMovementPeriod === MovementPeriod.DIARIO) {
          if (!reportMovementDate) {
            toast({ title: "Selecione a data", variant: "error" });
            setReportPreviewLoading(false);
            return;
          }
          params = {
            periodo: MovementPeriod.DIARIO,
            data: reportMovementDate.toISOString().split("T")[0],
          };
        } else if (reportMovementPeriod === MovementPeriod.MENSAL) {
          if (!reportMovementMonth) {
            toast({ title: "Selecione o mês", variant: "error" });
            setReportPreviewLoading(false);
            return;
          }
          params = { periodo: MovementPeriod.MENSAL, mes: reportMovementMonth };
        } else {
          if (!reportStartDate || !reportEndDate) {
            toast({
              title: "Selecione o intervalo de datas",
              variant: "error",
            });
            setReportPreviewLoading(false);
            return;
          }
          params = {
            periodo: MovementPeriod.INTERVALO,
            data_inicial: reportStartDate.toISOString().split("T")[0],
            data_final: reportEndDate.toISOString().split("T")[0],
          };
        }
        response = await getReport("movimentacoes", undefined, params);
      } else if (tipo === "transferencias") {
        let params: MovementsParams;
        if (reportTransferPeriod === MovementPeriod.DIARIO) {
          if (!reportTransferDate) {
            toast({
              title: "Selecione a data da transferência",
              variant: "error",
            });
            setReportPreviewLoading(false);
            return;
          }
          params = {
            periodo: MovementPeriod.DIARIO,
            data: reportTransferDate.toISOString().split("T")[0],
          };
        } else {
          if (!reportStartDate || !reportEndDate) {
            toast({
              title: "Selecione o intervalo de datas",
              variant: "error",
            });
            setReportPreviewLoading(false);
            return;
          }
          params = {
            periodo: MovementPeriod.INTERVALO,
            data_inicial: reportStartDate.toISOString().split("T")[0],
            data_final: reportEndDate.toISOString().split("T")[0],
          };
        }
        response = await getReport("transferencias", undefined, params);
      } else {
        const casela =
          tipo === "residente_consumo" || tipo === "medicamentos_residente"
            ? (selectedReportResident ?? undefined)
            : undefined;
        response = await getReport(tipo, casela);
      }
      const doc = createStockPDF(
        tipo,
        response as Parameters<typeof createStockPDF>[1],
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      if (reportPreviewUrl) URL.revokeObjectURL(reportPreviewUrl);
      setReportPreviewUrl(url);
      toast({ title: "Pré-visualização carregada abaixo", variant: "success" });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao gerar pré-visualização", variant: "error" });
    } finally {
      setReportPreviewLoading(false);
    }
  }

  const showReportResidentSelector =
    selectedReportType === "residente_consumo" ||
    selectedReportType === "medicamentos_residente";
  const showReportMovementFilters = selectedReportType === "movimentacoes";
  const showReportTransferFilters = selectedReportType === "transferencias";
  const filteredReportResidents = useMemo(
    () =>
      reportResidents.filter((r) => {
        if (!reportResidentSearch.trim()) return true;
        return r.casela.toString().startsWith(reportResidentSearch.trim());
      }),
    [reportResidents, reportResidentSearch],
  );

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Erro ao carregar usuários",
        variant: "error",
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (insightsError) {
      toast({ title: "Erro ao carregar insights", variant: "error" });
    }
  }, [insightsError]);

  const applyInsightDays = () => {
    const n = Math.min(365, Math.max(1, Number(insightDaysInput) || 30));
    setInsightDaysInput(String(n));
    setInsightDays(n);
    setEventsPage(1);
  };

  const goToPage = (page: number) => {
    setEventsPage(Math.max(1, page));
  };

  const totalFiltered = insights?.totalFiltered ?? 0;
  const { totalPages, from, to } = useMemo(() => {
    const total = insights?.totalFiltered ?? 0;
    const pages = Math.max(1, Math.ceil(total / eventsPageSize));
    const fromVal = total === 0 ? 0 : (eventsPage - 1) * eventsPageSize + 1;
    const toVal = Math.min(eventsPage * eventsPageSize, total);
    return { totalPages: pages, from: fromVal, to: toVal };
  }, [insights?.totalFiltered, eventsPage, eventsPageSize]);

  const openEdit = (u: AdminUser) => {
    setEditModal(u);
    setFormEdit({
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      login: u.login,
      password: "",
      role: u.role,
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await updateAdminUser(editModal.id, {
        firstName: formEdit.firstName,
        lastName: formEdit.lastName,
        login: formEdit.login,
        ...(formEdit.password ? { password: formEdit.password } : {}),
        role: formEdit.role,
      });
      toast({ title: "Usuário atualizado", variant: "success" });
      setEditModal(null);
      loadUsers();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao atualizar",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      toast({ title: "Usuário removido", variant: "success" });
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao remover",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <Layout title="Painel administrativo">
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid grid-cols-6 gap-1 w-full p-1">
          <TabsTrigger
            value="resumo"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="truncate">Resumo executivo</span>
          </TabsTrigger>
          <TabsTrigger
            value="alertas"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">Alertas</span>
          </TabsTrigger>
          <TabsTrigger
            value="relatorios"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">Usuários</span>
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Edit className="h-4 w-4 shrink-0" />
            <span className="truncate">Auditoria</span>
          </TabsTrigger>
          <TabsTrigger
            value="stock-history"
            className="gap-1.5 min-w-0 text-xs sm:text-sm"
          >
            <Archive className="h-4 w-4 shrink-0" />
            <span className="truncate">Histórico estoque</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card
                      className={`bg-slate-50 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "residents" ? "ring-2 ring-sky-500" : ""}`}
                      onClick={() => loadSummaryList("residents")}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-8 w-8 text-sky-600" />
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
                      className={`bg-slate-50 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "medicines" ? "ring-2 ring-emerald-500" : ""}`}
                      onClick={() => loadSummaryList("medicines")}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Pill className="h-8 w-8 text-emerald-600" />
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
                      className={`bg-slate-50 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "inputs" ? "ring-2 ring-amber-500" : ""}`}
                      onClick={() => loadSummaryList("inputs")}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-8 w-8 text-amber-600" />
                          <div>
                            <p className="text-2xl font-bold">
                              {summary.inputs}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Insumos
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Clique para listar
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className={`bg-slate-50 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "cabinets" ? "ring-2 ring-violet-500" : ""}`}
                      onClick={() => loadSummaryList("cabinets")}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Archive className="h-8 w-8 text-violet-600" />
                          <div>
                            <p className="text-2xl font-bold">
                              {summary.cabinets}
                            </p>
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
                      className={`bg-slate-50 cursor-pointer transition-all hover:shadow-md ${expandedSummary === "drawers" ? "ring-2 ring-rose-500" : ""}`}
                      onClick={() => loadSummaryList("drawers")}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Grid className="h-8 w-8 text-rose-600" />
                          <div>
                            <p className="text-2xl font-bold">
                              {summary.drawers}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Gavetas
                            </p>
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
                        {expandedSummary === "residents" &&
                          "Lista de residentes"}
                        {expandedSummary === "medicines" &&
                          "Lista de medicamentos"}
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
                              summaryListData.map(
                                (row: Record<string, unknown>, idx: number) => (
                                  <TableRow key={idx}>
                                    {expandedSummary === "residents" && (
                                      <>
                                        <TableCell>
                                          {String(row.casela ?? "-")}
                                        </TableCell>
                                        <TableCell>
                                          {String(row.nome ?? "-")}
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
                              <TableCell>{row.validade}</TableCell>
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
                Quantidade de entradas e saídas por medicamento/insumo no
                intervalo de datas.
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
        </TabsContent>

        <TabsContent value="alertas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas consolidados de estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingAlerts ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando alertas...
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span className="text-red-600">Sem estoque</span>
                      <span className="text-muted-foreground">
                        ({alerts.noStock.length})
                      </span>
                    </h3>
                    <div className="border rounded-md overflow-auto max-h-48">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Detalhe</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Mín.</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Setor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {alerts.noStock.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-muted-foreground"
                              >
                                Nenhum
                              </TableCell>
                            </TableRow>
                          ) : (
                            alerts.noStock.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.nome}</TableCell>
                                <TableCell>{row.detalhe ?? "-"}</TableCell>
                                <TableCell>{row.quantidade}</TableCell>
                                <TableCell>{row.minimo ?? "-"}</TableCell>
                                <TableCell>{row.validade}</TableCell>
                                <TableCell>{row.setor}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span className="text-amber-600">Abaixo do mínimo</span>
                      <span className="text-muted-foreground">
                        ({alerts.belowMin.length})
                      </span>
                    </h3>
                    <div className="border rounded-md overflow-auto max-h-48">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Detalhe</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Mín.</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Setor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {alerts.belowMin.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-muted-foreground"
                              >
                                Nenhum
                              </TableCell>
                            </TableRow>
                          ) : (
                            alerts.belowMin.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.nome}</TableCell>
                                <TableCell>{row.detalhe ?? "-"}</TableCell>
                                <TableCell>{row.quantidade}</TableCell>
                                <TableCell>{row.minimo ?? "-"}</TableCell>
                                <TableCell>{row.validade}</TableCell>
                                <TableCell>{row.setor}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span className="text-red-700">Vencidos</span>
                      <span className="text-muted-foreground">
                        ({alerts.expired.length})
                      </span>
                    </h3>
                    <div className="border rounded-md overflow-auto max-h-48">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Detalhe</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Mín.</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Setor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {alerts.expired.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-muted-foreground"
                              >
                                Nenhum
                              </TableCell>
                            </TableRow>
                          ) : (
                            alerts.expired.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.nome}</TableCell>
                                <TableCell>{row.detalhe ?? "-"}</TableCell>
                                <TableCell>{row.quantidade}</TableCell>
                                <TableCell>{row.minimo ?? "-"}</TableCell>
                                <TableCell>{row.validade}</TableCell>
                                <TableCell>{row.setor}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <span className="text-orange-600">
                        Próximos ao vencimento
                      </span>
                      <span className="text-muted-foreground">
                        ({alerts.expiringSoon.length})
                      </span>
                    </h3>
                    <div className="border rounded-md overflow-auto max-h-48">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Detalhe</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Mín.</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Setor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {alerts.expiringSoon.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-muted-foreground"
                              >
                                Nenhum
                              </TableCell>
                            </TableRow>
                          ) : (
                            alerts.expiringSoon.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{row.nome}</TableCell>
                                <TableCell>{row.detalhe ?? "-"}</TableCell>
                                <TableCell>{row.quantidade}</TableCell>
                                <TableCell>{row.minimo ?? "-"}</TableCell>
                                <TableCell>{row.validade}</TableCell>
                                <TableCell>{row.setor}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Geração de relatórios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Tipo de relatório</Label>
                <Select
                  value={selectedReportType}
                  onValueChange={(v) => {
                    setSelectedReportType(v);
                    if (
                      v !== "residente_consumo" &&
                      v !== "medicamentos_residente"
                    ) {
                      setSelectedReportResident(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Selecione um relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showReportResidentSelector && (
                <div className="grid gap-2">
                  <Label>Residente</Label>
                  {loadingReportResidents ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full max-w-md justify-between"
                        >
                          {selectedReportResident != null
                            ? `Casela ${selectedReportResident} - ${
                                reportResidents.find(
                                  (r) => r.casela === selectedReportResident,
                                )?.name ?? ""
                              }`
                            : "Selecione o residente"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Buscar por casela..."
                            value={reportResidentSearch}
                            onValueChange={setReportResidentSearch}
                          />
                          <CommandEmpty>
                            Nenhum residente encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredReportResidents.map((r) => (
                              <CommandItem
                                key={r.casela}
                                onSelect={() => {
                                  setSelectedReportResident(r.casela);
                                }}
                              >
                                Casela {r.casela} - {r.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

              {showReportMovementFilters && (
                <div className="grid gap-2 p-3 border rounded-lg max-w-md">
                  <Label>Período (movimentações)</Label>
                  <Select
                    value={reportMovementPeriod}
                    onValueChange={(v: MovementPeriod) =>
                      setReportMovementPeriod(v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MovementPeriod.DIARIO}>
                        Diário
                      </SelectItem>
                      <SelectItem value={MovementPeriod.MENSAL}>
                        Mensal
                      </SelectItem>
                      <SelectItem value={MovementPeriod.INTERVALO}>
                        Intervalo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {reportMovementPeriod === MovementPeriod.DIARIO && (
                    <div>
                      <Label className="text-xs">Data</Label>
                      <DatePicker
                        selected={reportMovementDate}
                        onChange={(d: Date | null) => setReportMovementDate(d)}
                        dateFormat="dd/MM/yyyy"
                        locale="pt-BR"
                        className="w-full border rounded px-2 py-1.5"
                      />
                    </div>
                  )}
                  {reportMovementPeriod === MovementPeriod.MENSAL && (
                    <div>
                      <Label className="text-xs">Mês</Label>
                      <DatePicker
                        selected={
                          reportMovementMonth
                            ? parseYearMonthToDate(reportMovementMonth)
                            : null
                        }
                        onChange={(d: Date | null) => {
                          if (!d) setReportMovementMonth("");
                          else {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, "0");
                            setReportMovementMonth(`${y}-${m}`);
                          }
                        }}
                        dateFormat="MM/yyyy"
                        showMonthYearPicker
                        locale="pt-BR"
                        placeholderText="Selecione o mês"
                        className="w-full border rounded px-2 py-1.5"
                      />
                    </div>
                  )}
                  {reportMovementPeriod === MovementPeriod.INTERVALO && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Data inicial</Label>
                        <DatePicker
                          selected={reportStartDate}
                          onChange={(d: Date | null) => setReportStartDate(d)}
                          dateFormat="dd/MM/yyyy"
                          locale="pt-BR"
                          className="w-full border rounded px-2 py-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Data final</Label>
                        <DatePicker
                          selected={reportEndDate}
                          onChange={(d: Date | null) => setReportEndDate(d)}
                          dateFormat="dd/MM/yyyy"
                          locale="pt-BR"
                          className="w-full border rounded px-2 py-1.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showReportTransferFilters && (
                <div className="grid gap-2 p-3 border rounded-lg max-w-md">
                  <Label>Período (transferências)</Label>
                  <Select
                    value={reportTransferPeriod}
                    onValueChange={(v: MovementPeriod) =>
                      setReportTransferPeriod(v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MovementPeriod.DIARIO}>
                        Diário
                      </SelectItem>
                      <SelectItem value={MovementPeriod.INTERVALO}>
                        Intervalo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {reportTransferPeriod === MovementPeriod.DIARIO && (
                    <div>
                      <Label className="text-xs">Data</Label>
                      <DatePicker
                        selected={reportTransferDate}
                        onChange={(d: Date | null) => setReportTransferDate(d)}
                        dateFormat="dd/MM/yyyy"
                        locale="pt-BR"
                        className="w-full border rounded px-2 py-1.5"
                      />
                    </div>
                  )}
                  {reportTransferPeriod === MovementPeriod.INTERVALO && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Data inicial</Label>
                        <DatePicker
                          selected={reportStartDate}
                          onChange={(d: Date | null) => setReportStartDate(d)}
                          dateFormat="dd/MM/yyyy"
                          locale="pt-BR"
                          className="w-full border rounded px-2 py-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Data final</Label>
                        <DatePicker
                          selected={reportEndDate}
                          onChange={(d: Date | null) => setReportEndDate(d)}
                          dateFormat="dd/MM/yyyy"
                          locale="pt-BR"
                          className="w-full border rounded px-2 py-1.5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleGenerateReport}
                  disabled={
                    !selectedReportType ||
                    reportStatus === "loading" ||
                    (showReportResidentSelector &&
                      selectedReportResident == null)
                  }
                >
                  {reportStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>Gerar e baixar PDF</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePreviewReport}
                  disabled={
                    !selectedReportType ||
                    reportPreviewLoading ||
                    reportStatus === "loading" ||
                    (showReportResidentSelector &&
                      selectedReportResident == null)
                  }
                >
                  {reportPreviewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>Pré-visualizar</>
                  )}
                </Button>
              </div>

              {reportPreviewUrl && (
                <div className="mt-6 space-y-2 border rounded-lg bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Pré-visualização do relatório
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        URL.revokeObjectURL(reportPreviewUrl);
                        setReportPreviewUrl(null);
                      }}
                    >
                      Fechar pré-visualização
                    </Button>
                  </div>
                  <div className="rounded-md border bg-white overflow-hidden min-h-[500px]">
                    <object
                      data={reportPreviewUrl}
                      type="application/pdf"
                      className="w-full min-h-[500px] h-[70vh]"
                      title="Pré-visualização do relatório"
                    >
                      <p className="p-4 text-sm text-muted-foreground">
                        Se o PDF não aparecer aqui,{" "}
                        <button
                          type="button"
                          className="text-primary underline hover:no-underline"
                          onClick={() =>
                            window.open(reportPreviewUrl, "_blank")
                          }
                        >
                          abra em nova aba
                        </button>
                        .
                      </p>
                    </object>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do sistema</CardTitle>
              <p className="text-sm text-muted-foreground">
                O administrador pode editar e remover usuários. A criação de
                novos usuários é feita pelo fluxo de cadastro do sistema.
              </p>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Login</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sobrenome</TableHead>
                      <TableHead>Privilégio</TableHead>
                      <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.login}</TableCell>
                        <TableCell>{u.firstName ?? "-"}</TableCell>
                        <TableCell>{u.lastName ?? "-"}</TableCell>
                        <TableCell>
                          <span
                            className={
                              u.role === "admin"
                                ? "text-amber-600 font-medium"
                                : ""
                            }
                          >
                            {u.role === "admin" ? "Administrador" : "Usuário"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(u)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(u)}
                              disabled={u.id === user?.id}
                              aria-label="Remover"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <CardTitle>Auditoria e insights</CardTitle>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="insight-days"
                  className="text-sm whitespace-nowrap"
                >
                  Últimos
                </Label>
                <Input
                  id="insight-days"
                  type="number"
                  min={1}
                  max={365}
                  className="w-20"
                  value={insightDaysInput}
                  onChange={(e) => setInsightDaysInput(e.target.value)}
                  onBlur={applyInsightDays}
                  onKeyDown={(e) => e.key === "Enter" && applyInsightDays()}
                />
                <Label
                  htmlFor="insight-days"
                  className="text-sm whitespace-nowrap"
                >
                  dias
                </Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={applyInsightDays}
                >
                  Aplicar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInsights ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : insights ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        insightFilter === "create"
                          ? "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20"
                          : ""
                      }`}
                      onClick={() => {
                        setInsightFilter((f) =>
                          f === "create" ? null : "create",
                        );
                        setEventsPage(1);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <PlusCircle className="h-4 w-4 text-green-600" />
                          Criados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{insights.created}</p>
                        <p className="text-xs text-muted-foreground">
                          operações de criação • clique para filtrar
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        insightFilter === "update"
                          ? "ring-2 ring-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                          : ""
                      }`}
                      onClick={() => {
                        setInsightFilter((f) =>
                          f === "update" ? null : "update",
                        );
                        setEventsPage(1);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Edit className="h-4 w-4 text-sky-600" />
                          Editados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{insights.updated}</p>
                        <p className="text-xs text-muted-foreground">
                          operações de edição • clique para filtrar
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        insightFilter === "delete"
                          ? "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20"
                          : ""
                      }`}
                      onClick={() => {
                        setInsightFilter((f) =>
                          f === "delete" ? null : "delete",
                        );
                        setEventsPage(1);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Removidos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{insights.deleted}</p>
                        <p className="text-xs text-muted-foreground">
                          operações de remoção • clique para filtrar
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <p className="text-sm text-muted-foreground">
                      {insightFilter ? (
                        <>
                          Exibindo apenas{" "}
                          {insightFilter === "create"
                            ? "criações"
                            : insightFilter === "update"
                              ? "edições"
                              : "remoções"}
                          . Total no período: {insights.total} operações.{" "}
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-sm"
                            onClick={() => {
                              setInsightFilter(null);
                              setEventsPage(1);
                            }}
                          >
                            Ver todos
                          </Button>
                        </>
                      ) : (
                        <>Total no período: {insights.total} operações</>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="page-size"
                        className="text-sm whitespace-nowrap"
                      >
                        Por página
                      </Label>
                      <Select
                        value={String(eventsPageSize)}
                        onValueChange={(v) => {
                          setEventsPageSize(Number(v));
                          setEventsPage(1);
                        }}
                      >
                        <SelectTrigger id="page-size" className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="border rounded-md overflow-auto max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead className="min-w-[140px]">Antes</TableHead>
                          <TableHead className="min-w-[140px]">
                            Depois
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.events.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                            >
                              Nenhum evento neste filtro.
                            </TableCell>
                          </TableRow>
                        ) : (
                          insights.events.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {new Date(e.created_at).toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell>
                                {AUDIT_OPERATION_LABEL[e.operation_type] ??
                                  e.operation_type}
                              </TableCell>
                              <TableCell>
                                {auditStatusLabel(e.status_code)}
                              </TableCell>
                              <TableCell
                                className="text-xs min-w-[200px] max-w-[360px] font-mono truncate align-top cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30"
                                title="Clique para ver comparação (Antes e Depois)"
                                onClick={() => setAuditCompareEvent(e)}
                              >
                                {auditValuePreview(e.old_value)}
                              </TableCell>
                              <TableCell
                                className="text-xs min-w-[200px] max-w-[360px] font-mono truncate align-top cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30"
                                title="Clique para ver comparação (Antes e Depois)"
                                onClick={() => setAuditCompareEvent(e)}
                              >
                                {auditValuePreview(e.new_value)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {totalFiltered > 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 mt-3">
                      <p className="text-sm text-muted-foreground">
                        {from}–{to} de {totalFiltered} eventos
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(eventsPage - 1)}
                          disabled={eventsPage <= 1 || loadingInsights}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm px-2">
                          Página {eventsPage} de {totalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => goToPage(eventsPage + 1)}
                          disabled={eventsPage >= totalPages || loadingInsights}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Nenhum dado de auditoria no período.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Histórico por item ou lote (rastreabilidade)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Consulte movimentações por medicamento/insumo (ID) ou por lote.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <Label className="text-xs">Buscar por item</Label>
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={stockHistoryItemType}
                      onValueChange={(v) =>
                        setStockHistoryItemType(v as "medicamento" | "insumo")
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medicamento">Medicamento</SelectItem>
                        <SelectItem value="insumo">Insumo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="ID do item"
                      value={stockHistoryItemId}
                      onChange={(e) => setStockHistoryItemId(e.target.value)}
                      className="w-[100px]"
                      min={1}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        loadingStockHistory || !stockHistoryItemId.trim()
                      }
                      onClick={async () => {
                        const id = Number(stockHistoryItemId.trim());
                        if (Number.isNaN(id) || id < 1) return;
                        setLoadingStockHistory(true);
                        setStockHistoryPage(1);
                        try {
                          const res = await getAdminStockHistory({
                            itemType: stockHistoryItemType,
                            itemId: id,
                            page: 1,
                            limit: 25,
                          });
                          setStockHistoryData(res.data);
                          setStockHistoryTotal(res.total);
                        } catch {
                          setStockHistoryData([]);
                          setStockHistoryTotal(0);
                        } finally {
                          setLoadingStockHistory(false);
                        }
                      }}
                    >
                      Buscar por item
                    </Button>
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
                    onClick={async () => {
                      setLoadingStockHistory(true);
                      setStockHistoryPage(1);
                      try {
                        const res = await getAdminStockHistory({
                          lote: stockHistoryLote.trim(),
                          page: 1,
                          limit: 25,
                        });
                        setStockHistoryData(res.data);
                        setStockHistoryTotal(res.total);
                      } catch {
                        setStockHistoryData([]);
                        setStockHistoryTotal(0);
                      } finally {
                        setLoadingStockHistory(false);
                      }
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
                            <TableCell>{row.data}</TableCell>
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
                (stockHistoryItemId.trim() || stockHistoryLote.trim()) && (
                  <p className="text-muted-foreground">
                    Nenhum movimento encontrado.
                  </p>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!auditCompareEvent}
        onOpenChange={() => setAuditCompareEvent(null)}
      >
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-sky-600" />
              Comparação: Antes e Depois
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0 border rounded-md">
            {auditCompareEvent &&
              (() => {
                const oldRaw = auditCompareEvent.old_value;
                const newRaw = auditCompareEvent.new_value;
                const parseObj = (
                  v: Record<string, unknown> | string | null | undefined,
                ): Record<string, unknown> => {
                  if (v == null || (typeof v === "string" && v === ""))
                    return {};
                  const o =
                    typeof v === "object" && !Array.isArray(v)
                      ? v
                      : typeof v === "string"
                        ? (() => {
                            try {
                              return JSON.parse(v) as Record<string, unknown>;
                            } catch {
                              return {};
                            }
                          })()
                        : {};
                  return o && typeof o === "object" && !Array.isArray(o)
                    ? o
                    : {};
                };
                let oldObj = normalizeAuditKeys(
                  parseObj(oldRaw as Record<string, unknown> | string | null),
                );
                let newObj = parseObj(
                  newRaw as Record<string, unknown> | string | null,
                );
                if (
                  newObj &&
                  typeof newObj.data === "object" &&
                  newObj.data !== null &&
                  !Array.isArray(newObj.data)
                ) {
                  const d = newObj.data as Record<string, unknown>;
                  newObj =
                    d.source != null && typeof d.source === "object"
                      ? (d.source as Record<string, unknown>)
                      : d;
                }
                newObj = normalizeAuditKeys(newObj);
                const entries = getAuditDiffEntries(oldObj, newObj);
                if (entries.length === 0) {
                  return (
                    <p className="p-4 text-muted-foreground text-sm">
                      Nenhum dado para comparar (ambos vazios ou não
                      disponíveis).
                    </p>
                  );
                }
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Campo</TableHead>
                        <TableHead className="min-w-[280px] bg-slate-50 dark:bg-slate-900/50">
                          Antes
                        </TableHead>
                        <TableHead className="min-w-[280px] bg-slate-50 dark:bg-slate-900/50">
                          Depois
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map(({ key, oldVal, newVal, changed }) => (
                        <TableRow
                          key={key}
                          className={
                            changed
                              ? "bg-sky-50 dark:bg-sky-950/30 border-l-4 border-l-sky-500"
                              : ""
                          }
                        >
                          <TableCell
                            className="font-medium text-xs"
                            title={key}
                          >
                            {auditFieldLabel(key)}
                          </TableCell>
                          <TableCell className="text-xs font-mono break-all min-w-[260px] max-w-[400px] bg-slate-50/50 dark:bg-slate-900/30">
                            {formatDiffValue(oldVal, key)}
                          </TableCell>
                          <TableCell className="text-xs font-mono break-all min-w-[260px] max-w-[400px] bg-slate-50/50 dark:bg-slate-900/30">
                            {formatDiffValue(newVal, key)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAuditCompareEvent(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Login</Label>
              <Input
                value={formEdit.login}
                onChange={(e) =>
                  setFormEdit((p) => ({ ...p, login: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input
                  value={formEdit.firstName}
                  onChange={(e) =>
                    setFormEdit((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Sobrenome</Label>
                <Input
                  value={formEdit.lastName}
                  onChange={(e) =>
                    setFormEdit((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nova senha (deixe em branco para manter)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formEdit.password}
                onChange={(e) =>
                  setFormEdit((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Privilégio</Label>
              <Select
                value={formEdit.role}
                onValueChange={(v: "admin" | "user") =>
                  setFormEdit((p) => ({ ...p, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover o usuário{" "}
            <strong>{deleteTarget?.login}</strong>? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
