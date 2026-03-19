import {
  EventStatus,
  MovementType,
  NotificationDestiny,
  OperationType,
  SectorType,
} from "@/utils/enums";
import { api, API_BASE_URL } from "./canonical";
import type {
  PaginatedResponse,
  DashboardSummaryResponse,
  AdminInsightsResponse,
  NotificationsResponse,
} from "./types";
import { StockItemType, UpdateUserPayload } from "@/interfaces/types";
import { MovementsParams } from "@/components/StockReporter";
import type { StockReplacementItem } from "@/components/StockReplacementModal";
import type {
  Drawer,
  DrawerCategory,
  RawStockInput,
  RawStockMedicine,
} from "@/interfaces/interfaces";
import type { StockItemRaw } from "@/interfaces/interfaces";
import type { RawMovement } from "@/interfaces/interfaces";

export const getCabinets = (page = 1, limit = 10) =>
  api.get<PaginatedResponse<{ numero: number; categoria: string }>>(
    "/armarios",
    {
      params: { page, limit },
    },
  );

export const getNonMovementProducts = () =>
  api.get("/movimentacoes/produtos-parados");

export const checkCabinetStock = (number: number) =>
  api.get(`/armarios/${number}/check`);

export const deleteCabinet = (
  number: number,
  destiny?: Record<string, unknown>,
) => api.delete(`/armarios/${number}`, destiny);

export const getMedicines = (
  page = 1,
  limit = 10,
  name?: string,
): Promise<PaginatedResponse<RawStockMedicine>> =>
  api.get<PaginatedResponse<RawStockMedicine>>("/medicamentos", {
    params: { page, limit, ...(name ? { name } : {}) },
  });

export const deleteMedicine = (id: number) => api.delete(`/medicamentos/${id}`);

export const getStockProportions = (sector?: string) =>
  api.get(`/estoque/proporcao${sector ? `?setor=${sector}` : ""}`);

export const getInputMovements = ({
  page = 1,
  limit = 10,
  type = "",
  days = 0,
}: {
  page?: number;
  limit?: number;
  days?: number;
  type?: string;
}): Promise<PaginatedResponse<RawMovement>> =>
  api.get<PaginatedResponse<RawMovement>>("/movimentacoes/insumos", {
    params: { page, limit, type, days },
  });

export const getMedicineMovements = ({
  page = 1,
  limit = 10,
  days = 0,
  type,
}: {
  page?: number;
  limit?: number;
  days?: number;
  type?: string;
}): Promise<PaginatedResponse<RawMovement>> =>
  api.get<PaginatedResponse<RawMovement>>("/movimentacoes/medicamentos", {
    params: { page, limit, days, type },
  });

export const getInputs = (
  page = 1,
  limit = 10,
  name?: string,
): Promise<PaginatedResponse<RawStockInput>> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (name) params.append("name", name);
  return api.get<PaginatedResponse<RawStockInput>>(
    `/insumos?${params.toString()}`,
  );
};

export const deleteInput = (id: number) => api.delete(`/insumos/${id}`);

export const getResidents = (page = 1, limit = 20) =>
  api.get<PaginatedResponse<{ casela: number; name: string }>>("/residentes", {
    params: { page, limit },
  });

export const getResidentsCount = () => api.get("/residentes/count");
export const getCabinetsCount = () => api.get("/armarios/count");
export const getDrawersCount = () => api.get("/gavetas/count");

export const getDashboardSummary = (params?: { expiringDays?: number }) =>
  api.get<DashboardSummaryResponse>("/dashboard/summary", {
    params: params as Record<string, unknown>,
  });

export type ExpiringItem = {
  tipo_item: "medicamento" | "insumo";
  item_id: number;
  estoque_id: number;
  nome: string;
  principio_ativo?: string | null;
  dosagem?: string | null;
  unidade_medida?: string | null;
  descricao?: string | null;
  validade: string | null;
  quantidade: number;
  lote: string | null;
  setor: string | null;
  paciente: string | null;
  dias_para_vencer: number;
};

export const getExpiringItems = (
  days: number,
  page = 1,
  limit = 50,
): Promise<{ data: ExpiringItem[]; total: number; hasNext: boolean }> =>
  api.get("/dashboard/expiring-items", {
    params: { days, page, limit },
  });

export type ConsumptionPeriodItem = {
  period: string;
  entrada: number;
  saida: number;
};

export const getConsumptionByPeriod = (
  start: string,
  end: string,
  groupBy: "month" | "quarter" = "month",
): Promise<ConsumptionPeriodItem[]> =>
  api.get("/movimentacoes/consumo", {
    params: { start, end, groupBy },
  });

export type ConsumptionByItemRow = {
  tipo_item: "medicamento" | "insumo";
  item_id: number;
  nome: string;
  entrada: number;
  saida: number;
};

export type ConsumptionByItemResponse = {
  items: ConsumptionByItemRow[];
  subtotal: { entrada: number; saida: number };
};

export const getConsumptionByItem = (
  start: string,
  end: string,
): Promise<ConsumptionByItemResponse> =>
  api.get("/movimentacoes/consumo-por-item", {
    params: { start, end },
  });

export const deleteResident = (casela: string | number) =>
  api.delete(`/residentes/${casela}`);

export const getReport = (
  type: string,
  casela?: number,
  params?: MovementsParams,
) => {
  const search = new URLSearchParams({ type });

  if (casela != null) {
    search.append("casela", casela.toString());
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      search.append(key, value);
    });
  }

  return api.get(`/relatorios?${search.toString()}`);
};

/** Build query params for admin CSV export (same shape as getReport). */
export function buildAdminExportParams(
  type: string,
  casela?: number,
  params?: MovementsParams,
): Record<string, string> {
  const out: Record<string, string> = { type };
  if (casela != null) out.casela = String(casela);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      out[key] = String(value);
    });
  }
  return out;
}

/** Download admin export as CSV (uses credentials). */
export async function downloadAdminExportCSV(
  queryParams: Record<string, string>,
): Promise<void> {
  const search = new URLSearchParams(queryParams);
  const res = await fetch(`${API_BASE_URL}/admin/export?${search.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Erro ao exportar");
  }
  const text = await res.text();
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `export-${queryParams.type || "relatorio"}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const getTransferReport = () => {
  return api.get("/relatorios?type=transferencias");
};

export const getDailyMovementsReport = () => {
  return api.get("/relatorios?type=movimentos_dia");
};

export const login = (login: string, password: string) =>
  api.post("/login/authenticate", { login, password });

export type CurrentUserResponse = {
  id?: number;
  login?: string;
  role?: "admin" | "user";
  firstName?: string;
  lastName?: string;
  // Some endpoints may still return snake_case
  first_name?: string;
  last_name?: string;
};

export const getCurrentUser = (): Promise<CurrentUserResponse> =>
  api.get<CurrentUserResponse>("/login/usuario-logado");

export const register = (
  login: string,
  password: string,
  firstName: string,
  lastName: string,
) =>
  api.post("/login", {
    login,
    password,
    first_name: firstName,
    last_name: lastName,
  });

export const updateInput = (id: number, data: Record<string, unknown>) =>
  api.put(`/insumos/${id}`, data);

export const updateCabinet = (id: number, data: Record<string, unknown>) =>
  api.put(`/armarios/${id}`, data);

export const updateMedicine = (id: number, data: Record<string, unknown>) =>
  api.put(`/medicamentos/${id}`, data);

export const resetPassword = (login: string, newPassword: string) =>
  api.post(`/login/reset-password`, { login, newPassword });

export const updateResident = (
  casela: string | number,
  data: Record<string, unknown>,
) => api.put(`/residentes/${casela}`, data);

export const updateUser = (payload: UpdateUserPayload) =>
  api.put("/login", payload);

export const createCabinet = (numero: number, categoria_id: number) =>
  api.post("/armarios", { numero, categoria_id });

export const createInput = (
  nome: string,
  descricao?: string,
  estoque_minimo?: number,
  preco?: number | null,
) =>
  api.post("/insumos", {
    nome,
    descricao: descricao ?? null,
    estoque_minimo: estoque_minimo ?? 0,
    preco: preco ?? null,
  });

export const createMedicine = (
  nome: string,
  principio_ativo: string,
  dosagem: string,
  unidade_medida: string,
  estoque_minimo?: number | null,
  _preco?: number | null,
) =>
  api.post("/medicamentos", {
    nome,
    principio_ativo,
    dosagem,
    unidade_medida,
    estoque_minimo: estoque_minimo != null ? Number(estoque_minimo) : null,
  });

export const createResident = (nome: string, casela: string) =>
  api.post("/residentes", { nome, casela: parseInt(casela) });

export const createStockOut = (payload: {
  estoqueId: number;
  tipo: OperationType;
  quantidade: number;
}) => api.post("/estoque/saida", payload);

export const createStockIn = (payload: {
  tipo: string;
  medicamento_id?: number;
  insumo_id?: number;
  quantidade: number;
  armario_id?: number | null;
  gaveta_id?: number | null;
  casela_id?: number | null;
  validade?: Date | null;
  origem?: string | null;
  setor: string;
  lote?: string | null;
  observacao?: string | null;
  preco?: number | null;
}) => api.post("/estoque/entrada", payload);

export const createMovement = (payload: {
  tipo: MovementType;
  login_id: number;
  armario_id: number;
  quantidade: number;
  casela_id?: number;
  gaveta_id?: number;
  medicamento_id?: number;
  validade: string;
  insumo_id?: number;
  setor: string;
  lote?: string | null;
}) => api.post("/movimentacoes", payload);

export const createNotificationEvent = (payload: {
  medicamento_id: number;
  residente_id: number;
  destino: NotificationDestiny;
  data_prevista: Date;
  criado_por: number;
  tipo_evento: string;
  status: EventStatus;
}) => api.post("/notificacao", payload);

export const getNotifications = async ({
  page = 1,
  limit = 10,
  type,
  status,
  date,
  residente_nome,
  visto,
}: {
  page?: number;
  limit?: number;
  type: string;
  status?: string;
  date?: "today" | "tomorrow" | string;
  residente_nome?: string;
  visto?: boolean;
}) => {
  try {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit,
      type,
      status,
      date,
      residente_nome,
    };
    if (visto === false) params.visto = false;
    if (visto === true) params.visto = true;

    const res = await api.get<NotificationsResponse>("/notificacao", {
      params,
    });

    return {
      items: res?.items ?? [],
      total: res?.total ?? 0,
      hasNext: res?.hasNext ?? false,
    };
  } catch {
    return { items: [], total: 0, hasNext: false };
  }
};

export const updateNotification = (
  id: number,
  data: { status?: string; visto?: boolean },
) => api.patch(`/notificacao/${id}`, data);

export const patchNotificationEvent = (
  id: number,
  data: Partial<{
    medicamento_id: number;
    residente_id: number;
    destino: string;
    data_prevista: Date;
    criado_por: number;
    status: EventStatus;
  }>,
) => api.patch(`/notificacao/${id}`, data);

export const getTodayMedicineNotifications = () =>
  getNotifications({
    type: "medicamento",
    date: "today",
    status: EventStatus.PENDENTE,
    visto: false,
  });

export const getTomorrowReplacementNotifications = async () => {
  const res = await getNotifications({
    type: "reposicao_estoque",
    date: "tomorrow",
    status: EventStatus.PENDENTE,
    visto: false,
  });
  return {
    ...res,
    items: res.items as StockReplacementItem[],
  };
};

export const getStockFilterOptions = () =>
  api.get<{ cabinets: number[]; caselas: number[]; lots: string[] }>(
    "/estoque/filter-options",
  );

export const getStock = (
  page = 1,
  limit = 6,
  filters?: Record<string, any>,
  extraFilter?: string | null,
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters) {
    if (filters.type) params.append("type", filters.type);
    if (filters.name) params.append("name", filters.name);
    if (filters.activeSubstance)
      params.append("activeSubstance", filters.activeSubstance);
    if (filters.cabinet) params.append("cabinet", filters.cabinet);
    if (filters.drawer) params.append("drawer", filters.drawer);
    if (filters.casela) params.append("casela", filters.casela);
    if (filters.origin) params.append("origin", filters.origin);
    if (filters.sector) params.append("sector", filters.sector);
    if (filters.lot) params.append("lot", filters.lot);
    if (filters.itemType) params.append("itemType", filters.itemType);
    if (filters.stockType) params.append("stockType", filters.stockType);
  }

  if (extraFilter) {
    params.append("filter", extraFilter);
  }

  return api.get<PaginatedResponse<StockItemRaw>>(
    `/estoque?${params.toString()}`,
  );
};

export const getCabinetCategories = (page = 1, limit = 5) =>
  api.get<PaginatedResponse<{ id: number; nome: string }>>(
    "/categoria-armario",
    {
      params: { page, limit },
    },
  );

export const createCabinetCategory = (nome: string) =>
  api.post("/categoria-armario", { nome });

export const getMedicineRanking = (
  type: "more" | "less",
  page = 1,
  limit = 10,
) =>
  api.get("/movimentacoes/medicamentos/ranking", {
    params: { type, page, limit },
  });

export const getDrawers = (page = 1, limit = 10) =>
  api.get<PaginatedResponse<Drawer>>("/gavetas", {
    params: { page, limit },
  });

export const getDrawerByNumber = (numero: number) =>
  api.get(`/gavetas/${numero}`);

export const createDrawer = (numero: number, categoria_id: number) =>
  api.post("/gavetas", { numero, categoria_id });

export const updateDrawer = (numero: number, categoria_id: number) =>
  api.put(`/gavetas/${numero}`, { categoria_id });

export const deleteDrawer = (numero: number) =>
  api.delete(`/gavetas/${numero}`);

export const getDrawerCategories = (page = 1, limit = 10) =>
  api.get<PaginatedResponse<DrawerCategory>>("/categoria-gaveta", {
    params: { page, limit },
  });

export const getDrawerCategoryById = (id: number) =>
  api.get(`/categoria-gaveta/${id}`);

export const createDrawerCategory = (nome: string) =>
  api.post("/categoria-gaveta", { nome });

export const updateDrawerCategory = (id: number, nome: string) =>
  api.put(`/categoria-gaveta/${id}`, { nome });

export const deleteDrawerCategory = (id: number) =>
  api.delete(`/categoria-gaveta/${id}`);

export const removeIndividualMedicineFromStock = (stockId: number) =>
  api.patch(`/estoque/medicamento/${stockId}/remover-individual`);

export const getDaysForReplacementForNursing = (
  medicamentoId: number,
  caselaId: number,
) =>
  api.get("/estoque/medicamento/dias-para-repor", {
    params: { medicamento_id: medicamentoId, casela_id: caselaId },
  });

export const suspendMedicineFromStock = (stockId: number) =>
  api.patch(`/estoque/medicamento/${stockId}/suspender`);

export const resumeMedicineFromStock = (stockId: number) =>
  api.patch(`/estoque/medicamento/${stockId}/retomar`);

export const removeIndividualInputFromStock = (stockId: number) =>
  api.patch(`/estoque/insumo/${stockId}/remover-individual`);

export const suspendInputFromStock = (stockId: number) =>
  api.patch(`/estoque/insumo/${stockId}/suspender`);

export const resumeInputFromStock = (stockId: number) =>
  api.patch(`/estoque/insumo/${stockId}/retomar`);

export const deleteStockItem = (stockId: number, type: StockItemType) =>
  api.delete(`/estoque/${type}/${stockId}`);

export const transferStockSector = (payload: {
  estoque_id: number;
  setor: SectorType;
  itemType: StockItemType;
  quantidade?: number;
  casela_id?: number;
  destino?: string | null;
  observacao?: string | null;
  bypassCasela: boolean;
  dias_para_repor: number | null;
}) => {
  const basePath =
    payload.itemType === "medicamento"
      ? "/estoque/medicamento"
      : "/estoque/insumo";
  return api.patch(`${basePath}/${payload.estoque_id}/transferir-setor`, {
    setor: payload.setor,
    quantidade: payload.quantidade,
    casela_id: payload.casela_id,
    destino: payload.destino,
    observacao: payload.observacao,
    bypassCasela: payload.bypassCasela,
    dias_para_repor: payload.dias_para_repor,
  });
};

export const updateStockItem = (
  estoqueId: number,
  itemTipo: StockItemType,
  data: {
    quantidade?: number;
    armario_id?: number | null;
    gaveta_id?: number | null;
    validade?: string | null;
    origem?: string | null;
    setor?: string;
    lote?: string | null;
    casela_id?: number | null;
    tipo?: string;
    preco?: number | null;
    observacao?: string | null;
    dias_para_repor?: number | null;
  },
) => {
  const { tipo: stockTipo, ...restData } = data;
  return api.put(`/estoque/${estoqueId}`, {
    tipo: itemTipo,
    stockTipo: stockTipo,
    ...restData,
  });
};

export const getBackendLoadingStatus = () => api.get("/status");

export const logoutRequest = () => api.post("/login/logout");

export const getAdminUsers = (params?: { page?: number; limit?: number }) =>
  api.get("/admin/users", { params: params ?? {} });

export type UserPermissions = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type CreateAdminUserPayload = {
  login: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "user";
  permissions?: UserPermissions;
};

export const createAdminUser = (data: CreateAdminUserPayload) =>
  api.post("/admin/users", data);

export const updateAdminUser = (
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    login?: string;
    password?: string;
    role?: "admin" | "user";
    permissions?: UserPermissions;
  },
) => api.put(`/admin/users/${id}`, data);

export const deleteAdminUser = (id: number) => api.delete(`/admin/users/${id}`);

export type LoginLogEntry = {
  id: number;
  user_id: number | null;
  login: string;
  success: boolean;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AdminLoginLogResponse = {
  data: LoginLogEntry[];
  total: number;
  page: number;
  limit: number;
};

export const getAdminLoginLog = (params?: {
  page?: number;
  limit?: number;
  userId?: number;
  login?: string;
  success?: boolean;
  fromDate?: string;
  toDate?: string;
}) =>
  api.get<AdminLoginLogResponse>("/admin/login-log", { params: params ?? {} });

export type AdminMetricsResponse = {
  movementsThisMonth: number;
  activeUsersThisMonth: number;
};

export const getAdminMetrics = () =>
  api.get<AdminMetricsResponse>("/admin/metrics");

export type AdminActiveUserThisMonth = {
  id: number;
  login: string;
  first_name: string | null;
  last_name: string | null;
  last_login_at: string;
  logins_count: number;
};

export type AdminActiveUsersThisMonthResponse = {
  data: AdminActiveUserThisMonth[];
  total: number;
  page: number;
  limit: number;
};

export const getAdminActiveUsersThisMonth = (params?: {
  page?: number;
  limit?: number;
}) =>
  api.get<AdminActiveUsersThisMonthResponse>("/admin/metrics/active-users", {
    params: params ?? {},
  });

export const getAdminMovementsThisMonth = (params?: {
  page?: number;
  limit?: number;
}) =>
  api.get<{
    data: StockHistoryEntry[];
    total: number;
    hasNext: boolean;
    page: number;
    limit: number;
  }>("/admin/metrics/movements", { params: params ?? {} });

export type AdminHealthResponse = {
  database: string;
  redis: string;
  lastBackupAt: string | null;
};

export const getAdminHealth = () =>
  api.get<AdminHealthResponse>("/admin/health");

export type AdminBackupStatusResponse = {
  lastBackupAt: string | null;
  lastBackupStatus: string | null;
  lastBackupDurationMs: number | null;
  lastBackupSizeBytes: number | null;
  lastBackupError: string | null;
  retentionCount: number | null;
};

export const getAdminBackupStatus = () =>
  api.get<AdminBackupStatusResponse>("/admin/backup/status");

export const runAdminBackupNow = () => api.post("/admin/backup/run", {});

export type AdminDataQualitySummary = {
  negativeStock: { medicines: number; inputs: number };
  missingLot: { medicines: number; inputs: number };
  orphanMovements: number;
};

export const getAdminDataQualitySummary = () =>
  api.get<AdminDataQualitySummary>("/admin/data-quality/summary");

export const getAdminInconsistencies = (params: {
  type: "negative_stock" | "missing_lot" | "orphan_movements";
  page?: number;
  limit?: number;
}) => api.get("/admin/data-quality/inconsistencies", { params });

export const getAdminMedicineDuplicates = (params?: {
  page?: number;
  limit?: number;
}) => api.get("/admin/data-quality/medicine-duplicates", { params: params ?? {} });

export const mergeAdminMedicines = (payload: {
  keepId: number;
  mergeIds: number[];
}) => api.post("/admin/data-quality/merge-medicines", payload);

export const normalizeAdminMedicineUnits = (payload?: { dryRun?: boolean }) =>
  api.post("/admin/data-quality/normalize-medicine-units", payload ?? {});

export const getAdminConfig = () =>
  api.get<Record<string, string>>("/admin/config");

export const updateAdminConfig = (config: Record<string, string>) =>
  api.put("/admin/config", config);

export type RestoreBackupResponse = {
  message: string;
};

/** Envia o arquivo de dump (backup_*.sql.gz ou .sql) para restaurar o banco. */
export const restoreBackup = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(
    "/admin/restore-backup",
    form,
  ) as Promise<RestoreBackupResponse>;
};

export type AdminNotificationItem = {
  id: number;
  destino: string;
  data_prevista: string;
  status: string;
  criado_por: number;
  residente_nome?: string;
  medicamento_nome?: string;
  usuario: string;
  visto: boolean;
  tipo_evento: string;
};

export type AdminNotificationsResponse = {
  items: AdminNotificationItem[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
};

export const getAdminNotifications = (params?: {
  page?: number;
  limit?: number;
  tipo?: string;
  status?: string;
  visto?: boolean;
}) =>
  api.get<AdminNotificationsResponse>("/admin/notifications", {
    params: params ?? {},
  });

export const patchAdminNotification = (
  id: number,
  data: { visto?: boolean; status?: string },
) => api.patch(`/admin/notifications/${id}`, data);

export const getAdminInsights = (params?: {
  days?: number;
  limit?: number;
  page?: number;
  operationType?: "create" | "update" | "delete";
  resource?: string;
  userId?: number;
}) =>
  api.get<AdminInsightsResponse>("/admin/insights", { params: params ?? {} });

export type StockHistoryEntry = {
  id: number;
  tipo: string;
  data: string;
  quantidade: number;
  setor: string;
  lote: string | null;
  nome: string;
  operador: string;
  armario_id: number | null;
  casela_id: number | null;
  residente: string | null;
  item_type?: "medicamento" | "insumo";
};

export const getAdminStockHistory = (params: {
  itemType?: "medicamento" | "insumo";
  itemId?: number;
  lote?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: StockHistoryEntry[];
  total: number;
  hasNext: boolean;
  page: number;
  limit: number;
}> => api.get("/admin/stock-history", { params });
