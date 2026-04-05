"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const RegisterMedicine = dynamic(
  () => import("@/pages/RegisterMedicine"),
  { ssr: false },
);

export default function RegisterMedicinePage() {
  return (
    <Suspense
      fallback={<LoadingFallback title="Carregando formulário..." />}
    >
      <ModuleRoute moduleKey="medicines">
        <RegisterMedicine />
      </ModuleRoute>
    </Suspense>
  );
}
