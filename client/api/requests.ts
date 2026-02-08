import {
  EventStatus,
  MovementType,
  NotificationDestiny,
  OperationType,
  SectorType,
} from "@/utils/enums";
import { api } from "./canonical";
import { StockItemType, UpdateUserPayload } from "@/interfaces/types";
import { MovementsParams } from "@/components/StockReporter";

export const getCabinets = (page = 1, limit = 10) =>
  api.get("/armarios", {
    params: { page, limit },
  });

export const getNonMovementProducts = () =>
  api.get("/movimentacoes/produtos-parados");

export const checkCabinetStock = (number: number) =>
  api.get(`/armarios/${number}/check`);

export const deleteCabinet = (number: number, destiny?: any) =>
  api.delete(`/armarios/${number}`, destiny);

export const getMedicines = (page = 1, limit = 10, name?: string) =>
  api.get("/medicamentos", {
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
}) =>
  api.get("/movimentacoes/insumos", {
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
}) =>
  api.get("/movimentacoes/medicamentos", {
    params: { page, limit, days, type },
  });

export const getInputs = (page = 1, limit = 10, name?: string) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (name) params.append("name", name);
  return api.get(`/insumos?${params.toString()}`);
};

export const deleteInput = (id: number) => api.delete(`/insumos/${id}`);

export const getResidents = (page = 1, limit = 20) =>
  api.get("/residentes", { params: { page, limit } });

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

export const getTransferReport = () => {
  return api.get("/relatorios?type=transferencias");
};

export const getDailyMovementsReport = () => {
  return api.get("/relatorios?type=movimentos_dia");
};

export const login = (login: string, password: string) =>
  api.post("/login/authenticate", { login, password });

export const getCurrentUser = () => api.get("/login/usuario-logado");

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

export const updateInput = (id: number, data: any) =>
  api.put(`/insumos/${id}`, data);

export const updateCabinet = (id: number, data: any) =>
  api.put(`/armarios/${id}`, data);

export const updateMedicine = (id: number, data: any) =>
  api.put(`/medicamentos/${id}`, data);

export const resetPassword = (login: string, newPassword: string) =>
  api.post(`/login/reset-password`, { login, newPassword });

export const updateResident = (casela: string | number, data: any) =>
  api.put(`/residentes/${casela}`, data);

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
  preco?: number | null,
) =>
  api.post("/medicamentos", {
    nome,
    principio_ativo,
    dosagem,
    unidade_medida,
    estoque_minimo: Number(estoque_minimo) ?? null,
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
}: {
  page?: number;
  limit?: number;
  type: string;
  status?: string;
  date?: "today" | "tomorrow" | string;
}) => {
  try {
    const res = await api.get("/notificacao", {
      params: { page, limit, type, status, date },
    });

    console.log(JSON.stringify(res));

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
  });

export const getTomorrowReplacementNotifications = () =>
  getNotifications({
    type: "reposicao_estoque",
    date: "tomorrow",
    status: EventStatus.PENDENTE,
  });

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

  return api.get(`/estoque?${params.toString()}`);
};

export const getCabinetCategories = (page = 1, limit = 5) =>
  api.get("/categoria-armario", {
    params: { page, limit },
  });

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
  api.get("/gavetas", {
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
  api.get("/categoria-gaveta", {
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
