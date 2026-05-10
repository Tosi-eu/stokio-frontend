"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const AdminMedicalRecordExportsPage = dynamic(
  () => import("@/pages/AdminMedicalRecordExportsPage"),
  { ssr: false },
);

export default function AdminMedicalRecordExportsRoute() {
  return (
    <Suspense fallback={<LoadingFallback title="A carregar prontuários…" />}>
      <ModuleRoute moduleKey="admin">
        <AdminMedicalRecordExportsPage />
      </ModuleRoute>
    </Suspense>
  );
}
