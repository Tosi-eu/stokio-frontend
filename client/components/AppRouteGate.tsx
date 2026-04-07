"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { readSkipTenantOnboarding } from "@/context/tenant-context";
import { useInvalidSession } from "@/context/invalid-session.context";
import { InvalidSessionModal } from "@/components/InvalidSessionModal";
import { toast } from "@/hooks/use-toast.hook";

function InvalidSessionModalBridge() {
  const { showModal, setShowModal } = useInvalidSession();

  useEffect(() => {
    const handleInvalidSession = () => setShowModal(true);
    window.addEventListener("invalid-session", handleInvalidSession);
    return () =>
      window.removeEventListener("invalid-session", handleInvalidSession);
  }, [setShowModal]);

  return (
    <InvalidSessionModal open={showModal} onClose={() => setShowModal(false)} />
  );
}

export function AppRouteGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const {
    tenantId,
    onboardingComplete,
    loading: tenantLoading,
    previewMode,
  } = useTenant();

  const skipOnboardingPref =
    tenantId != null && readSkipTenantOnboarding(tenantId);

  const needsSetup = Boolean(
    user &&
    !tenantLoading &&
    !onboardingComplete &&
    !previewMode &&
    !skipOnboardingPref,
  );
  const isOnboardingPath = pathname === "/tenant/onboarding";

  useEffect(() => {
    if (needsSetup && !isOnboardingPath) {
      router.replace("/tenant/onboarding");
    }
  }, [needsSetup, isOnboardingPath, router]);

  useEffect(() => {
    const handler = (e: Event) => {
      const message =
        (e as CustomEvent<{ message?: string }>).detail?.message ||
        "Você não tem os privilégios necessários. Contate o administrador.";
      toast({
        title: message,
        variant: "error",
        duration: 5000,
      });
    };
    window.addEventListener("insufficient-privileges", handler);
    return () => window.removeEventListener("insufficient-privileges", handler);
  }, []);

  if (needsSetup && !isOnboardingPath) {
    return null;
  }

  return (
    <>
      <InvalidSessionModalBridge />
      {children}
    </>
  );
}
