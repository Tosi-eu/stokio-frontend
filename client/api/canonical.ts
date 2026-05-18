import { createStokioClient, StokioApiError } from "@stokio/sdk";
import { readActiveTenantSlug } from "@/helpers/active-tenant-slug.helper";
import { readPreviewModeFromStorage } from "@/helpers/preview-mode-storage";
import { sanitizeUserFacingMessage } from "@/helpers/user-facing-error.helper";
import { reportClientError } from "@/helpers/error-report.helper";
import { toast } from "@/hooks/use-toast.hook";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/v1"
    : "");

if (!API_BASE_URL) {
  console.warn(
    "⚠️ API_BASE_URL environment variable is not set.",
    "\nFor Docker builds, set NEXT_PUBLIC_API_BASE_URL in build args or .env file.",
    "\nFor local builds, set NEXT_PUBLIC_API_BASE_URL in frontend/.env file.",
  );
}

const INSUFFICIENT_PRIVILEGES_MESSAGE =
  "Você não tem os privilégios necessários. Contate o administrador.";

export class InvalidSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSessionError";
  }
}

/** Session uses HttpOnly cookie; Bearer header is not sent from the web client. */
export function readBearerToken(): string | null {
  return null;
}

const PREVIEW_MUTATION_ALLOW_PREFIXES = [
  "/login/authenticate",
  "/login/logout",
  "/login/register-account",
  "/login/register-user",
  "/login/join-by-token",
  "/login/forgot-password",
  "/login/reset-password",
  "/tenant/",
];

function isMutationAllowedInPreviewMode(path: string, method: string): boolean {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return true;
  if (m === "POST" && path.includes("/verify-contract-code")) return true;
  return PREVIEW_MUTATION_ALLOW_PREFIXES.some((p) => path.startsWith(p));
}

function handleHttpError(err: StokioApiError): never {
  const rawMsg = err.messageRaw;
  const messageStr = String(rawMsg).toLowerCase();
  const method = err.httpMethod;
  const path = err.httpPath;
  const data = err.responseBody as { error?: string; message?: string } | null;

  if (err.httpStatus === 401) {
    if (messageStr.includes("api key")) {
      const e = new Error(String(rawMsg));
      reportClientError(e, {
        category: "auth",
        severity: "warning",
        httpMethod: method,
        httpPath: path,
        httpStatus: 401,
      });
      throw e;
    }
    const isAuthError =
      messageStr.includes("invalidation") ||
      messageStr.includes("invalid session") ||
      messageStr.includes("sessão inválida") ||
      messageStr.includes("token inválido") ||
      messageStr.includes("invalid token") ||
      messageStr.includes("unauthorized") ||
      messageStr.includes("não autorizado") ||
      messageStr.includes("authentication") ||
      messageStr.includes("autenticação");

    if (isAuthError) {
      window.dispatchEvent(new CustomEvent("invalid-session"));
      const sessErr = new InvalidSessionError("Sessão inválida");
      reportClientError(sessErr, {
        category: "auth",
        severity: "warning",
        httpMethod: method,
        httpPath: path,
        httpStatus: 401,
      });
      throw sessErr;
    }
  }

  if (err.httpStatus === 403) {
    const dataObj =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    const bodyCode =
      dataObj && typeof dataObj.code === "string" ? dataObj.code.trim() : "";
    const errorText =
      dataObj && typeof dataObj.error === "string" ? dataObj.error.trim() : "";
    const isModuleDisabled =
      bodyCode === "MODULE_DISABLED" ||
      errorText.includes("Módulo desabilitado");

    if (!err.silentInsufficientPrivileges && !isModuleDisabled) {
      window.dispatchEvent(
        new CustomEvent("insufficient-privileges", {
          detail: {
            message:
              (dataObj && typeof dataObj.error === "string"
                ? dataObj.error
                : null) ||
              rawMsg ||
              INSUFFICIENT_PRIVILEGES_MESSAGE,
          },
        }),
      );
    }
    const forbidden = new Error(
      (dataObj && typeof dataObj.error === "string" ? dataObj.error : null) ||
        rawMsg ||
        INSUFFICIENT_PRIVILEGES_MESSAGE,
    );
    reportClientError(forbidden, {
      category: "auth",
      severity: "warning",
      httpMethod: method,
      httpPath: path,
      httpStatus: 403,
    });
    throw forbidden;
  }

  const sanitizedMsg = sanitizeUserFacingMessage(String(rawMsg));
  const apiErr = new Error(sanitizedMsg);
  reportClientError(apiErr, {
    category: err.httpStatus >= 500 ? "integration" : "validation",
    severity: err.httpStatus >= 500 ? "error" : "warning",
    httpMethod: method,
    httpPath: path,
    httpStatus: err.httpStatus,
    context: { apiResponse: true },
  });
  throw apiErr;
}

export const stokioClient = createStokioClient({
  baseUrl: API_BASE_URL,
  getToken: readBearerToken,
  getExtraHeaders: () => {
    const slug = readActiveTenantSlug();
    if (slug && slug.trim()) {
      return { "X-Tenant": slug.trim() };
    }
    return {};
  },
  onBeforeRequest: async ({ path, method, body }) => {
    const m = method.toUpperCase();
    if (
      readPreviewModeFromStorage() &&
      !isMutationAllowedInPreviewMode(path, m)
    ) {
      toast({
        title: "Modo de visualização",
        description:
          "Alterações não estão disponíveis enquanto explora o sistema. Conclua a configuração do abrigo para utilizar todas as funções.",
        variant: "warning",
        duration: 4500,
      });
      const previewErr = new Error(
        "Modo de visualização: alterações indisponíveis.",
      );
      reportClientError(previewErr, {
        category: "validation",
        severity: "warning",
        httpMethod: m,
        httpPath: path,
        context: { previewMode: true },
      });
      throw previewErr;
    }
    void body;
  },
  onHttpError: handleHttpError,
});

export const api = {
  get: stokioClient.get.bind(stokioClient) as typeof stokioClient.get,
  post: stokioClient.post.bind(stokioClient) as typeof stokioClient.post,
  put: stokioClient.put.bind(stokioClient) as typeof stokioClient.put,
  patch: stokioClient.patch.bind(stokioClient) as typeof stokioClient.patch,
  delete: stokioClient.delete.bind(stokioClient) as typeof stokioClient.delete,
};
