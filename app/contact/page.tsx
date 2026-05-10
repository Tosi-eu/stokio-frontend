"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { AuthSuspenseFallback } from "@/components/auth/AuthSuspenseFallback";

const Auth = dynamic(() => import("@/pages/Auth"), { ssr: false });

export default function ContactPage() {
  return (
    <Suspense fallback={<AuthSuspenseFallback title="A carregar…" />}>
      <Auth scrollToSection="contact" />
    </Suspense>
  );
}
