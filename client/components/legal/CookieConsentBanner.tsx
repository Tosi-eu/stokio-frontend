"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/context/cookie-consent-context";

function privacyPolicyHref(): string {
  const external = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL?.trim();
  if (external) return external;
  return "/privacidade";
}

export function CookieConsentBanner() {
  const { hasDecided, saveChoice, openPreferences } = useCookieConsent();

  if (hasDecided) return null;

  const policyHref = privacyPolicyHref();
  const policyExternal = policyHref.startsWith("http");

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 inset-x-0 z-[100] border-t border-border bg-card/95 backdrop-blur-md shadow-lg p-4 sm:p-5"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p id="cookie-consent-title" className="font-medium text-foreground">
            Cookies e privacidade
          </p>
          <p id="cookie-consent-desc">
            Utilizamos cookies necessários para a sessão e, com o seu
            consentimento, cookies funcionais e analíticos. Consulte a{" "}
            <Link
              href={policyHref}
              className="underline underline-offset-2 text-foreground hover:text-primary"
              target={policyExternal ? "_blank" : undefined}
              rel={policyExternal ? "noopener noreferrer" : undefined}
            >
              política de privacidade
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => saveChoice("accept_all")}
          >
            Aceitar todos
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => saveChoice("reject_optional")}
          >
            Recusar opcionais
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={openPreferences}
          >
            Personalizar
          </Button>
        </div>
      </div>
    </div>
  );
}
