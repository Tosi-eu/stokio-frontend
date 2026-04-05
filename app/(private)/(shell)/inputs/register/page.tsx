"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const RegisterInput = dynamic(() => import("@/pages/RegisterInput"), {
  ssr: false,
});

export default function RegisterInputPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando formulário..." />}>
      <ModuleRoute moduleKey="inputs">
        <RegisterInput />
      </ModuleRoute>
    </Suspense>
  );
}
