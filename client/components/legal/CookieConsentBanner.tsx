"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/context/cookie-consent-context";
import { cn } from "@/lib/utils";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";

function privacyPolicyHref(): string {
  const external = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL?.trim();
  if (external) return external;
  return "/privacidade";
}

function isAuthLandingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/user/login" ||
    pathname === "/contact" ||
    pathname === "/privacidade"
  );
}

export function CookieConsentBanner() {
  const pathname = usePathname();
  const { hasDecided, saveChoice, openPreferences } = useCookieConsent();

  if (hasDecided) return null;

  const policyHref = privacyPolicyHref();
  const policyExternal = policyHref.startsWith("http");
  const onAuthLanding = isAuthLandingPath(pathname);

  return (
    <div
      role="presentation"
      className={cn(
        "fixed inset-x-0 z-[100] flex justify-center px-4 pointer-events-none",
        onAuthLanding ? "bottom-[5.25rem] lg:bottom-6" : "bottom-4 sm:bottom-6",
      )}
    >
      <div
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-desc"
        aria-modal="false"
        className={cn(
          pageSurfaceCardClass,
          "pointer-events-auto w-full max-w-lg sm:max-w-xl",
          "bg-card/95 backdrop-blur-md p-4 sm:p-5",
          "shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.22)]",
        )}
      >
        <div className="space-y-4">
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p
              id="cookie-consent-title"
              className="font-display text-base font-semibold text-foreground"
            >
              Cookies e privacidade
            </p>
            <p id="cookie-consent-desc" className="leading-relaxed">
              Utilizamos cookies necessários para a sessão e, com o seu
              consentimento, cookies funcionais e analíticos. Consulte a{" "}
              <Link
                href={policyHref}
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                target={policyExternal ? "_blank" : undefined}
                rel={policyExternal ? "noopener noreferrer" : undefined}
              >
                política de privacidade
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              size="sm"
              className="rounded-xl sm:min-w-[8.5rem]"
              onClick={() => saveChoice("accept_all")}
            >
              Aceitar todos
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl sm:min-w-[8.5rem]"
              onClick={() => saveChoice("reject_optional")}
            >
              Recusar opcionais
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl"
              onClick={openPreferences}
            >
              Personalizar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
