"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { AuthProvider } from "@/context/auth-context";
import { NotificationProvider } from "@/context/notification.context";
import { TenantProvider } from "@/context/tenant-context";
import { InvalidSessionProvider } from "@/context/invalid-session.context";
import { useAuth } from "@/hooks/use-auth.hook";
import { AppRouteGate } from "@/components/AppRouteGate";
import { GlobalErrorListeners } from "@/components/GlobalErrorListeners";
import { RootErrorBoundary } from "@/components/RootErrorBoundary";
import { CookieConsentProvider } from "@/context/cookie-consent-context";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { CookiePreferencesDialog } from "@/components/legal/CookiePreferencesDialog";

function TenantProviderWithUserKey({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <TenantProvider key={user?.id ?? "none"}>{children}</TenantProvider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsentProvider>
          <GlobalErrorListeners />
          <CookieConsentBanner />
          <CookiePreferencesDialog />
          <AuthProvider>
            <TenantProviderWithUserKey>
              <NotificationProvider>
                <InvalidSessionProvider>
                  <RootErrorBoundary>
                    <AppRouteGate>{children}</AppRouteGate>
                  </RootErrorBoundary>
                </InvalidSessionProvider>
              </NotificationProvider>
            </TenantProviderWithUserKey>
          </AuthProvider>
        </CookieConsentProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
