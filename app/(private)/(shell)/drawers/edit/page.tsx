"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const EditDrawer = dynamic(() => import("@/pages/EditDrawer"), { ssr: false });

export default function EditDrawerPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando edição..." />}>
      <ModuleRoute moduleKey="drawers">
        <EditDrawer />
      </ModuleRoute>
    </Suspense>
  );
}
