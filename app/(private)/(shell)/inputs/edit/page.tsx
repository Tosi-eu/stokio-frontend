"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const EditInput = dynamic(() => import("@/pages/EditInput"), { ssr: false });

export default function EditInputPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando edição..." />}>
      <ModuleRoute moduleKey="inputs">
        <EditInput />
      </ModuleRoute>
    </Suspense>
  );
}
