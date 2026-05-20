"use client";

import { useEffect, useState } from "react";
import {
  AUTH_LANDING_SECTION_IDS,
  type AuthLandingSectionId,
} from "@/components/auth/auth-landing.constants";

export function useAuthLandingActiveSection(): AuthLandingSectionId {
  const [active, setActive] = useState<AuthLandingSectionId>("auth");

  useEffect(() => {
    const elements = AUTH_LANDING_SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter((el): el is HTMLElement => el != null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top?.target.id) return;
        const id = top.target.id as AuthLandingSectionId;
        if (AUTH_LANDING_SECTION_IDS.includes(id)) {
          setActive(id);
        }
      },
      {
        threshold: [0.2, 0.35, 0.5],
        rootMargin: "-18% 0px -40% 0px",
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return active;
}
