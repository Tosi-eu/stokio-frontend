"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const EditMedicine = dynamic(() => import("@/pages/EditMedicine"), {
  ssr: false,
});

export default function EditMedicinePage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando edição..." />}>
      <ModuleRoute moduleKey="medicines">
        <EditMedicine />
      </ModuleRoute>
    </Suspense>
  );
}
