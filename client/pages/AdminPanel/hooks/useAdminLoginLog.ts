import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { getAdminLoginLog } from "@/api/requests";
import type { LoginLogEntry } from "@/api/requests";

export function useAdminLoginLog(isAdmin: boolean, enabled = true) {
  const [data, setData] = useState<LoginLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loginFilter, setLoginFilter] = useState("");
  const [successFilter, setSuccessFilter] = useState<boolean | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function load(overridePage?: number) {
    if (!isAdmin) return;
    const p = overridePage ?? page;
    setLoading(true);
    try {
      const res = await getAdminLoginLog({
        page: p,
        limit,
        login: loginFilter.trim() || undefined,
        success: successFilter === "" ? undefined : successFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setData(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast({ title: "Erro ao carregar log de acessos", variant: "error" });
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (enabled) load();
  }, [isAdmin, enabled, page, limit]);

  function applyFilters() {
    setPage(1);
    load(1);
  }

  return {
    data,
    total,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    loginFilter,
    setLoginFilter,
    successFilter,
    setSuccessFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    load,
    applyFilters,
  };
}
