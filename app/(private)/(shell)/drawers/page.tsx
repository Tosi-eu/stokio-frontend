"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Drawers = dynamic(() => import("@/pages/Drawers"), { ssr: false });

export default function DrawersPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando gavetas..." />}>
      <ModuleRoute moduleKey="drawers">
        <Drawers />
      </ModuleRoute>
    </Suspense>
  );
}
