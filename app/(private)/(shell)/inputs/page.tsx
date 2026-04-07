"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Inputs = dynamic(() => import("@/pages/Inputs"), { ssr: false });

export default function InputsPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando insumos..." />}>
      <ModuleRoute moduleKey="inputs">
        <Inputs />
      </ModuleRoute>
    </Suspense>
  );
}
