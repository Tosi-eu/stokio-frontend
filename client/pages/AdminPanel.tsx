import { useEffect, useState } from "react";
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
} from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { createStockPDF, MovementPeriod } from "@/components/StockReporter";
import { getReportTitle } from "@/helpers/relatorio.helper";
import { parseYearMonthToDate, formatValidityDate } from "@/helpers/dates.helper";
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
  old_value: string | null;
  new_value: string | null;
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

function formatAuditValue(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "—";
  try {
    const o = JSON.parse(raw);
    return JSON.stringify(o, null, 2);
  } catch {
    return raw;
  }
}

function auditValuePreview(raw: string | null | undefined): string {
  if (raw == null || raw === "") return "—";
  try {
    const o = JSON.parse(raw);
    const one = JSON.stringify(o);
    return one.length > 60 ? one.slice(0, 57) + "…" : one;
  } catch {
    return String(raw).slice(0, 60);
  }
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
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightDays, setInsightDays] = useState(30);
  const [insightDaysInput, setInsightDaysInput] = useState("30");
  const [insightFilter, setInsightFilter] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(25);
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

  // Executive summary
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState<
    "residents" | "medicines" | "inputs" | "cabinets" | "drawers" | null
  >(null);
  const [summaryListData, setSummaryListData] = useState<Record<string, unknown>[]>([]);
  const [loadingSummaryList, setLoadingSummaryList] = useState(false);

  // Consolidated alerts
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

  // Reports
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
  const [reportTransferPeriod, setReportTransferPeriod] =
    useState<MovementPeriod>(MovementPeriod.DIARIO);
  const [reportStatus, setReportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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
      ) => ({
        data: r.data ?? [],
        hasNext: r.hasNext ?? (r.total != null && page * limit < r.total),
      });
      let list: Record<string, unknown>[] = [];
      if (kind === "residents") {
        list = await fetchAllPaginated(
          (p, l) =>
            getResidents(p, l).then((r: any) => ({
              data: r.data ?? [],
              hasNext: r.hasNext ?? false,
            })),
          limit,
        );
      } else if (kind === "medicines") {
        list = await fetchAllPaginated(
          (p, l) =>
            getMedicines(p, l).then((r: any) => toList(r, p)),
          limit,
        );
      } else if (kind === "inputs") {
        list = await fetchAllPaginated(
          (p, l) =>
            getInputs(p, l).then((r: any) => toList(r, p)),
          limit,
        );
      } else if (kind === "cabinets") {
        list = await fetchAllPaginated(
          (p, l) =>
            getCabinets(p, l).then((r: any) => toList(r, p)),
          limit,
        );
      } else {
        list = await fetchAllPaginated(
          (p, l) =>
            getDrawers(p, l).then((r: any) => toList(r, p)),
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
      const stockList = await fetchAllPaginated((page, limit) =>
        getStock(page, limit).then((res: any) => res),
      );
      const noStock = (stockList as any[])
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
      const belowMin = (stockList as any[])
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
      const expired = (stockList as any[])
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
      const expiringSoon = (stockList as any[])
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
      let response: any;
      if (tipo === "movimentacoes") {
        let params: any;
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
            toast({ title: "Selecione o intervalo de datas", variant: "error" });
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
        let params: any;
        if (reportTransferPeriod === MovementPeriod.DIARIO) {
          if (!reportTransferDate) {
            toast({ title: "Selecione a data da transferência", variant: "error" });
            setReportStatus("idle");
            return;
          }
          params = {
            periodo: MovementPeriod.DIARIO,
            data: reportTransferDate.toISOString().split("T")[0],
          };
        } else {
          if (!reportStartDate || !reportEndDate) {
            toast({ title: "Selecione o intervalo de datas", variant: "error" });
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
            ? selectedReportResident ?? undefined
            : undefined;
        response = await getReport(tipo, casela);
      }
      const doc = createStockPDF(tipo, response);
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

  const showReportResidentSelector =
    selectedReportType === "residente_consumo" ||
    selectedReportType === "medicamentos_residente";
  const showReportMovementFilters = selectedReportType === "movimentacoes";
  const showReportTransferFilters = selectedReportType === "transferencias";
  const filteredReportResidents = reportResidents.filter((r) => {
    if (!reportResidentSearch.trim()) return true;
    return r.casela.toString().startsWith(reportResidentSearch.trim());
  });

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

  async function loadInsights() {
    setLoadingInsights(true);
    try {
      const data = (await getAdminInsights({
        days: insightDays,
        limit: eventsPageSize,
        page: eventsPage,
        ...(insightFilter ? { operationType: insightFilter } : {}),
      })) as InsightsData | null;
      if (!data) {
        setInsights(null);
        return;
      }
      setInsights({
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        deleted: data.deleted ?? 0,
        total: data.total ?? 0,
        totalFiltered: data.totalFiltered ?? 0,
        events: data.events ?? [],
      });
    } catch (err) {
      toast({
        title: "Erro ao carregar insights",
        variant: "error",
      });
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin" && insightDays) {
      loadInsights();
    }
  }, [user?.role, insightDays, eventsPage, eventsPageSize, insightFilter]);

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
  const totalPages = Math.max(
    1,
    Math.ceil(totalFiltered / eventsPageSize),
  );
  const from = totalFiltered === 0 ? 0 : (eventsPage - 1) * eventsPageSize + 1;
  const to = Math.min(eventsPage * eventsPageSize, totalFiltered);

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
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full max-w-3xl">
          <TabsTrigger value="resumo" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            Resumo executivo
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Edit className="h-4 w-4" />
            Auditoria
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
                            <p className="text-2xl font-bold">{summary.residents}</p>
                            <p className="text-sm text-muted-foreground">Residentes</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Clique para listar</p>
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
                            <p className="text-2xl font-bold">{summary.medicines}</p>
                            <p className="text-sm text-muted-foreground">Medicamentos</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Clique para listar</p>
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
                            <p className="text-2xl font-bold">{summary.inputs}</p>
                            <p className="text-sm text-muted-foreground">Insumos</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Clique para listar</p>
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
                            <p className="text-2xl font-bold">{summary.cabinets}</p>
                            <p className="text-sm text-muted-foreground">Armários</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Clique para listar</p>
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
                            <p className="text-2xl font-bold">{summary.drawers}</p>
                            <p className="text-sm text-muted-foreground">Gavetas</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Clique para listar</p>
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
                                  colSpan={expandedSummary === "medicines" ? 4 : 2}
                                  className="text-center text-muted-foreground"
                                >
                                  Nenhum registro
                                </TableCell>
                              </TableRow>
                            ) : (
                              summaryListData.map((row: any, idx) => (
                                <TableRow key={idx}>
                                  {expandedSummary === "residents" && (
                                    <>
                                      <TableCell>{row.casela ?? "-"}</TableCell>
                                      <TableCell>{row.nome ?? "-"}</TableCell>
                                    </>
                                  )}
                                  {expandedSummary === "medicines" && (
                                    <>
                                      <TableCell>{row.nome ?? "-"}</TableCell>
                                      <TableCell>{row.principio_ativo ?? "-"}</TableCell>
                                      <TableCell>{row.dosagem ?? "-"}</TableCell>
                                      <TableCell>{row.unidade_medida ?? "-"}</TableCell>
                                    </>
                                  )}
                                  {expandedSummary === "inputs" && (
                                    <>
                                      <TableCell>{row.nome ?? "-"}</TableCell>
                                      <TableCell>{row.descricao ?? "-"}</TableCell>
                                    </>
                                  )}
                                  {expandedSummary === "cabinets" && (
                                    <>
                                      <TableCell>{row.numero ?? "-"}</TableCell>
                                      <TableCell>{row.categoria ?? "-"}</TableCell>
                                    </>
                                  )}
                                  {expandedSummary === "drawers" && (
                                    <>
                                      <TableCell>{row.numero ?? "-"}</TableCell>
                                      <TableCell>{row.categoria ?? "-"}</TableCell>
                                    </>
                                  )}
                                </TableRow>
                              ))
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
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                      <span className="text-orange-600">Próximos ao vencimento</span>
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
                              <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                    if (v !== "residente_consumo" && v !== "medicamentos_residente") {
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
                          <CommandEmpty>Nenhum residente encontrado.</CommandEmpty>
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
                      <SelectItem value={MovementPeriod.DIARIO}>Diário</SelectItem>
                      <SelectItem value={MovementPeriod.MENSAL}>Mensal</SelectItem>
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
                      <SelectItem value={MovementPeriod.DIARIO}>Diário</SelectItem>
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

              <Button
                onClick={handleGenerateReport}
                disabled={
                  !selectedReportType ||
                  reportStatus === "loading" ||
                  (showReportResidentSelector && selectedReportResident == null)
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuários do sistema</CardTitle>
              <p className="text-sm text-muted-foreground">
                O administrador pode editar e remover usuários. A criação de novos usuários é feita pelo fluxo de cadastro do sistema.
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
                <Label htmlFor="insight-days" className="text-sm whitespace-nowrap">
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
                <Label htmlFor="insight-days" className="text-sm whitespace-nowrap">
                  dias
                </Label>
                <Button type="button" variant="secondary" size="sm" onClick={applyInsightDays}>
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
                        setInsightFilter((f) => (f === "create" ? null : "create"));
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
                        setInsightFilter((f) => (f === "update" ? null : "update"));
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
                        setInsightFilter((f) => (f === "delete" ? null : "delete"));
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
                      <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
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
                          <TableHead>Recurso</TableHead>
                          <TableHead>Rota</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead className="min-w-[140px]">Antes</TableHead>
                          <TableHead className="min-w-[140px]">Depois</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.events.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
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
                                {AUDIT_OPERATION_LABEL[e.operation_type] ?? e.operation_type}
                              </TableCell>
                              <TableCell>{e.resource ?? "-"}</TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate" title={e.path}>
                                {e.path}
                              </TableCell>
                              <TableCell>
                                {auditStatusLabel(e.status_code)}
                              </TableCell>
                              <TableCell
                                className="text-xs max-w-[200px] font-mono truncate align-top"
                                title={formatAuditValue(e.old_value)}
                              >
                                {auditValuePreview(e.old_value)}
                              </TableCell>
                              <TableCell
                                className="text-xs max-w-[200px] font-mono truncate align-top"
                                title={formatAuditValue(e.new_value)}
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
                    <div className="flex items-center justify-between gap-4 mt-3">
                      <p className="text-sm text-muted-foreground">
                        {from}–{to} de {totalFiltered} eventos
                      </p>
                      <div className="flex items-center gap-1">
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
      </Tabs>

      {/* Edit user modal */}
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

      {/* Delete confirm */}
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
