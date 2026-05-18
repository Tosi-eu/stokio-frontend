import {
  hasCookieConsent,
  readCookieConsent,
} from "@/helpers/cookie-consent.helper";

let analyticsBootstrapped = false;

export type AnalyticsBootstrap = {
  enableErrorReporting: () => void;
};

let errorReportingEnabled = false;
const errorReportingCallbacks = new Set<() => void>();

export function isAnalyticsConsentGranted(): boolean {
  return hasCookieConsent(readCookieConsent(), "analytics");
}

export function subscribeErrorReporting(onEnable: () => void): () => void {
  errorReportingCallbacks.add(onEnable);
  if (errorReportingEnabled) onEnable();
  return () => {
    errorReportingCallbacks.delete(onEnable);
  };
}

function notifyErrorReportingEnabled(): void {
  errorReportingEnabled = true;
  for (const cb of errorReportingCallbacks) {
    try {
      cb();
    } catch {
      void 0;
    }
  }
}

/** Loads optional analytics (error reporting today; third-party scripts later). */
export function loadAnalyticsIfConsented(): void {
  if (!isAnalyticsConsentGranted()) return;
  if (analyticsBootstrapped) return;
  analyticsBootstrapped = true;
  notifyErrorReportingEnabled();

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (gaId && typeof document !== "undefined") {
    const existing = document.getElementById("stokio-ga-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "stokio-ga-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      document.head.appendChild(script);
    }
  }
}

export function resetAnalyticsBootstrapForTests(): void {
  analyticsBootstrapped = false;
  errorReportingEnabled = false;
  errorReportingCallbacks.clear();
}
