import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { getAdminNotifications, patchAdminNotification } from "@/api/requests";
import type { AdminNotificationItem } from "@/api/requests";

export function useAdminNotifications(isAdmin: boolean, enabled = true) {
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [tipoFilter, setTipoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vistoFilter, setVistoFilter] = useState<boolean | "">("");

  async function load(overridePage?: number) {
    if (!isAdmin) return;
    const p = overridePage ?? page;
    setLoading(true);
    try {
      const res = await getAdminNotifications({
        page: p,
        limit,
        tipo: tipoFilter || undefined,
        status: statusFilter || undefined,
        visto: vistoFilter === "" ? undefined : vistoFilter,
      });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      toast({ title: "Erro ao carregar notificações", variant: "error" });
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (enabled) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable
  }, [isAdmin, enabled, page, limit]);

  async function markAsRead(id: number) {
    try {
      await patchAdminNotification(id, { visto: true });
      toast({ title: "Marcada como lida", variant: "success" });
      load();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro ao atualizar",
        variant: "error",
      });
    }
  }

  async function archive(id: number) {
    try {
      await patchAdminNotification(id, { status: "cancelled" });
      toast({ title: "Notificação arquivada", variant: "success" });
      load();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro ao arquivar",
        variant: "error",
      });
    }
  }

  function applyFilters() {
    setPage(1);
    load(1);
  }

  return {
    items,
    total,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    tipoFilter,
    setTipoFilter,
    statusFilter,
    setStatusFilter,
    vistoFilter,
    setVistoFilter,
    load,
    applyFilters,
    markAsRead,
    archive,
  };
}
