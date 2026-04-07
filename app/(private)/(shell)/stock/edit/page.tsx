"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const EditStock = dynamic(() => import("@/pages/EditStock"), { ssr: false });

export default function EditStockPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando edição..." />}>
      <ModuleRoute moduleKey="stock">
        <EditStock />
      </ModuleRoute>
    </Suspense>
  );
}
