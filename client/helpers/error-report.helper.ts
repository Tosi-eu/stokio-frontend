import {
  toCanonicalError,
  type CanonicalErrorPayload,
  type ToCanonicalDefaults,
} from "@stokio/sdk";

function resolveApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001/api/v1"
      : "")
  );
}

function readBearerTokenSafe(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = sessionStorage.getItem("authToken");
    return token && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
}

/** Envia payload canónico para ingestão no backend (cookies + Bearer). Ignora falhas. */
export function reportCanonicalClientError(
  payload: CanonicalErrorPayload,
): void {
  const base = resolveApiBaseUrl();
  if (!base || typeof window === "undefined") return;
  const token = readBearerTokenSafe();
  void fetch(`${base.replace(/\/$/, "")}/internal/errors`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

export function reportClientError(
  err: unknown,
  defaults?: Partial<ToCanonicalDefaults>,
): void {
  reportCanonicalClientError(
    toCanonicalError(err, {
      source: "frontend_web",
      ...defaults,
    }),
  );
}
