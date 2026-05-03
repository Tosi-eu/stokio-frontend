"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import ModuleRoute from "@/pages/ModuleRoute";
import { LoadingFallback } from "@/components/LoadingFallback";

const Profile = dynamic(() => import("@/pages/Profile"), { ssr: false });

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback title="Carregando perfil..." />}>
      <ModuleRoute moduleKey="profile">
        <Profile />
      </ModuleRoute>
    </Suspense>
  );
}
