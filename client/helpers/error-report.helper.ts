import {
  toCanonicalError,
  type CanonicalErrorPayload,
  type ToCanonicalDefaults,
} from "@stokio/sdk";
import { readActiveTenantSlug } from "@/helpers/active-tenant-slug.helper";
import { isAnalyticsConsentGranted } from "@/helpers/analytics-loader.helper";

function resolveApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001/api/v1"
      : "")
  );
}

export function reportCanonicalClientError(
  payload: CanonicalErrorPayload,
): void {
  if (!isAnalyticsConsentGranted()) return;
  const base = resolveApiBaseUrl();
  if (!base || typeof window === "undefined") return;
  const slug = readActiveTenantSlug();
  void fetch(`${base.replace(/\/$/, "")}/internal/errors`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(slug?.trim() ? { "X-Tenant": slug.trim() } : {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

export function reportClientError(
  err: unknown,
  defaults?: Partial<ToCanonicalDefaults>,
): void {
  if (!isAnalyticsConsentGranted()) return;
  reportCanonicalClientError(
    toCanonicalError(err, {
      source: "frontend_web",
      ...defaults,
    }),
  );
}
