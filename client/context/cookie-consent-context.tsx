"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  buildConsentFromChoice,
  COOKIE_CONSENT_CHANGED_EVENT,
  dispatchCookieConsentChanged,
  hasCookieConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentCategory,
  type CookieConsentChoice,
  type CookieConsentState,
} from "@/helpers/cookie-consent.helper";
import { loadAnalyticsIfConsented } from "@/helpers/analytics-loader.helper";

type CookieConsentContextValue = {
  consent: CookieConsentState | null;
  hasDecided: boolean;
  hasConsent: (category: CookieConsentCategory) => boolean;
  saveChoice: (choice: CookieConsentChoice) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  preferencesOpen: boolean;
};

const CookieConsentContext = createContext<
  CookieConsentContextValue | undefined
>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [hasDecided, setHasDecided] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [declineToastShown, setDeclineToastShown] = useState(false);

  const syncFromCookie = useCallback(() => {
    const stored = readCookieConsent();
    setConsent(stored);
    setHasDecided(stored != null);
  }, []);

  useEffect(() => {
    syncFromCookie();
    const onChange = () => syncFromCookie();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
    return () =>
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onChange);
  }, [syncFromCookie]);

  useEffect(() => {
    if (hasCookieConsent(consent, "analytics")) {
      loadAnalyticsIfConsented();
    }
  }, [consent]);

  const saveChoice = useCallback(
    (choice: CookieConsentChoice) => {
      const next = buildConsentFromChoice(choice);
      writeCookieConsent(next);
      setConsent(next);
      setHasDecided(true);
      setPreferencesOpen(false);
      dispatchCookieConsentChanged();
      loadAnalyticsIfConsented();

      if (choice === "reject_optional" && !declineToastShown) {
        setDeclineToastShown(true);
        toast({
          title: "Preferências guardadas",
          description:
            "Personalizações e estatísticas opcionais ficam desativadas. Pode alterar em «Gerir cookies».",
          duration: 6000,
        });
      }
    },
    [declineToastShown],
  );

  const hasConsentFn = useCallback(
    (category: CookieConsentCategory) => hasCookieConsent(consent, category),
    [consent],
  );

  const value = useMemo(
    () => ({
      consent,
      hasDecided,
      hasConsent: hasConsentFn,
      saveChoice,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      preferencesOpen,
    }),
    [consent, hasDecided, hasConsentFn, saveChoice, preferencesOpen],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider",
    );
  }
  return ctx;
}
