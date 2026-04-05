"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const EditResident = dynamic(() => import("@/pages/EditResident"), {
  ssr: false,
});

export default function EditResidentPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando edição..." />}>
      <ModuleRoute moduleKey="residents">
        <EditResident />
      </ModuleRoute>
    </Suspense>
  );
}
