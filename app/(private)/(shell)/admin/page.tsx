"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const AdminPanel = dynamic(() => import("@/pages/AdminPanel"), {
  ssr: false,
});

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <LoadingFallback title="Carregando painel administrativo..." />
      }
    >
      <ModuleRoute moduleKey="admin">
        <AdminPanel />
      </ModuleRoute>
    </Suspense>
  );
}
