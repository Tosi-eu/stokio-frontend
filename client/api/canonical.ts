export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001/api/v1" : "");

if (!API_BASE_URL) {
  console.warn(
    "⚠️ API_BASE_URL environment variable is not set.",
    "\nFor Docker builds, set VITE_API_BASE_URL in docker-compose.yml build args or .env file.",
    "\nFor local builds, set VITE_API_BASE_URL in frontend/.env file.",
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

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return "";

  try {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            searchParams.append(key, String(item));
          });
        } else {
          const sanitizedKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "");
          if (sanitizedKey) {
            searchParams.append(sanitizedKey, String(value));
          }
        }
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
  } catch (error) {
    console.error("Error building query string:", error);
    return "";
  }
}

function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return "Ocorreu um erro. Por favor, tente novamente.";
  }

  const safeBusinessMessages = [
    /já existe.*medicamento/i,
    /já existe.*insumo/i,
    /combinação.*nome.*princípio/i,
    /campos obrigatórios/i,
    /quantidade.*inválida/i,
    /casela.*obrigatória/i,
    /usuário não autenticado/i,
    /não encontrado/i,
    /credenciais inválidas/i,
  ];

  if (safeBusinessMessages.some((pattern) => pattern.test(message))) {
    return message.trim();
  }

  const sensitivePatterns = [
    /database/i,
    /sql/i,
    /query/i,
    /connection/i,
    /postgres/i,
    /mysql/i,
    /mongodb/i,
    /sequelize/i,
    /prisma/i,
    /orm/i,
    /password/i,
    /token/i,
    /secret/i,
    /api[_-]?key/i,
    /credential/i,
    /bearer/i,
    /jwt/i,
    /session/i,
    /file[_-]?path/i,
    /directory/i,
    /\.env/i,
    /config/i,
    /stack[_-]?trace/i,
    /error[_-]?code/i,
    /exception/i,
    /at\s+\w+\.\w+/i,
    /line\s+\d+/i,
    /column\s+\d+/i,
    /host/i,
    /port/i,
    /endpoint/i,
    /url/i,
    /uri/i,
    /process\.env/i,
    /environment/i,
    /os/i,
    /platform/i,
  ];

  if (sensitivePatterns.some((pattern) => pattern.test(message))) {
    return "Ocorreu um erro. Por favor, tente novamente.";
  }

  const cleanedMessage = message
    .split("\n")[0]
    .replace(/at\s+.*/gi, "")
    .replace(/\(.*\)/g, "")
    .trim();

  const maxLength = 150;
  if (cleanedMessage.length > maxLength) {
    return cleanedMessage.substring(0, maxLength) + "...";
  }

  if (cleanedMessage.length < 3) {
    return "Ocorreu um erro. Por favor, tente novamente.";
  }

  return cleanedMessage;
}

async function request(
  path: string,
  options: RequestInit & { body?: unknown } = {},
) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: isFormData
      ? { ...(options.headers as HeadersInit) }
      : {
          "Content-Type": "application/json",
          ...(options.headers as HeadersInit),
        },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const rawMsg = data?.error || data?.message || "Erro inesperado";
    const messageStr = String(rawMsg).toLowerCase();

    if (res?.status === 401) {
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
        sessionStorage.removeItem("user");
        throw new InvalidSessionError("Sessão inválida");
      }
    }

    if (res?.status === 403) {
      window.dispatchEvent(
        new CustomEvent("insufficient-privileges", {
          detail: {
            message: data?.error || rawMsg || INSUFFICIENT_PRIVILEGES_MESSAGE,
          },
        }),
      );
      throw new Error(data?.error || rawMsg || INSUFFICIENT_PRIVILEGES_MESSAGE);
    }

    const sanitizedMsg = sanitizeErrorMessage(String(rawMsg));
    throw new Error(sanitizedMsg);
  }

  return data;
}

export const api = {
  get: <T = unknown>(
    path: string,
    options?: { params?: Record<string, unknown> },
  ) =>
    request(`${path}${buildQueryString(options?.params)}`, {
      method: "GET",
    }) as Promise<T>,

  post: (path: string, body?: unknown, options?: RequestInit) =>
    request(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  put: (path: string, body?: any) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),

  patch: (path: string, body?: any) =>
    request(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (path: string, body?: any) =>
    request(path, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
