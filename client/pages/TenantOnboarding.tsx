"use client";

import { TenantOnboardingView } from "@/components/tenant-onboarding/TenantOnboardingView";
import { useTenantOnboardingPage } from "@/hooks/useTenantOnboardingPage";

export default function TenantOnboarding() {
  const vm = useTenantOnboardingPage();
  return <TenantOnboardingView vm={vm} />;
}
