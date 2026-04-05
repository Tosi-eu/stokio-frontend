"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const RegisterCabinet = dynamic(
  () => import("@/pages/RegisterCabinet"),
  { ssr: false },
);

export default function RegisterCabinetPage() {
  return (
    <Suspense
      fallback={<LoadingFallback title="Carregando formulário..." />}
    >
      <ModuleRoute moduleKey="cabinets">
        <RegisterCabinet />
      </ModuleRoute>
    </Suspense>
  );
}
