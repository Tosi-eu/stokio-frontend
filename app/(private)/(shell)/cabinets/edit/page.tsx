"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const EditCabinet = dynamic(() => import("@/pages/EditCabinet"), {
  ssr: false,
});

export default function EditCabinetPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando edição..." />}>
      <ModuleRoute moduleKey="cabinets">
        <EditCabinet />
      </ModuleRoute>
    </Suspense>
  );
}
