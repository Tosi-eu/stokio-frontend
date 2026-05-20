export const COOKIE_CONSENT_COOKIE_NAME = "stokio_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export type CookieConsentCategory = "necessary" | "functional" | "analytics";

export type CookieConsentState = {
  version: number;
  decidedAt: string;
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

export type CookieConsentChoice =
  | "accept_all"
  | "reject_optional"
  | { functional: boolean; analytics: boolean };

function parseConsentCookie(raw: string): CookieConsentState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.decidedAt !== "string") return null;
    return {
      version: COOKIE_CONSENT_VERSION,
      decidedAt: parsed.decidedAt,
      necessary: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
    };
  } catch {
    return null;
  }
}

export function readCookieConsent(): CookieConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_CONSENT_COOKIE_NAME}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return parseConsentCookie(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function writeCookieConsent(state: CookieConsentState): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(state));
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SEC}; SameSite=Lax`;
}

export function buildConsentFromChoice(
  choice: CookieConsentChoice,
): CookieConsentState {
  const base = {
    version: COOKIE_CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    necessary: true as const,
  };
  if (choice === "accept_all") {
    return { ...base, functional: true, analytics: true };
  }
  if (choice === "reject_optional") {
    return { ...base, functional: false, analytics: false };
  }
  return {
    ...base,
    functional: Boolean(choice.functional),
    analytics: Boolean(choice.analytics),
  };
}

export function hasCookieConsent(
  state: CookieConsentState | null,
  category: CookieConsentCategory,
): boolean {
  if (!state) return false;
  if (category === "necessary") return true;
  if (category === "functional") return state.functional;
  return state.analytics;
}

export const COOKIE_CONSENT_CHANGED_EVENT = "stokio:cookie-consent-changed";

export function dispatchCookieConsentChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
}
