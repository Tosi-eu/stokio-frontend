import { useEffect, useMemo, useState } from "react";
import { listTenantSetores, type TenantSetorRow } from "@/api/requests";

export function useTenantSetores() {
  const [rows, setRows] = useState<TenantSetorRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listTenantSetores();
        if (!cancelled) {
          setRows(Array.isArray(res?.data) ? res.data : []);
        }
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profilesByKey = useMemo(() => {
    const m = new Map<string, "farmacia" | "enfermagem">();
    for (const r of rows) {
      if (!r.active) continue;
      m.set(
        r.key,
        r.proportion_profile === "enfermagem" ? "enfermagem" : "farmacia",
      );
    }
    return m;
  }, [rows]);

  const labelByKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) {
      if (r.active) m.set(r.key, r.nome);
    }
    return m;
  }, [rows]);

  return { rows, profilesByKey, labelByKey };
}
