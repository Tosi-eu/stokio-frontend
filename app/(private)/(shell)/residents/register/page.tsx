"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const RegisterResident = dynamic(() => import("@/pages/RegisterResident"), {
  ssr: false,
});

export default function RegisterResidentPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando formulário..." />}>
      <ModuleRoute moduleKey="residents">
        <RegisterResident />
      </ModuleRoute>
    </Suspense>
  );
}
