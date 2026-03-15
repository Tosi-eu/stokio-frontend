import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { getStock } from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import { formatValidityDate } from "@/helpers/dates.helper";
import type { StockListAlertItem } from "@/interfaces/interfaces";
import type { AlertStockItem } from "../types";

export function useAdminAlerts(isAdmin: boolean, enabled = true) {
  const [alerts, setAlerts] = useState<{
    noStock: AlertStockItem[];
    belowMin: AlertStockItem[];
    expired: AlertStockItem[];
    expiringSoon: AlertStockItem[];
  }>({
    noStock: [],
    belowMin: [],
    expired: [],
    expiringSoon: [],
  });
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const stockList = await fetchAllPaginated<StockListAlertItem>(
        (page, limit) =>
          getStock(page, limit).then((res) => ({
            data: Array.isArray(res?.data)
              ? (res.data as StockListAlertItem[])
              : [],
            hasNext: Boolean(res?.hasNext),
          })),
      );
      const noStock = stockList
        .filter((i) => (Number(i.quantidade) || 0) === 0)
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) || 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      const belowMin = stockList
        .filter(
          (i) =>
            i.st_quantidade === "critical" && (Number(i.quantidade) || 0) > 0,
        )
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) || 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      const expired = stockList
        .filter((i) => i.st_expiracao === "expired" && (i.quantidade ?? 0) > 0)
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) || 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      const expiringSoon = stockList
        .filter(
          (i) =>
            i.st_expiracao === "warning" ||
            (i.st_expiracao === "critical" && (i.quantidade ?? 0) > 0),
        )
        .map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) || 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      setAlerts({ noStock, belowMin, expired, expiringSoon });
    } catch {
      toast({ title: "Erro ao carregar alertas", variant: "error" });
      setAlerts({
        noStock: [],
        belowMin: [],
        expired: [],
        expiringSoon: [],
      });
    } finally {
      setLoadingAlerts(false);
    }
  }

  useEffect(() => {
    if (isAdmin && enabled) loadAlerts();
  }, [isAdmin, enabled]);

  return { alerts, loadingAlerts, loadAlerts };
}
