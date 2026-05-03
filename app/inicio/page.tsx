"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function InicioRedirectPage() {
  const router = useRouter();
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (didRedirectRef.current) return;
    didRedirectRef.current = true;
    router.replace("/loading");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect-only page
  }, []);

  return null;
}
