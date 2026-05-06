import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { formatValidityDate } from "@/helpers/dates.helper";
import type { StockListAlertItem } from "@/interfaces/interfaces";
import type { AlertNoPriceItem, AlertStockItem } from "../types";
import { getDashboardSummary, getStock } from "@/api/requests";

const ROWS_LIMIT = 50;

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
      const [
        summary,
        noStockRes,
        belowMinRes,
        expiredRes,
        expiringSoonRes,
        noPriceRes,
      ] = await Promise.all([
        getDashboardSummary(),
        getStock(1, ROWS_LIMIT, undefined, "noStock"),
        getStock(1, ROWS_LIMIT, undefined, "belowMin"),
        getStock(1, ROWS_LIMIT, undefined, "expired"),
        getStock(1, ROWS_LIMIT, undefined, "expiringSoon"),
        getStock(1, ROWS_LIMIT, undefined, "noPrice"),
      ]);

      setCounts({
        noStock: Number(summary?.alerts?.noStock ?? 0),
        belowMin: Number(summary?.alerts?.belowMin ?? 0),
        expired: Number(summary?.alerts?.expired ?? 0),
        expiringSoon: Number(summary?.alerts?.expiringSoon ?? 0),
        noPrice: Number(summary?.alerts?.noPrice ?? 0),
      });

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

      const noStock = mapRows(noStockRes);
      const belowMin = mapRows(belowMinRes);
      const expired = mapRows(expiredRes);
      const expiringSoon = mapRows(expiringSoonRes);

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

      const noPrice = mapNoPriceRows(noPriceRes);

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
