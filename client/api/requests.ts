import {
  EventStatus,
  MovementType,
  NotificationDestiny,
  OperationType,
} from "@/utils/enums";
import type {
  ConsumptionByItemResponse,
  ConsumptionPeriodItem,
  PublicTenantBranding,
  TenantConfigResponse,
  TenantPgDumpImportResponse,
  UpdateTenantBrandingPayload,
} from "@stokio/sdk";
import {
  uploadTenantBrandingLogoWithProgress,
  StokioApiError,
} from "@stokio/sdk";
import { stokioClient, API_BASE_URL, readBearerToken } from "./canonical";

export async function submitPublicContact(payload: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/public/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, website: "" }),
  });
  if (!res.ok) {
    let msg = "Could not send the message.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* Nothing to do */
    }
    throw new Error(msg);
  }
}
import { reportClientError } from "@/helpers/error-report.helper";
import { readPreviewModeFromStorage } from "@/helpers/preview-mode-storage";
import { toast } from "@/hooks/use-toast.hook";

export type {
  PublicTenantListItem,
  PublicTenantBranding,
  TenantBrandingApiResponse,
  TenantConfigResponse,
  UpdateTenantBrandingPayload,
} from "@stokio/sdk";

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

export type {
  TenantImportRowStatus,
  TenantImportSheet,
  TenantImportRowError,
  TenantImportRowResult,
  TenantImportEntitySummary,
  TenantPgDumpImportSummary,
  TenantPgDumpImportResponse,
  TenantImportXlsxResponse,
} from "@stokio/sdk";

export { tenantImportTotalForKey } from "@stokio/sdk";

export function uploadTenantLogoWithProgress(
  file: File,
  brandName: string,
  callbacks?: TenantLogoUploadCallbacks,
): Promise<{ logoUrl: string }> {
  if (readPreviewModeFromStorage()) {
    toast({
      title: "Modo de visualização",
      description:
        "O logo não é enviado ao servidor neste modo. Conclua a configuração do abrigo para poder enviar o logo.",
      variant: "warning",
      duration: 5000,
    });
    const previewErr = new Error(
      "Modo de visualização: upload de logo indisponível.",
    );
    reportClientError(previewErr, {
      category: "validation",
      severity: "warning",
      httpMethod: "POST",
      httpPath: "/tenant/branding/logo",
      context: { uploadLogo: true, previewMode: true },
    });
    return Promise.reject(previewErr);
  }
  return uploadTenantBrandingLogoWithProgress({
    baseUrl: API_BASE_URL,
    file,
    brandName,
    getToken: readBearerToken,
    callbacks: {
      onUploadProgress: callbacks?.onUploadProgress,
      onPhase: callbacks?.onPhase,
    },
  }).catch((e) => {
    reportClientError(e, {
      httpMethod: "POST",
      httpPath: "/tenant/branding/logo",
      context: { uploadLogo: true },
    });
    throw e;
  });
}

export function uploadTenantLogo(
  file: File,
  brandName: string,
): Promise<{ logoUrl: string }> {
  return uploadTenantLogoWithProgress(file, brandName);
}

export async function downloadTenantImportTemplate(): Promise<Blob> {
  try {
    return await stokioClient.tenant.importTemplateBlob();
  } catch (e) {
    const err = new Error("Falha ao baixar o template");
    reportClientError(e ?? err, {
      httpMethod: "GET",
      httpPath: "/tenant/import/template",
      context: { downloadImportTemplate: true },
    });
    throw err;
  }
}

export const importTenantXlsx = (file: File) =>
  stokioClient.imports.tenantXlsx(file);

export function importTenantPgDump(
  file: File,
  options?: {
    replaceTenantData?: boolean;
    birthDateFallback?: string;
    sourceTenantId?: number;
  },
): Promise<TenantPgDumpImportResponse> {
  return stokioClient.imports.tenantPgDump(file, options);
}
import type {
  PaginatedResponse,
  DashboardSummaryResponse,
  AdminInsightsResponse,
} from "./types";
import {
  StockItemType,
  UpdateUserPayload,
  UpdateUserResponse,
} from "@/interfaces/types";
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
  stokioClient.get<PaginatedResponse<{ numero: number; categoria: string }>>(
    "/armarios",
    {
      params: { page, limit },
    },
  );

export const getCabinetsInTenantContext = (
  tenantSlug: string,
  page = 1,
  limit = 500,
) => {
  const slug = tenantSlug.trim();
  return stokioClient.get<
    PaginatedResponse<{ numero: number; categoria: string }>
  >("/armarios", {
    params: { page, limit },
    headers: { "X-Tenant": slug },
  });
};

export const getDrawersInTenantContext = (
  tenantSlug: string,
  page = 1,
  limit = 500,
) => {
  const slug = tenantSlug.trim();
  return stokioClient.get<PaginatedResponse<Drawer>>("/gavetas", {
    params: { page, limit },
    headers: { "X-Tenant": slug },
  });
};

export const getNonMovementProducts = () =>
  stokioClient.get("/movimentacoes/produtos-parados");

export const checkCabinetStock = (number: number) =>
  stokioClient.get(`/armarios/${number}/check`);

export const deleteCabinet = (
  number: number,
  destiny?: Record<string, unknown>,
) => stokioClient.delete(`/armarios/${number}`, destiny);

export const getMedicines = (
  page = 1,
  limit = 10,
  name?: string,
): Promise<PaginatedResponse<RawStockMedicine>> =>
  stokioClient.get<PaginatedResponse<RawStockMedicine>>("/medicamentos", {
    params: { page, limit, ...(name ? { name } : {}) },
  });

export const getMedicinesInTenantContext = (
  tenantSlug: string,
  page = 1,
  limit = 15,
  name?: string,
): Promise<PaginatedResponse<RawStockMedicine>> => {
  const slug = tenantSlug.trim();
  return stokioClient.get<PaginatedResponse<RawStockMedicine>>(
    "/medicamentos",
    {
      params: {
        page,
        limit,
        ...(name?.trim() ? { name: name.trim() } : {}),
      },
      headers: { "X-Tenant": slug },
    },
  );
};

export const getInputsInTenantContext = (
  tenantSlug: string,
  page = 1,
  limit = 20,
  name?: string,
): Promise<PaginatedResponse<RawStockInput>> => {
  const slug = tenantSlug.trim();
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (name?.trim()) params.set("name", name.trim());
  return stokioClient.get<PaginatedResponse<RawStockInput>>(
    `/insumos?${params.toString()}`,
    { headers: { "X-Tenant": slug } },
  );
};

export const deleteMedicine = (id: number) =>
  stokioClient.delete(`/medicamentos/${id}`);

export const getStockProportions = (sector?: string) =>
  stokioClient.get(`/estoque/proporcao${sector ? `?setor=${sector}` : ""}`);

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
  stokioClient.get<PaginatedResponse<RawMovement>>("/movimentacoes/insumos", {
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
  stokioClient.get<PaginatedResponse<RawMovement>>(
    "/movimentacoes/medicamentos",
    {
      params: { page, limit, days, type },
    },
  );

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
  return stokioClient.get<PaginatedResponse<RawStockInput>>(
    `/insumos?${params.toString()}`,
  );
};

export const deleteInput = (id: number) =>
  stokioClient.delete(`/insumos/${id}`);

export type ResidentListItem = {
  casela: number;
  name: string;
  data_nascimento: string | null;
  idade: number | null;
};

export const getResidents = (page = 1, limit = 20) =>
  stokioClient.get<PaginatedResponse<ResidentListItem>>("/residentes", {
    params: { page, limit },
  });

export const getResidentsInTenantContext = (
  tenantSlug: string,
  page = 1,
  limit = 100,
) => {
  const slug = tenantSlug.trim();
  return stokioClient.get<PaginatedResponse<ResidentListItem>>("/residentes", {
    params: { page, limit },
    headers: { "X-Tenant": slug },
  });
};

export const getResidentByCasela = (casela: string | number) =>
  stokioClient.get<ResidentListItem>(`/residentes/${casela}`);

export type ResidentIssuedMedicalRecord = {
  categoria: "medicamento" | "insumo";
  nome: string;
  detalhe: string;
  observacao: string | null;
  frequencia_aplicacao: number | null;
  periodo_aplicacao: string | null;
  medicamento_id: number | null;
  insumo_id: number | null;
};

export type ResidentIssuedMedicalRecordResponse = {
  residente: string;
  casela: number;
  itens: ResidentIssuedMedicalRecord[];
};

export const getResidentProntuarioAtivo = (casela: string | number) =>
  stokioClient.get<ResidentIssuedMedicalRecordResponse>(
    `/residentes/${casela}/prontuario-ativo`,
  );

export const patchResidentProntuarioItem = (
  casela: string | number,
  body: {
    categoria: "medicamento" | "insumo";
    item_id: number;
    frequencia_aplicacao?: number | null;
    periodo_aplicacao?: string | null;
  },
) => stokioClient.patch(`/residentes/${casela}/prontuario-item`, body);

export const getResidentsCount = () => stokioClient.get("/residentes/count");
export const getCabinetsCount = () => stokioClient.get("/armarios/count");
export const getDrawersCount = () => stokioClient.get("/gavetas/count");

export const getDashboardSummary = (params?: { expiringDays?: number }) =>
  stokioClient.get<DashboardSummaryResponse>("/dashboard/summary", {
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
  stokioClient.get("/dashboard/expiring-items", {
    params: { days, page, limit },
  });

export type MedicineAbcBundleRow = {
  medicamento_id: number;
  nome: string;
  principio_ativo: string;
  qtd: number;
  share_of_total: number;
  cumulative_share: number;
  class: "A" | "B" | "C";
};

export type MedicineAbcBundleSection = {
  total_movimentado: number;
  rows: MedicineAbcBundleRow[];
};

export type AdminMedicineAbcBundleResponse = {
  period: { start: string; end: string };
  entrada: MedicineAbcBundleSection;
  saida: MedicineAbcBundleSection;
  transferencia: MedicineAbcBundleSection;
};

export const getAdminMedicineAbcBundle = (days?: number) =>
  stokioClient.get<AdminMedicineAbcBundleResponse>("/admin/medicine-abc", {
    params: days != null ? { days } : undefined,
  });

export type ComplianceAuditInsights = {
  created: number;
  updated: number;
  deleted: number;
  total: number;
  totalFiltered: number;
  events: Array<{
    id: number;
    user_id: number | null;
    method: string;
    path: string;
    operation_type: string;
    resource: string | null;
    status_code: number;
    duration_ms: number | null;
    created_at: string;
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
  }>;
};

export function getComplianceAuditEvents(params: {
  days?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  operationType?: string;
  resource?: string;
  userId?: number;
}) {
  return stokioClient.get<ComplianceAuditInsights>("/audit/events", {
    params: params as Record<string, unknown>,
  });
}

export function getComplianceLoginLog(params: {
  days?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  userId?: number;
  login?: string;
  success?: boolean;
}) {
  return stokioClient.get<{
    data: Array<{
      id: number;
      user_id: number | null;
      login: string;
      success: boolean;
      ip: string | null;
      user_agent: string | null;
      created_at: string | Date;
    }>;
    total: number;
    page: number;
    limit: number;
  }>("/audit/login-log", {
    params: params as Record<string, unknown>,
  });
}
export async function downloadComplianceCsv(
  kind: "events" | "login" | "movements",
  query: Record<string, string>,
): Promise<void> {
  const token = readBearerToken();
  if (!token) throw new Error("Sessão não encontrada.");
  const path =
    kind === "events"
      ? "/audit/export/events.csv"
      : kind === "login"
        ? "/audit/export/login-log.csv"
        : "/audit/export/movements.csv";
  const base = API_BASE_URL.replace(/\/$/, "");
  const url = new URL(base + path);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "Não foi possível gerar o ficheiro.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  let filename = "export.csv";
  const m = cd?.match(/filename="([^"]+)"/);
  if (m?.[1]) filename = m[1];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type { ConsumptionPeriodItem } from "@stokio/sdk";

export const getConsumptionByPeriod = (
  start: string,
  end: string,
  groupBy: "month" | "quarter" = "month",
): Promise<ConsumptionPeriodItem[]> =>
  stokioClient.movements.getConsumptionByPeriod(start, end, groupBy);

export type {
  ConsumptionByItemRow,
  ConsumptionByItemResponse,
} from "@stokio/sdk";

export const getConsumptionByItem = (
  start: string,
  end: string,
): Promise<ConsumptionByItemResponse> =>
  stokioClient.movements.getConsumptionByItem(start, end);

export const deleteResident = (casela: string | number) =>
  stokioClient.delete(`/residentes/${casela}`);

export const getReport = (
  type: string,
  casela?: number,
  params?: MovementsParams,
) =>
  stokioClient.reports.get(
    type,
    casela,
    params as Record<string, string | number | boolean | undefined>,
  );

export type ReportExportJobResponse = {
  jobId: string;
  workflowId: string;
  accepted: boolean;
};

export const createReportExportJob = (
  type: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<ReportExportJobResponse> =>
  stokioClient.post("/relatorios/jobs", undefined, {
    params: { type, ...params },
  });

export const getReportExportJob = (jobId: string) =>
  stokioClient.get(`/relatorios/jobs/${encodeURIComponent(jobId)}`);

export const downloadReportExportBlob = (jobId: string): Promise<Blob> =>
  stokioClient.get(`/relatorios/jobs/${encodeURIComponent(jobId)}/download`, {
    responseType: "blob",
  });

export const downloadReportExportXlsx = downloadReportExportBlob;

export { buildAdminExportParams } from "@stokio/sdk";

export async function waitForReportExportJob(jobId: string): Promise<void> {
  const startedAt = Date.now();
  while (true) {
    const j = (await getReportExportJob(jobId)) as {
      status?: string;
      error?: string | null;
    };
    const s = String(j?.status ?? "");
    if (s === "succeeded") return;
    if (s === "failed") {
      throw new Error(j?.error ?? "Falha ao gerar exportação");
    }
    if (Date.now() - startedAt > 5 * 60_000) {
      throw new Error("Geração demorando demais. Tente novamente.");
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

export async function downloadAdminExportCSV(
  queryParams: Record<string, string>,
): Promise<void> {
  try {
    const job = await createReportExportJob(queryParams.type || "export", {
      ...queryParams,
      format: "csv",
    });
    await waitForReportExportJob(job.jobId);
    const blob = await downloadReportExportBlob(job.jobId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-${queryParams.type || "relatorio"}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    const err = new Error("Erro ao exportar");
    reportClientError(e ?? err, {
      httpMethod: "GET",
      httpPath: "/admin/export",
      context: { adminExportCsv: true },
    });
    throw err;
  }
}

export const getTransferReport = () => stokioClient.reports.transferencias();

export const getDailyMovementsReport = () =>
  stokioClient.reports.movimentosDia();

export const listPublicTenants = (params?: { q?: string; limit?: number }) =>
  stokioClient.public.listTenants(params);

export type { PublicAppConfigResponse } from "@stokio/sdk";

export const fetchPublicAppConfig = () => stokioClient.public.appConfig();

export async function fetchPublicTenantBrandingIfExists(
  slug: string,
): Promise<PublicTenantBranding | null> {
  const s = slug.trim();
  if (!s) return null;
  const path = `/tenants/${encodeURIComponent(s)}/branding`;
  try {
    const data = await stokioClient.get<{
      found: boolean;
      slug?: string;
      name?: string;
      brandName?: string | null;
      logoUrl?: string | null;
      contractCodeMandatory?: boolean;
    }>(`/tenants/${encodeURIComponent(s)}/branding`);
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
  } catch (err) {
    reportClientError(err, {
      severity: "warning",
      httpMethod: "GET",
      httpPath: path,
      context: { fetchPublicBranding: true },
    });
    return null;
  }
}

export const login = (loginStr: string, password: string, tenantSlug: string) =>
  stokioClient.auth.login(loginStr, password, tenantSlug);

export async function fetchLoginTenantsForEmail(
  login: string,
): Promise<LoginTenantSummary[]> {
  const trimmed = login.trim();
  if (!trimmed) return [];
  let data: { tenants?: unknown[] } | null;
  try {
    data = await stokioClient.get<{ tenants?: unknown[] }>(
      "/login/tenants-for-email",
      { params: { login: trimmed } },
    );
  } catch (err) {
    const status = err instanceof StokioApiError ? err.httpStatus : undefined;
    if (status != null && status >= 500) {
      reportClientError(new Error(`login/tenants-for-email failed`), {
        httpMethod: "GET",
        httpPath: "/login/tenants-for-email",
        httpStatus: status,
      });
    }
    return [];
  }
  const raw = Array.isArray(data?.tenants) ? data.tenants : [];
  return raw
    .map((t: unknown) => {
      if (!t || typeof t !== "object") return null;
      const row = t as Record<string, unknown>;
      const slug = String(row.slug ?? "").trim();
      if (!slug) return null;
      const label = String(row.label ?? "").trim() || slug;
      const tenantName = String(row.tenantName ?? "").trim() || label;
      const bn = row.brandName != null ? String(row.brandName).trim() : "";
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

  try {
    const data = await stokioClient.get<{ slug?: string }>(
      "/login/resolve-tenant",
      { params: { login: trimmed } },
    );
    if (data && typeof data.slug === "string" && data.slug.trim()) {
      return { ok: true, slug: data.slug.trim() };
    }
    return { ok: false, reason: "not_found" };
  } catch (err) {
    if (err instanceof StokioApiError && err.httpStatus === 409) {
      const body = err.responseBody as { tenants?: LoginTenantSummary[] };
      if (body?.tenants && Array.isArray(body.tenants)) {
        return {
          ok: false,
          reason: "ambiguous",
          tenants: body.tenants,
        };
      }
    }
    if (
      err instanceof StokioApiError &&
      err.httpStatus != null &&
      err.httpStatus >= 500
    ) {
      reportClientError(new Error(`login/resolve-tenant ${err.httpStatus}`), {
        httpMethod: "GET",
        httpPath: "/login/resolve-tenant",
        httpStatus: err.httpStatus,
      });
    }
    return { ok: false, reason: "not_found" };
  }
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
  stokioClient.get<CurrentUserResponse>("/login/usuario-logado");

export type DisplayConfigResponse = {
  uiDisplay: {
    casela: "numero" | "nome";
    caselaSetor: "farmacia" | "enfermagem" | "todos";
    armario: "numero" | "categoria";
    gaveta: "numero" | "categoria";
  };
};

export const getDisplayConfig = (): Promise<DisplayConfigResponse> =>
  stokioClient.get<DisplayConfigResponse>("/login/display-config");

export const register = (
  login: string,
  password: string,
  firstName: string,
  lastName: string,
  tenantSlug: string,
  contractCode?: string,
) =>
  stokioClient.post(
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
  stokioClient.post<RegisterAccountResponse>("/login/register-account", {
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
  return stokioClient.post<RegisterUserResponse>("/login/register-user", {
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
  stokioClient.post<RegisterUserResponse>("/login/join-by-token", payload);

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
}): Promise<CreateTenantInviteResponse> =>
  stokioClient.post("/tenant/invites", payload);

export type VerifyContractCodeResponse = {
  valid: boolean;
  contractCodeRequired?: boolean;
  reason?: "missing" | "mismatch" | "no_canonical_tenant";

  canonicalSlug?: string;
};

export const verifyTenantContractCode = (
  tenantSlug: string,
  contractCode: string,
) => stokioClient.public.verifyTenantContractCode(tenantSlug, contractCode);

export const verifySignupContractCode = (
  contractCode: string,
  signupEmail?: string,
) => stokioClient.public.verifySignupContractCode(contractCode, signupEmail);

export const adminSetTenantContractCodeBySlug = (
  slug: string,
  payload:
    | { contract_code: string; bound_login: string }
    | { clear_contract_code: true },
) => stokioClient.admin.setTenantContractCodeBySlug(slug, payload);

export const updateInput = (id: number, data: Record<string, unknown>) =>
  stokioClient.put(`/insumos/${id}`, data);

export const updateCabinet = (id: number, data: Record<string, unknown>) =>
  stokioClient.put(`/armarios/${id}`, data);

export const updateMedicine = (id: number, data: Record<string, unknown>) =>
  stokioClient.put(`/medicamentos/${id}`, data);

/** Redefinição sem sessão (página Esqueci a senha). */
export const resetPassword = (login: string, newPassword: string) =>
  stokioClient.post(`/login/forgot-password`, { login, newPassword });

export const updateResident = (
  casela: string | number,
  data: Record<string, unknown>,
) => stokioClient.put(`/residentes/${casela}`, data);

export const updateUser = (
  payload: UpdateUserPayload,
): Promise<UpdateUserResponse> => stokioClient.put("/login", payload);

export const createCabinet = (numero: number, categoria_id: number) =>
  stokioClient.post("/armarios", { numero, categoria_id });

export const createInput = (
  nome: string,
  descricao?: string,
  estoque_minimo?: number,
  preco?: number | null,
) =>
  stokioClient.post("/insumos", {
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
  stokioClient.post("/medicamentos", {
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
  cpf?: string | null,
) =>
  stokioClient.post("/residentes", {
    nome,
    casela: parseInt(casela),
    ...(cpf != null && String(cpf).trim() !== "" ? { cpf } : {}),
    ...(data_nascimento != null && String(data_nascimento).trim() !== ""
      ? { data_nascimento: String(data_nascimento).trim() }
      : {}),
  });

export const createStockOut = (payload: {
  estoqueId: number;
  tipo: OperationType;
  quantidade: number;
}) => stokioClient.post("/estoque/saida", payload);

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
}) => stokioClient.post("/estoque/entrada", payload);

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
}) => stokioClient.post("/movimentacoes", payload);

export const createNotificationEvent = (payload: {
  medicamento_id: number;
  residente_id: number;
  destino: NotificationDestiny;
  data_prevista: Date;
  criado_por: number;
  tipo_evento: string;
  status?: EventStatus;
  visto?: boolean;
}) => {
  const d =
    payload.data_prevista instanceof Date ? payload.data_prevista : null;
  const dateOnly = d ? d.toISOString().slice(0, 10) : "";
  return stokioClient.post("/notificacao", {
    medicamento_id: payload.medicamento_id,
    residente_id: payload.residente_id,
    destino: payload.destino,
    data_prevista: dateOnly,
    criado_por: payload.criado_por,
    visto: payload.visto ?? false,
    tipo_evento: payload.tipo_evento,
  });
};

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
    const res = await stokioClient.notifications.list({
      page,
      limit,
      type,
      status,
      date,
      residente_nome,
      visto,
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
) => stokioClient.patch(`/notificacao/${id}`, data);

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
) => {
  const out: Record<string, unknown> = { ...data };
  if (data.data_prevista instanceof Date) {
    out.data_prevista = data.data_prevista.toISOString().slice(0, 10);
  }
  return stokioClient.patch(`/notificacao/${id}`, out);
};

const REMINDER_PAGE_SIZE = 100;
const REMINDER_MAX_PAGES = 80;

/**
 * Carrega todas as notificações que combinam com o filtro (paginando),
 * para lembretes no login não cortarem itens após "OK" + refresh.
 */
async function fetchAllNotificationsMatching(
  base: Omit<Parameters<typeof getNotifications>[0], "page" | "limit">,
): Promise<{
  items: Awaited<ReturnType<typeof getNotifications>>["items"];
}> {
  const acc: Awaited<ReturnType<typeof getNotifications>>["items"] = [];
  for (let page = 1; page <= REMINDER_MAX_PAGES; page++) {
    const res = await getNotifications({
      ...base,
      page,
      limit: REMINDER_PAGE_SIZE,
    });
    acc.push(...res.items);
    if (!res.hasNext || res.items.length === 0) break;
  }
  return { items: acc };
}

export const getTodayMedicineNotifications = async () => {
  const { items } = await fetchAllNotificationsMatching({
    type: "medicamento",
    date: "today",
    status: EventStatus.PENDENTE,
    visto: false,
  });
  return { items, total: items.length, hasNext: false };
};

export const getTomorrowReplacementNotifications = async () => {
  const { items } = await fetchAllNotificationsMatching({
    type: "reposicao_estoque",
    date: "tomorrow",
    status: EventStatus.PENDENTE,
    visto: false,
  });
  return {
    items: items as StockReplacementItem[],
    total: items.length,
    hasNext: false,
  };
};

export const getStockFilterOptions = () =>
  stokioClient.get<{ cabinets: number[]; caselas: number[]; lots: string[] }>(
    "/estoque/filter-options",
  );

export const getStock = (
  page = 1,
  limit = 6,
  filters?: Record<string, unknown>,
  extraFilter?: string | null,
) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters) {
    if (filters.type != null) params.append("type", String(filters.type));
    if (filters.name != null) params.append("name", String(filters.name));
    if (filters.activeSubstance)
      params.append("activeSubstance", String(filters.activeSubstance));
    if (filters.cabinet != null)
      params.append("cabinet", String(filters.cabinet));
    if (filters.drawer != null) params.append("drawer", String(filters.drawer));
    if (filters.casela != null) params.append("casela", String(filters.casela));
    if (filters.origin != null) params.append("origin", String(filters.origin));
    if (filters.sector != null) params.append("sector", String(filters.sector));
    if (filters.lot != null) params.append("lot", String(filters.lot));
    if (filters.itemType != null)
      params.append("itemType", String(filters.itemType));
    if (filters.stockType != null)
      params.append("stockType", String(filters.stockType));
    if (filters.onlyInStock === true || filters.onlyInStock === "true") {
      params.append("onlyInStock", "true");
    }
  }

  if (extraFilter) {
    params.append("filter", extraFilter);
  }

  return stokioClient.get<PaginatedResponse<StockItemRaw>>(
    `/estoque?${params.toString()}`,
  );
};

export const getCabinetCategories = (page = 1, limit = 5) =>
  stokioClient.get<PaginatedResponse<{ id: number; nome: string }>>(
    "/categoria-armario",
    {
      params: { page, limit },
    },
  );

export const createCabinetCategory = (nome: string) =>
  stokioClient.post("/categoria-armario", { nome });

export const getMedicineRanking = (
  type: "more" | "less",
  page = 1,
  limit = 10,
) =>
  stokioClient.get("/movimentacoes/medicamentos/ranking", {
    params: { type, page, limit },
  });

export const getDrawers = (page = 1, limit = 10) =>
  stokioClient.get<PaginatedResponse<Drawer>>("/gavetas", {
    params: { page, limit },
  });

export const getDrawerByNumber = (numero: number) =>
  stokioClient.get(`/gavetas/${numero}`);

export const createDrawer = (numero: number, categoria_id: number) =>
  stokioClient.post("/gavetas", { numero, categoria_id });

export const updateDrawer = (numero: number, categoria_id: number) =>
  stokioClient.put(`/gavetas/${numero}`, { categoria_id });

export const deleteDrawer = (numero: number) =>
  stokioClient.delete(`/gavetas/${numero}`);

export const getDrawerCategories = (page = 1, limit = 10) =>
  stokioClient.get<PaginatedResponse<DrawerCategory>>("/categoria-gaveta", {
    params: { page, limit },
  });

export const getDrawerCategoryById = (id: number) =>
  stokioClient.get(`/categoria-gaveta/${id}`);

export const createDrawerCategory = (nome: string) =>
  stokioClient.post("/categoria-gaveta", { nome });

export const updateDrawerCategory = (id: number, nome: string) =>
  stokioClient.put(`/categoria-gaveta/${id}`, { nome });

export const deleteDrawerCategory = (id: number) =>
  stokioClient.delete(`/categoria-gaveta/${id}`);

export const removeIndividualMedicineFromStock = (stockId: number) =>
  stokioClient.patch(`/estoque/medicamento/${stockId}/remover-individual`);

export const getDaysForReplacementForNursing = (
  medicamentoId: number,
  caselaId: number,
) =>
  stokioClient.get("/estoque/medicamento/dias-para-repor", {
    params: { medicamento_id: medicamentoId, casela_id: caselaId },
  });

export const suspendMedicineFromStock = (stockId: number) =>
  stokioClient.patch(`/estoque/medicamento/${stockId}/suspender`);

export const resumeMedicineFromStock = (stockId: number) =>
  stokioClient.patch(`/estoque/medicamento/${stockId}/retomar`);

export const removeIndividualInputFromStock = (stockId: number) =>
  stokioClient.patch(`/estoque/insumo/${stockId}/remover-individual`);

export const suspendInputFromStock = (stockId: number) =>
  stokioClient.patch(`/estoque/insumo/${stockId}/suspender`);

export const resumeInputFromStock = (stockId: number) =>
  stokioClient.patch(`/estoque/insumo/${stockId}/retomar`);

export const deleteStockItem = (stockId: number, type: StockItemType) =>
  stokioClient.delete(`/estoque/${type}/${stockId}`);

export const transferStockSector = (payload: {
  estoque_id: number;
  setor: string;
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
  return stokioClient.patch(
    `${basePath}/${payload.estoque_id}/transferir-setor`,
    {
      setor: payload.setor,
      quantidade: payload.quantidade,
      casela_id: payload.casela_id,
      destino: payload.destino,
      observacao: payload.observacao,
      bypassCasela: payload.bypassCasela,
      dias_para_repor: payload.dias_para_repor,
    },
  );
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
  return stokioClient.put(`/estoque/${estoqueId}`, {
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
  stokioClient.get<HealthCheckResponse>("/health");

export const logoutRequest = () => stokioClient.post("/login/logout");

export const getTenantConfig = () =>
  stokioClient.get<TenantConfigResponse>("/tenant/config");

export const dismissTenantOnboarding = () =>
  stokioClient.post<{
    tenantId: number;
    tenant: TenantConfigResponse["tenant"];
    alreadyComplete?: boolean;
  }>("/tenant/onboarding/dismiss", {});

export type AccessibleTenantRow = {
  id: number;
  slug: string;
  name: string;
  brandName: string | null;
  isPrimary: boolean;
};

export type AccessibleTenantsResponse = {
  tenants: AccessibleTenantRow[];
};

export const listAccessibleTenants = () =>
  stokioClient.get<AccessibleTenantsResponse>("/tenant/accessible-tenants");

export async function grantTenantMembership(targetLoginId: number) {
  return stokioClient.post<{ ok: boolean }>("/tenant/memberships", {
    targetLoginId,
  });
}

export type InterTenantMedicineTransferPayload = {
  tipo_item?: "medicamento" | "insumo";
  destTenantSlug: string;
  sourceEstoqueId: number;
  destMedicamentoId?: number;
  destInsumoId?: number;
  quantidade: number;
  validade?: string;
  destTipo: string;
  destSetor?: string;
  destCaselaId?: number | null;
  destArmarioId?: number | null;
  destGavetaId?: number | null;
  destLote?: string | null;
};

export const transferMedicineInterTenant = (
  payload: InterTenantMedicineTransferPayload,
) =>
  stokioClient.post<{ correlationId: string }>(
    "/estoque/transferencia-inter-abrigo",
    payload,
  );

export type InterTenantMovementRow = {
  id: number;
  data: string;
  tipo: string;
  quantidade: number;
  medicamento_id: number | null;
  insumo_id: number | null;
  observacao: string | null;
  setor: string;
  armario_id: number | null;
  gaveta_id: number | null;
  lote: string | null;
};

export const listInterTenantMovements = (params?: {
  page?: number;
  limit?: number;
}) =>
  stokioClient.get<{
    data: InterTenantMovementRow[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }>("/movimentacoes/inter-tenant", { params });

export type UpdateTenantModulesPayload = {
  enabled: string[];
  automatic_price_search?: boolean;
  automatic_reposicao_notifications?: boolean;
  enabled_sectors?: string[];
};

export const updateTenantConfig = (modules: UpdateTenantModulesPayload) =>
  stokioClient.put<{ tenantId: number; modules: UpdateTenantModulesPayload }>(
    "/tenant/config",
    { modules },
  );

export type ForceTenantPriceBackfillResponse = {
  accepted?: boolean;
  acceptedAtMs?: number;
  workflowId?: string;
  requestId?: string;
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
  queueLength?: number;
  currentRequestId?: string | null;
  workflowId?: string;
};

export const forceTenantPriceBackfill = () =>
  stokioClient.post<ForceTenantPriceBackfillResponse>(
    "/tenant/price-backfill/run",
  );

export const getTenantPriceBackfillStatus = () =>
  stokioClient.get<TenantPriceBackfillStatusResponse>(
    "/tenant/price-backfill/status",
  );

export const updateTenantBranding = (payload: UpdateTenantBrandingPayload) =>
  stokioClient.put<{
    tenantId: number;
    tenant: TenantConfigResponse["tenant"];
  }>("/tenant/branding", payload);

export const setTenantContractCode = (
  contractCode: string,
  boundLogin: string,
) =>
  stokioClient.put<{
    ok: true;
    migrated?: boolean;
    tenantId?: number;
    tenantSlug?: string;
  }>("/tenant/contract-code", {
    contract_code: contractCode,
    bound_login: boundLogin.trim(),
  });

export const claimTenantContractCode = (
  contractCode: string,
  boundLogin: string,
) =>
  stokioClient.post<{
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
  stokioClient.get<{ data: TenantSetorRow[] }>("/tenant/setores");

export type CreateTenantSetorPayload = {
  key?: string;
  nome: string;
  proportionProfile?: "farmacia" | "enfermagem";
};

export const listTenantSetoresInTenantContext = (tenantSlug: string) =>
  stokioClient.get<{ data: TenantSetorRow[] }>("/tenant/setores", {
    headers: { "X-Tenant": tenantSlug.trim() },
  });

export const createTenantSetor = (payload: CreateTenantSetorPayload) =>
  stokioClient.post<TenantSetorRow>("/tenant/setores", payload);

export type TenantSetorStockTypesResponse = {
  setorId: number;
  stockTypes: Array<
    "geral" | "individual" | "carrinho_emergencia" | "carrinho_psicotropicos"
  >;
};

export const getTenantSetorStockTypes = (setorId: number) =>
  stokioClient.get<TenantSetorStockTypesResponse>(
    `/tenant/setores/${setorId}/stock-types`,
  );

export const updateTenantSetorStockTypes = (
  setorId: number,
  stockTypes: TenantSetorStockTypesResponse["stockTypes"],
) =>
  stokioClient.put<TenantSetorStockTypesResponse>(
    `/tenant/setores/${setorId}/stock-types`,
    { stockTypes },
  );

export const getAdminUsers = (params?: { page?: number; limit?: number }) =>
  stokioClient.get("/admin/users", { params: params ?? {} });

export type MedicalRecordExportJobRow = {
  id: string;
  createdAt: string;
  finishedAt: string | null;
  status: string;
  casela: string;
  format: string;
  actorUserId: number;
  actorLogin: string | null;
  actorDisplayName: string | null;
  error: string | null;
  downloadCount: number;
  lastDownloadAt: string | null;
};
export type MedicalRecordVersionRow = {
  versionIndex: number;
  jobId: string;
  format: string;
  generatedAt: string;
  downloadCount: number;
  lastDownloadAt: string | null;
  actorUserId: number;
  actorLogin: string | null;
  actorDisplayName: string | null;
};

export type MedicalRecordExportAvailableRow = {
  residentId: string;
  casela: string;
  caselaNum: number;
  residentName: string;
  medicineStockLines: number;
  inputStockLines: number;
  jobId: string | null;
  format: string | null;
  generatedAt: string | null;
  downloadCount: number;
  lastDownloadAt: string | null;
  actorUserId: number | null;
  actorLogin: string | null;
  actorDisplayName: string | null;
  versions: MedicalRecordVersionRow[];
};

export type MedicalRecordExportAvailableResponse = {
  data: MedicalRecordExportAvailableRow[];
};

export type MedicalRecordExportJobsResponse = {
  data: MedicalRecordExportJobRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  truncated?: boolean;
};

export const fetchAdminMedicalRecordExportJobs = (params?: {
  page?: number;
  limit?: number;
  casela?: string;
}) =>
  stokioClient.get<MedicalRecordExportJobsResponse>(
    "/admin/medical-record-export-jobs",
    { params: params ?? {} },
  );

export const fetchAdminMedicalRecordExportAvailable = () =>
  stokioClient.get<MedicalRecordExportAvailableResponse>(
    "/admin/medical-record-export-available",
  );

export type CreateAdminUserPayload = {
  login: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "user";

  permissions?:
    | UserPermissions
    | import("@/domain/permission-matrix.types").PermissionMatrixV2Stored;
};

export const createAdminUser = (data: CreateAdminUserPayload) =>
  stokioClient.post("/admin/users", data);

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
) => stokioClient.put(`/admin/users/${id}`, data);

export const deleteAdminUser = (id: number) =>
  stokioClient.delete(`/admin/users/${id}`);

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
  stokioClient.get<AdminLoginLogResponse>("/admin/login-log", {
    params: params ?? {},
  });

export type AdminMetricsResponse = {
  movementsThisMonth: number;
  activeUsersThisMonth: number;
};

export const getAdminMetrics = () =>
  stokioClient.get<AdminMetricsResponse>("/admin/metrics");

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
  stokioClient.get<AdminActiveUsersThisMonthResponse>(
    "/admin/metrics/active-users",
    {
      params: params ?? {},
    },
  );

export const getAdminMovementsThisMonth = (params?: {
  page?: number;
  limit?: number;
}) =>
  stokioClient.get<{
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
  stokioClient.get<AdminHealthResponse>("/admin/health");

export type AdminBackupStatusResponse = {
  lastBackupAt: string | null;
  lastBackupStatus: string | null;
  lastBackupDurationMs: number | null;
  lastBackupSizeBytes: number | null;
  lastBackupError: string | null;
  retentionCount: number | null;
};

export const getAdminBackupStatus = () =>
  stokioClient.get<AdminBackupStatusResponse>("/admin/backup/status");

export const runAdminBackupNow = () =>
  stokioClient.post("/admin/backup/run", {});

export type AdminDataQualitySummary = {
  negativeStock: { medicines: number; inputs: number };
  missingLot: { medicines: number; inputs: number };
  orphanMovements: number;
};

export const getAdminDataQualitySummary = () =>
  stokioClient.get<AdminDataQualitySummary>("/admin/data-quality/summary");

export const getAdminInconsistencies = (params: {
  type: "negative_stock" | "missing_lot" | "orphan_movements";
  page?: number;
  limit?: number;
}) => stokioClient.get("/admin/data-quality/inconsistencies", { params });

export const getAdminMedicineDuplicates = (params?: {
  page?: number;
  limit?: number;
}) =>
  stokioClient.get("/admin/data-quality/medicine-duplicates", {
    params: params ?? {},
  });

export const mergeAdminMedicines = (payload: {
  keepId: number;
  mergeIds: number[];
}) => stokioClient.post("/admin/data-quality/merge-medicines", payload);

export const normalizeAdminMedicineUnits = (payload?: { dryRun?: boolean }) =>
  stokioClient.post(
    "/admin/data-quality/normalize-medicine-units",
    payload ?? {},
  );

export type AdminSystemConfig = Record<string, string>;

export type AdminScheduledBackupConfig = {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
};

export type AdminConfigApiResponse = {
  display: AdminSystemConfig;
  system: {
    scheduledBackup: AdminScheduledBackupConfig;
  } | null;
};

export type AdminConfigPutBody = {
  display?: AdminSystemConfig;
  system?: { scheduledBackup?: AdminScheduledBackupConfig };
};

export const getAdminConfig = () =>
  stokioClient.get<AdminConfigApiResponse>("/admin/config");

export const updateAdminConfig = (body: AdminConfigPutBody) =>
  stokioClient.put<AdminConfigApiResponse>("/admin/config", body);

export type {
  AdminTenant,
  AdminTenantsResponse,
  RestoreBackupResponse,
  AdminNotificationsResponse,
} from "@stokio/sdk";

export type { AdminNotificationItem } from "@stokio/sdk";

export const getAdminTenants = (params?: { page?: number; limit?: number }) =>
  stokioClient.admin.tenants.list(params);
export const createAdminTenant = (data: {
  slug: string;
  name: string;
  contract_code?: string;
}) => stokioClient.admin.tenants.create(data);
export const updateAdminTenant = (
  id: number,
  data: Partial<{ slug: string; name: string; contract_code?: string }>,
) => stokioClient.admin.tenants.update(id, data);
export const deleteAdminTenant = (id: number) =>
  stokioClient.admin.tenants.remove(id);

export const getAdminTenantConfig = (id: number) =>
  stokioClient.admin.tenants.getConfig(id);
export const setAdminTenantConfig = (
  id: number,
  modules: { enabled: string[] },
) => stokioClient.admin.tenants.setConfig(id, modules);

export const restoreBackup = (file: File) =>
  stokioClient.admin.restoreBackup(file);

export const getAdminNotifications = (params?: {
  page?: number;
  limit?: number;
  tipo?: string;
  status?: string;
  visto?: boolean;
}) => stokioClient.admin.notifications.list(params);

export const patchAdminNotification = (
  id: number,
  data: { visto?: boolean; status?: string },
) => stokioClient.admin.notifications.patch(id, data);

export const getAdminInsights = (params?: {
  days?: number;
  limit?: number;
  page?: number;
  operationType?: "create" | "update" | "delete";
  resource?: string;
  userId?: number;
}) =>
  stokioClient.get<AdminInsightsResponse>("/admin/insights", {
    params: params ?? {},
  });

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
}> => stokioClient.get("/admin/stock-history", { params });
