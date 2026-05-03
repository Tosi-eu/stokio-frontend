"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const RegisterDrawer = dynamic(() => import("@/pages/RegisterDrawer"), {
  ssr: false,
});

export default function RegisterDrawerPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando formulário..." />}>
      <ModuleRoute moduleKey="drawers">
        <RegisterDrawer />
      </ModuleRoute>
    </Suspense>
  );
}
