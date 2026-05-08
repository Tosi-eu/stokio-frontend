import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { formatValidityDate } from "@/helpers/dates.helper";
import type { StockListAlertItem } from "@/interfaces/interfaces";
import type { AlertNoPriceItem, AlertStockItem } from "../types";
import { getStock } from "@/api/requests";

const ALERTS_PAGE_LIMIT = 50000;

export function useAdminAlerts(isAdmin: boolean, enabled = true) {
  const [alerts, setAlerts] = useState<{
    noStock: AlertStockItem[];
    belowMin: AlertStockItem[];
    expired: AlertStockItem[];
    expiringSoon: AlertStockItem[];
    noPrice: AlertNoPriceItem[];
  }>({
    noStock: [],
    belowMin: [],
    expired: [],
    expiringSoon: [],
    noPrice: [],
  });
  const [counts, setCounts] = useState<{
    noStock: number;
    belowMin: number;
    expired: number;
    expiringSoon: number;
    noPrice: number;
  }>({ noStock: 0, belowMin: 0, expired: 0, expiringSoon: 0, noPrice: 0 });
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  async function loadAlerts() {
    setLoadingAlerts(true);
    try {
      const [noStockRes, belowMinRes, expiredRes, expiringSoonRes, noPriceRes] =
        await Promise.all([
          getStock(1, ALERTS_PAGE_LIMIT, undefined, "noStock"),
          getStock(1, ALERTS_PAGE_LIMIT, undefined, "belowMin"),
          getStock(1, ALERTS_PAGE_LIMIT, undefined, "expired"),
          getStock(1, ALERTS_PAGE_LIMIT, undefined, "expiringSoon"),
          getStock(1, ALERTS_PAGE_LIMIT, undefined, "noPrice"),
        ]);

      const mapRows = (res: unknown): AlertStockItem[] => {
        const data = (res as { data?: unknown })?.data;
        const list = Array.isArray(data) ? (data as StockListAlertItem[]) : [];
        return list.map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          quantidade: Number(i.quantidade) || 0,
          minimo: i.minimo,
          validade: formatValidityDate(i.validade),
          setor: i.setor ?? "-",
          tipo_item: i.tipo_item ?? "-",
        }));
      };

      const mapNoPriceRows = (res: unknown): AlertNoPriceItem[] => {
        const data = (res as { data?: unknown })?.data;
        const list = Array.isArray(data) ? (data as StockListAlertItem[]) : [];
        return list.map((i) => ({
          nome: i.nome ?? "-",
          detalhe: i.principio_ativo ?? i.descricao ?? null,
          tipo_item: i.tipo_item ?? "-",
          minimo: i.minimo,
          tentativas_busca: Number(i.tentativas_busca ?? 0),
        }));
      };

      const noStock = mapRows(noStockRes);
      const belowMin = mapRows(belowMinRes);
      const expired = mapRows(expiredRes);
      const expiringSoon = mapRows(expiringSoonRes);
      const noPrice = mapNoPriceRows(noPriceRes);

      setCounts({
        noStock: Number(noStockRes.total ?? noStock.length),
        belowMin: Number(belowMinRes.total ?? belowMin.length),
        expired: Number(expiredRes.total ?? expired.length),
        expiringSoon: Number(expiringSoonRes.total ?? expiringSoon.length),
        noPrice: Number(noPriceRes.total ?? noPrice.length),
      });

      setAlerts({ noStock, belowMin, expired, expiringSoon, noPrice });
    } catch {
      toast({ title: "Erro ao carregar alertas", variant: "error" });
      setAlerts({
        noStock: [],
        belowMin: [],
        expired: [],
        expiringSoon: [],
        noPrice: [],
      });
      setCounts({
        noStock: 0,
        belowMin: 0,
        expired: 0,
        expiringSoon: 0,
        noPrice: 0,
      });
    } finally {
      setLoadingAlerts(false);
    }
  }

  useEffect(() => {
    if (isAdmin && enabled) loadAlerts();
  }, [isAdmin, enabled]);

  return { alerts, counts, loadingAlerts, loadAlerts };
}
