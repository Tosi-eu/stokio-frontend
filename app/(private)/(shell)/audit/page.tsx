"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Audit = dynamic(() => import("@/pages/Audit"), { ssr: false });

export default function AuditPage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregar auditoria..." />}>
      <ModuleRoute moduleKey="audit">
        <Audit />
      </ModuleRoute>
    </Suspense>
  );
}
