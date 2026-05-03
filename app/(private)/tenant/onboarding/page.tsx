"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingFallback } from "@/components/LoadingFallback";

const TenantOnboarding = dynamic(() => import("@/pages/TenantOnboarding"), {
  ssr: false,
});

export default function TenantOnboardingPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando configuração..." />}>
      <TenantOnboarding />
    </Suspense>
  );
}
