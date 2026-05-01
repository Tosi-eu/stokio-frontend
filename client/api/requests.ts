import {
  EventStatus,
  MovementType,
  NotificationDestiny,
  OperationType,
  SectorType,
} from "@/utils/enums";
import type {
  PublicTenantListItem,
  PublicTenantBranding,
  TenantBrandingApiResponse,
  TenantConfigResponse,
  UpdateTenantBrandingPayload,
} from "@porto-sdk/sdk";
import { api, API_BASE_URL, readBearerToken } from "./canonical";
import { readPreviewModeFromStorage } from "@/helpers/preview-mode-storage";
import { toast } from "@/hooks/use-toast.hook";

export type {
  PublicTenantListItem,
  PublicTenantBranding,
  TenantBrandingApiResponse,
  TenantConfigResponse,
  UpdateTenantBrandingPayload,
} from "@porto-sdk/sdk";

export type LoginTenantSummary = {
  slug: string;
  label: string;
  tenantName: string;
  brandName: string | null;
};

export type TenantLogoUploadPhase = "sending" | "storing";

export type TenantLogoUploadCallbacks = {
  onUploadProgress?: (percentLoaded: number) => void;
  onPhase?: (phase: TenantLogoUploadPhase) => void;
};

export type TenantImportRowStatus = "created" | "updated" | "skipped" | "error";

export type TenantImportSheet =
  | "Setores"
  | "Categorias_armario"
  | "Categorias_gaveta"
  | "Armarios"
  | "Gavetas"
  | "Medicamentos"
  | "Insumos"
  | "Residentes"
  | "Estoque_medicamentos"
  | "Estoque_insumos";

export type TenantImportRowError = {
  sheet: TenantImportSheet;
  row: number;
  field?: string;
  message: string;
};

export type TenantImportRowResult = {
  sheet: TenantImportSheet;
  row: number;
  status: TenantImportRowStatus;
};

export type TenantImportEntitySummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

export type TenantPgDumpImportSummary = {
  categoriaArmario: number;
  categoriaGaveta: number;
  armarios: number;
  gavetas: number;
  medicamentos: number;
  insumos: number;
  residentes: number;
  logins: number;
  estoqueMedicamentos: number;
  estoqueInsumos: number;
  movimentacoes: number;
  notificacoes: number;
};

export type TenantPgDumpImportResponse = {
  ok: true;
  warnings: string[];
  summary: TenantPgDumpImportSummary;
};

export type TenantImportXlsxResponse = {
  ok: true;
  summary: {
    setores: TenantImportEntitySummary;
    cabinetCategories: TenantImportEntitySummary;
    drawerCategories: TenantImportEntitySummary;
    cabinets: TenantImportEntitySummary;
    drawers: TenantImportEntitySummary;
    medicines: TenantImportEntitySummary;
    inputs: TenantImportEntitySummary;
    residents: TenantImportEntitySummary;
    medicineStock: TenantImportEntitySummary;
    inputStock: TenantImportEntitySummary;
  };
  rows: {
    setores: TenantImportRowResult[];
    cabinetCategories: TenantImportRowResult[];
    drawerCategories: TenantImportRowResult[];
    cabinets: TenantImportRowResult[];
    drawers: TenantImportRowResult[];
    medicines: TenantImportRowResult[];
    inputs: TenantImportRowResult[];
    residents: TenantImportRowResult[];
    medicineStock: TenantImportRowResult[];
    inputStock: TenantImportRowResult[];
  };
  errors: TenantImportRowError[];
};

export function tenantImportTotalForKey(
  summary: TenantImportXlsxResponse["summary"],
  key: "created" | "updated",
): number {
  return (
    summary.setores[key] +
    summary.cabinetCategories[key] +
    summary.drawerCategories[key] +
    summary.cabinets[key] +
    summary.drawers[key] +
    summary.medicines[key] +
    summary.inputs[key] +
    summary.residents[key] +
    summary.medicineStock[key] +
    summary.inputStock[key]
  );
}

function parseLogoUploadResponse(xhr: XMLHttpRequest): { logoUrl: string } {
  let data: { error?: string; logoUrl?: string } | null = null;
  try {
    if (typeof xhr.response === "string") {
      data = JSON.parse(xhr.response) as { error?: string; logoUrl?: string };
    } else if (xhr.response && typeof xhr.response === "object") {
      data = xhr.response as { error?: string; logoUrl?: string };
    }
  } catch {
    data = null;
  }
  const status = xhr.status;
  if (status >= 200 && status < 300 && data?.logoUrl) {
    return { logoUrl: data.logoUrl };
  }
  if (status === 401) {
    throw new Error(
      "Não autorizado a enviar o logo. Conclua a configuração do abrigo ou verifique se a sessão ainda é válida.",
    );
  }
  const msg =
    typeof data?.error === "string" ? data.error : "Falha no upload do logo";
  throw new Error(msg);
}

export function uploadTenantLogoWithProgress(
  file: File,
  brandName: string,
  callbacks?: TenantLogoUploadCallbacks,
): Promise<{ logoUrl: string }> {
  if (readPreviewModeFromStorage()) {
    toast({
      title: "Modo de visualização",
      description:
        "O logo não é enviado ao servidor neste modo. Conclua a configuração do abrigo para usar o armazenamento (R2).",
      variant: "warning",
      duration: 5000,
    });
    return Promise.reject(
      new Error("Modo de visualização: upload de logo indisponível."),
    );
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/tenant/branding/logo`);
    xhr.withCredentials = true;
    const token = readBearerToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.responseType = "json";
    xhr.timeout = 120_000;

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && callbacks?.onUploadProgress) {
        const pct = Math.round((ev.loaded / Math.max(ev.total, 1)) * 100);
        callbacks.onUploadProgress(Math.min(100, pct));
      }
    };

    xhr.upload.onload = () => {
      callbacks?.onPhase?.("storing");
    };

    xhr.onload = () => {
      try {
        resolve(parseLogoUploadResponse(xhr));
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Falha de rede ao enviar o logo"));
    };

    xhr.ontimeout = () => {
      reject(new Error("Tempo esgotado ao enviar o logo. Tente de novo."));
    };

    callbacks?.onPhase?.("sending");
    const form = new FormData();
    form.append("file", file);
    form.append("brandName", brandName.trim());
    xhr.send(form);
  });
}

export function uploadTenantLogo(
  file: File,
  brandName: string,
): Promise<{ logoUrl: string }> {
  return uploadTenantLogoWithProgress(file, brandName);
}

export async function downloadTenantImportTemplate(): Promise<Blob> {
  const token = readBearerToken();
  const res = await fetch(`${API_BASE_URL}/tenant/import/template`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Falha ao baixar o template");
  }
  return await res.blob();
}

export const importTenantXlsx = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api.post(
    "/tenant/import/xlsx",
    form,
  ) as Promise<TenantImportXlsxResponse>;
};

export function importTenantPgDump(
  file: File,
  options?: {
    replaceTenantData?: boolean;
    birthDateFallback?: string;
    sourceTenantId?: number;
  },
): Promise<TenantPgDumpImportResponse> {
  const params = new URLSearchParams();
  if (options?.replaceTenantData) {
    params.set("replaceTenantData", "1");
  }
  if (options?.birthDateFallback?.trim()) {
    params.set("birthDateFallback", options.birthDateFallback.trim());
  }
  if (options?.sourceTenantId != null) {
    params.set("sourceTenantId", String(options.sourceTenantId));
  }
  const qs = params.toString();
  const path = qs ? `/tenant/import/pg-dump?${qs}` : "/tenant/import/pg-dump";
  const form = new FormData();
  form.append("file", file);
  return api.post(path, form) as Promise<TenantPgDumpImportResponse>;
}
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

export type ResidentListItem = {
  casela: number;
  name: string;
  data_nascimento: string | null;
  idade: number | null;
};

export const getResidents = (page = 1, limit = 20) =>
  api.get<PaginatedResponse<ResidentListItem>>("/residentes", {
    params: { page, limit },
  });

export const getResidentByCasela = (casela: string | number) =>
  api.get<ResidentListItem>(`/residentes/${casela}`);

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

export const listPublicTenants = (params?: { q?: string; limit?: number }) =>
  api.get<{ data: PublicTenantListItem[] }>("/tenants", {
    params: params ?? {},
  });

export type PublicAppConfigResponse = {
  defaultLogoUrl: string | null;
};

export const fetchPublicAppConfig = () =>
  api.get<PublicAppConfigResponse>("/public/app-config");

export async function fetchPublicTenantBrandingIfExists(
  slug: string,
): Promise<PublicTenantBranding | null> {
  const s = slug.trim();
  if (!s) return null;
  const path = `/tenants/${encodeURIComponent(s)}/branding`;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as TenantBrandingApiResponse;
    if (!data || typeof data !== "object" || !("found" in data)) return null;
    if (!data.found) return null;
    return {
      slug: data.slug,
      name: data.name,
      brandName: data.brandName ?? null,
      logoUrl: data.logoUrl ?? null,
      requiresContractCode: true,
      contractCodeMandatory: Boolean(data.contractCodeMandatory),
    };
  } catch {
    return null;
  }
}

export const login = (login: string, password: string, tenantSlug: string) =>
  api.post(
    "/login/authenticate",
    { login, password },
    { headers: { "X-Tenant": tenantSlug } },
  );

export async function fetchLoginTenantsForEmail(
  login: string,
): Promise<LoginTenantSummary[]> {
  const trimmed = login.trim();
  if (!trimmed) return [];
  const res = await fetch(
    `${API_BASE_URL}/login/tenants-for-email?${new URLSearchParams({ login: trimmed })}`,
    { credentials: "include", headers: { Accept: "application/json" } },
  );
  const data = (await res.json().catch(() => null)) as {
    tenants?: Partial<LoginTenantSummary>[];
  } | null;
  if (!res.ok) return [];
  const raw = Array.isArray(data?.tenants) ? data.tenants : [];
  return raw
    .map((t) => {
      const slug = String(t?.slug ?? "").trim();
      if (!slug) return null;
      const label = String(t?.label ?? "").trim() || slug;
      const tenantName = String(t?.tenantName ?? "").trim() || label;
      const bn = t?.brandName != null ? String(t.brandName).trim() : "";
      const brandName = bn.length > 0 ? bn : null;
      return { slug, label, tenantName, brandName };
    })
    .filter((x): x is LoginTenantSummary => x != null);
}
export async function resolveTenantByLogin(
  login: string,
): Promise<
  | { ok: true; slug: string }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "ambiguous"; tenants: LoginTenantSummary[] }
> {
  const trimmed = login.trim();
  if (!trimmed) return { ok: false, reason: "not_found" };

  const res = await fetch(
    `${API_BASE_URL}/login/resolve-tenant?${new URLSearchParams({ login: trimmed })}`,
    { credentials: "include", headers: { Accept: "application/json" } },
  );
  const data = (await res.json().catch(() => null)) as {
    slug?: string;
    tenants?: LoginTenantSummary[];
  } | null;

  if (res.ok && data && typeof data.slug === "string" && data.slug.trim())
    return { ok: true, slug: data.slug.trim() };

  if (res.status === 409 && data?.tenants && Array.isArray(data.tenants))
    return { ok: false, reason: "ambiguous", tenants: data.tenants };

  return { ok: false, reason: "not_found" };
}

export type UserPermissions = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type CurrentUserResponse = {
  id?: number;
  login?: string;
  role?: "admin" | "user";
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  tenantId?: number | null;
  isTenantOwner?: boolean;
  isSuperAdmin?: boolean;
  permissions?: UserPermissions;
  permissionMatrix?: import("@/domain/permission-matrix.types").EffectivePermissionMatrixSerialized;
};

export const getCurrentUser = (): Promise<CurrentUserResponse> =>
  api.get<CurrentUserResponse>("/login/usuario-logado");

export type DisplayConfigResponse = {
  uiDisplay: {
    casela: "numero" | "nome";
    caselaSetor: "farmacia" | "enfermagem" | "todos";
    armario: "numero" | "categoria";
    gaveta: "numero" | "categoria";
  };
};

export const getDisplayConfig = (): Promise<DisplayConfigResponse> =>
  api.get<DisplayConfigResponse>("/login/display-config");

export const register = (
  login: string,
  password: string,
  firstName: string,
  lastName: string,
  tenantSlug: string,
  contractCode?: string,
) =>
  api.post(
    "/login",
    {
      login,
      password,
      first_name: firstName,
      last_name: lastName,
      ...(contractCode != null && contractCode.trim() !== ""
        ? { contract_code: contractCode.trim() }
        : {}),
    },
    { headers: { "X-Tenant": tenantSlug } },
  );

export type RegisterAccountResponse = {
  tenant: { id: number; slug: string };
  user: { id: number; login: string; role: string };
};

export const registerAccount = (
  login: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<RegisterAccountResponse> =>
  api.post<RegisterAccountResponse>("/login/register-account", {
    login,
    password,
    first_name: firstName,
    last_name: lastName,
  });

export type RegisterUserResponse = {
  tenant: { id: number; slug: string };
  user: { id: number; login: string; role: string };
};

export const registerUser = (
  login: string,
  password: string,
  firstName: string,
  lastName: string,
  opts?: { contract_code?: string },
): Promise<RegisterUserResponse> => {
  const cc = opts?.contract_code?.trim();
  return api.post<RegisterUserResponse>("/login/register-user", {
    login,
    password,
    first_name: firstName,
    last_name: lastName,
    ...(cc ? { contract_code: cc } : {}),
  });
};

export const joinByInviteToken = (payload: {
  token: string;
  login: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<RegisterUserResponse> =>
  api.post<RegisterUserResponse>("/login/join-by-token", payload);

export type CreateTenantInviteResponse =
  | {
      ok: true;
      emailSent: true;
      expiresAt: string;
    }
  | {
      token: string;
      link: string;
      emailSent: false;
      expiresAt: string;
      warning?: string;
    };

export const createTenantInvite = (payload: {
  email: string;
  role: "user" | "admin";
  permissions?: {
    read?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  expires_in_days?: number;
}): Promise<CreateTenantInviteResponse> => api.post("/tenant/invites", payload);

export type VerifyContractCodeResponse = {
  valid: boolean;
  contractCodeRequired?: boolean;
  reason?: "missing" | "mismatch" | "no_canonical_tenant";
  /** Slug do abrigo definitivo quando o código casa com um contrato existente (tenant provisório `u-*`). */
  canonicalSlug?: string;
};

export const verifyTenantContractCode = (
  tenantSlug: string,
  contractCode: string,
) =>
  api.post<VerifyContractCodeResponse>(
    `/tenants/${encodeURIComponent(tenantSlug)}/verify-contract-code`,
    { contract_code: contractCode },
  );

export const verifySignupContractCode = (
  contractCode: string,
  signupEmail?: string,
) => {
  const login = signupEmail?.trim();
  return api.post<{ valid: boolean }>(`/contract-code/verify`, {
    contract_code: contractCode,
    ...(login ? { login } : {}),
  });
};

function superAdminApiKeyHeaders(): HeadersInit | undefined {
  const k = process.env.NEXT_PUBLIC_X_API_KEY;
  if (k == null || String(k).trim() === "") return undefined;
  return { "X-API-Key": String(k).trim() };
}

export const adminSetTenantContractCodeBySlug = (
  slug: string,
  payload:
    | { contract_code: string; bound_login: string }
    | { clear_contract_code: true },
) =>
  api.put<{ ok: boolean; slug: string; contractCodeConfigured: boolean }>(
    `/admin/tenants/by-slug/${encodeURIComponent(slug)}/contract-code`,
    payload,
    { headers: superAdminApiKeyHeaders() },
  );

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

export const createResident = (
  nome: string,
  casela: string,
  data_nascimento?: string | null,
) =>
  api.post("/residentes", {
    nome,
    casela: parseInt(casela),
    ...(data_nascimento != null && String(data_nascimento).trim() !== ""
      ? { data_nascimento: String(data_nascimento).trim() }
      : {}),
  });

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

export type HealthCheckResponse = {
  status: string;
  database?: string;
  redis?: string;
};

export const getBackendHealthCheck = () =>
  api.get<HealthCheckResponse>("/health");

export const logoutRequest = () => api.post("/login/logout");

export const getTenantConfig = () =>
  api.get<TenantConfigResponse>("/tenant/config");

export type UpdateTenantModulesPayload = {
  enabled: string[];
  automatic_price_search?: boolean;
  automatic_reposicao_notifications?: boolean;
  enabled_sectors?: string[];
};

export const updateTenantConfig = (modules: UpdateTenantModulesPayload) =>
  api.put<{ tenantId: number; modules: UpdateTenantModulesPayload }>(
    "/tenant/config",
    { modules },
  );

export type ForceTenantPriceBackfillResponse = {
  accepted?: boolean;
  acceptedAtMs?: number;
  message?: string;
};

export type TenantPriceBackfillStatusResponse = {
  running: boolean;
  cooldownSeconds: number | null;
  last: {
    finishedAtMs: number;
    processed: number;
    ok: boolean;
    error?: string;
  } | null;
};

/** [Admin] Inicia busca retroativa em segundo plano (202). Estado em GET status. */
export const forceTenantPriceBackfill = () =>
  api.post<ForceTenantPriceBackfillResponse>("/tenant/price-backfill/run");

/** [Admin] Polling: processo em curso, cooldown e último resultado. */
export const getTenantPriceBackfillStatus = () =>
  api.get<TenantPriceBackfillStatusResponse>("/tenant/price-backfill/status");

export const updateTenantBranding = (payload: UpdateTenantBrandingPayload) =>
  api.put<{ tenantId: number; tenant: TenantConfigResponse["tenant"] }>(
    "/tenant/branding",
    payload,
  );

export const setTenantContractCode = (
  contractCode: string,
  boundLogin: string,
) =>
  api.put<{
    ok: true;
    migrated?: boolean;
    tenantId?: number;
    tenantSlug?: string;
  }>("/tenant/contract-code", {
    contract_code: contractCode,
    bound_login: boundLogin.trim(),
  });

/** Tenant provisório (`u-*`): valida código existente e migra o login para o abrigo definitivo. */
export const claimTenantContractCode = (
  contractCode: string,
  boundLogin: string,
) =>
  api.post<{
    ok: true;
    migrated?: boolean;
    tenantId?: number;
    tenantSlug?: string;
  }>("/tenant/contract-code/claim", {
    contract_code: contractCode,
    bound_login: boundLogin.trim(),
  });

export type TenantSetorRow = {
  id: number;
  tenant_id: number;
  key: string;
  nome: string;
  proportion_profile: string;
  sort_order: number;
  active: boolean;
};

export const listTenantSetores = () =>
  api.get<{ data: TenantSetorRow[] }>("/tenant/setores");

export type CreateTenantSetorPayload = {
  /** Opcional; o servidor infere a partir de `nome` se omitido. */
  key?: string;
  nome: string;
  proportionProfile?: "farmacia" | "enfermagem";
};

export const createTenantSetor = (payload: CreateTenantSetorPayload) =>
  api.post<TenantSetorRow>("/tenant/setores", payload);

export const getAdminUsers = (params?: { page?: number; limit?: number }) =>
  api.get("/admin/users", { params: params ?? {} });

export type CreateAdminUserPayload = {
  login: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "user";
  /** Legado (4 flags) ou matriz `{ version: 2, resources, movement_tipos }`. */
  permissions?:
    | UserPermissions
    | import("@/domain/permission-matrix.types").PermissionMatrixV2Stored;
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
    permissions?:
      | UserPermissions
      | import("@/domain/permission-matrix.types").PermissionMatrixV2Stored;
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
}) =>
  api.get("/admin/data-quality/medicine-duplicates", { params: params ?? {} });

export const mergeAdminMedicines = (payload: {
  keepId: number;
  mergeIds: number[];
}) => api.post("/admin/data-quality/merge-medicines", payload);

export const normalizeAdminMedicineUnits = (payload?: { dryRun?: boolean }) =>
  api.post("/admin/data-quality/normalize-medicine-units", payload ?? {});

export type AdminSystemConfig = Record<string, string>;

export const getAdminConfig = () => api.get<AdminSystemConfig>("/admin/config");

export const updateAdminConfig = (config: AdminSystemConfig) =>
  api.put<AdminSystemConfig>("/admin/config", config);

export type AdminTenant = {
  id: number;
  slug: string;
  name: string;
  brandName?: string | null;
  logoUrl?: string | null;
  contractPortfolioId?: number | null;
  contractConfigured?: boolean;
  contractBoundLogin?: string | null;
};
export type AdminTenantsResponse = {
  data: AdminTenant[];
  total: number;
  page: number;
  limit: number;
};

export const getAdminTenants = (params?: { page?: number; limit?: number }) =>
  api.get<AdminTenantsResponse>("/admin/tenants", {
    params: params ?? {},
    headers: superAdminApiKeyHeaders(),
  });
export const createAdminTenant = (data: {
  slug: string;
  name: string;
  contract_code?: string;
}) =>
  api.post<AdminTenant>("/admin/tenants", data, {
    headers: superAdminApiKeyHeaders(),
  });
export const updateAdminTenant = (
  id: number,
  data: Partial<{ slug: string; name: string; contract_code?: string }>,
) =>
  api.put<AdminTenant>(`/admin/tenants/${id}`, data, {
    headers: superAdminApiKeyHeaders(),
  });
export const deleteAdminTenant = (id: number) =>
  api.delete<{ ok: boolean }>(`/admin/tenants/${id}`, undefined, {
    headers: superAdminApiKeyHeaders(),
  });

export const getAdminTenantConfig = (id: number) =>
  api.get<TenantConfigResponse>(`/admin/tenants/${id}/config`, {
    headers: superAdminApiKeyHeaders(),
  });
export const setAdminTenantConfig = (
  id: number,
  modules: { enabled: string[] },
) =>
  api.put<TenantConfigResponse>(
    `/admin/tenants/${id}/config`,
    { modules },
    { headers: superAdminApiKeyHeaders() },
  );

export type RestoreBackupResponse = {
  message: string;
};

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
