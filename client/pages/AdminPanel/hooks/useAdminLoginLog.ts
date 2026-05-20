import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { getAdminLoginLog } from "@/api/requests";
import type { LoginLogEntry } from "@/api/requests";

function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultDateRange(): { fromDate: string; toDate: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { fromDate: formatDateInput(from), toDate: formatDateInput(to) };
}

export function useAdminLoginLog(isAdmin: boolean, enabled = true) {
  const defaults = defaultDateRange();
  const [data, setData] = useState<LoginLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loginFilter, setLoginFilter] = useState("");
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [applied, setApplied] = useState({
    login: "",
    fromDate: defaults.fromDate,
    toDate: defaults.toDate,
  });

  async function load(overridePage?: number) {
    if (!isAdmin) return;
    const p = overridePage ?? page;
    setLoading(true);
    try {
      const res = await getAdminLoginLog({
        page: p,
        limit,
        login: applied.login.trim() || undefined,
        fromDate: applied.fromDate || undefined,
        toDate: applied.toDate || undefined,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable
  }, [isAdmin, enabled, page, limit, applied]);

  function applyFilters() {
    setApplied({
      login: loginFilter,
      fromDate,
      toDate,
    });
    setPage(1);
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
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    load,
    applyFilters,
  };
}
