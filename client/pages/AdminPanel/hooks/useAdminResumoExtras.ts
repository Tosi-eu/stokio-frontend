import { useEffect, useState } from "react";
import {
  getExpiringItems,
  getConsumptionByItem,
  getAdminStockHistory,
  getMedicines,
  getInputs,
  getAdminMedicineAbcBundle,
} from "@/api/requests";
import type { AdminMedicineAbcBundleResponse } from "@/api/requests";
import type { ExpiringItem, ConsumptionByItemRow } from "@/api/requests";
import type { StockHistoryEntry } from "@/api/requests";
import { useTenant } from "@/hooks/use-tenant.hook";

export function useAdminResumoExtras(isAdmin: boolean, enabled = true) {
  const { tenantId } = useTenant();
  const [expiringDays, setExpiringDays] = useState<30 | 60 | 90>(30);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [expiringItemsTotal, setExpiringItemsTotal] = useState(0);
  const [expiringItemsPage, setExpiringItemsPage] = useState(1);
  const [loadingExpiringItems, setLoadingExpiringItems] = useState(false);

  const [consumptionStart, setConsumptionStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [consumptionEnd, setConsumptionEnd] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [consumptionByItemData, setConsumptionByItemData] = useState<{
    items: ConsumptionByItemRow[];
    subtotal: { entrada: number; saida: number };
  }>({ items: [], subtotal: { entrada: 0, saida: 0 } });
  const [loadingConsumptionByItem, setLoadingConsumptionByItem] =
    useState(false);

  const [stockHistoryItemType, setStockHistoryItemType] = useState<
    "medicamento" | "insumo"
  >("medicamento");
  const [stockHistoryItemSearch, setStockHistoryItemSearch] = useState("");
  const [stockHistoryItemOptions, setStockHistoryItemOptions] = useState<
    { id: number; nome: string }[]
  >([]);
  const [stockHistorySelectedItem, setStockHistorySelectedItem] = useState<{
    id: number;
    nome: string;
  } | null>(null);
  const [loadingStockHistoryItemSearch, setLoadingStockHistoryItemSearch] =
    useState(false);
  const [stockHistoryItemPopoverOpen, setStockHistoryItemPopoverOpen] =
    useState(false);
  const [stockHistoryLote, setStockHistoryLote] = useState("");
  const [stockHistoryData, setStockHistoryData] = useState<StockHistoryEntry[]>(
    [],
  );
  const [stockHistoryTotal, setStockHistoryTotal] = useState(0);
  const [loadingStockHistory, setLoadingStockHistory] = useState(false);
  const [stockHistoryPage, setStockHistoryPage] = useState(1);
  const [stockHistoryLimit, setStockHistoryLimit] = useState(25);

  const [abcDays, setAbcDays] = useState(90);
  const [abcBundle, setAbcBundle] =
    useState<AdminMedicineAbcBundleResponse | null>(null);
  const [loadingAbc, setLoadingAbc] = useState(false);

  useEffect(() => {
    if (!isAdmin || !enabled) return;
    let cancelled = false;
    setLoadingExpiringItems(true);
    getExpiringItems(expiringDays, expiringItemsPage, 10)
      .then((res) => {
        if (!cancelled) {
          setExpiringItems(res.data);
          setExpiringItemsTotal(res.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExpiringItems([]);
          setExpiringItemsTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingExpiringItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, enabled, expiringDays, expiringItemsPage, tenantId]);

  function fetchConsumptionByItem() {
    setLoadingConsumptionByItem(true);
    getConsumptionByItem(consumptionStart, consumptionEnd)
      .then(setConsumptionByItemData)
      .catch(() =>
        setConsumptionByItemData({
          items: [],
          subtotal: { entrada: 0, saida: 0 },
        }),
      )
      .finally(() => setLoadingConsumptionByItem(false));
  }

  useEffect(() => {
    if (isAdmin && enabled) fetchConsumptionByItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchConsumptionByItem stable
  }, [isAdmin, enabled, tenantId]);

  useEffect(() => {
    if (!stockHistoryItemSearch.trim() || stockHistoryItemSearch.length < 2) {
      setStockHistoryItemOptions([]);
      return;
    }
    const t = setTimeout(() => {
      let cancelled = false;
      setLoadingStockHistoryItemSearch(true);
      const search = stockHistoryItemSearch.trim();
      (stockHistoryItemType === "medicamento"
        ? getMedicines(1, 25, search)
        : getInputs(1, 25, search)
      )
        .then((res) => {
          if (cancelled) return;
          const list = (res.data ?? []).map(
            (x: { id: number; nome?: string }) => ({
              id: x.id,
              nome: x.nome ?? "-",
            }),
          );
          setStockHistoryItemOptions(list);
        })
        .catch(() => {
          if (!cancelled) setStockHistoryItemOptions([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingStockHistoryItemSearch(false);
        });
      return () => {
        cancelled = true;
      };
    }, 300);
    return () => clearTimeout(t);
  }, [stockHistoryItemSearch, stockHistoryItemType]);

  async function fetchStockHistoryByItem(itemId: number, page = 1) {
    setLoadingStockHistory(true);
    try {
      const res = await getAdminStockHistory({
        itemType: stockHistoryItemType,
        itemId,
        page,
        limit: stockHistoryLimit,
      });
      setStockHistoryData(res.data);
      setStockHistoryTotal(res.total);
      setStockHistoryPage(res.page ?? page);
    } catch {
      setStockHistoryData([]);
      setStockHistoryTotal(0);
    } finally {
      setLoadingStockHistory(false);
    }
  }

  async function fetchStockHistoryByLote(page = 1) {
    setStockHistorySelectedItem(null);
    setLoadingStockHistory(true);
    try {
      const res = await getAdminStockHistory({
        lote: stockHistoryLote.trim(),
        page,
        limit: stockHistoryLimit,
      });
      setStockHistoryData(res.data);
      setStockHistoryTotal(res.total);
      setStockHistoryPage(res.page ?? page);
    } catch {
      setStockHistoryData([]);
      setStockHistoryTotal(0);
    } finally {
      setLoadingStockHistory(false);
    }
  }

  useEffect(() => {
    if (!isAdmin || !enabled) return;
    let cancelled = false;
    setLoadingAbc(true);
    getAdminMedicineAbcBundle(abcDays)
      .then((data) => {
        if (!cancelled) setAbcBundle(data);
      })
      .catch(() => {
        if (!cancelled) setAbcBundle(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAbc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, enabled, abcDays, tenantId]);

  useEffect(() => {
    setStockHistoryPage(1);
  }, [stockHistoryLimit]);

  return {
    expiringDays,
    setExpiringDays,
    expiringItems,
    expiringItemsTotal,
    expiringItemsPage,
    setExpiringItemsPage,
    loadingExpiringItems,
    consumptionStart,
    setConsumptionStart,
    consumptionEnd,
    setConsumptionEnd,
    consumptionByItemData,
    loadingConsumptionByItem,
    fetchConsumptionByItem,
    stockHistoryItemType,
    setStockHistoryItemType,
    stockHistoryItemSearch,
    setStockHistoryItemSearch,
    stockHistoryItemOptions,
    setStockHistoryItemOptions,
    stockHistorySelectedItem,
    setStockHistorySelectedItem,
    loadingStockHistoryItemSearch,
    stockHistoryItemPopoverOpen,
    setStockHistoryItemPopoverOpen,
    stockHistoryLote,
    setStockHistoryLote,
    stockHistoryData,
    stockHistoryTotal,
    loadingStockHistory,
    fetchStockHistoryByItem,
    fetchStockHistoryByLote,
    stockHistoryPage,
    setStockHistoryPage,
    stockHistoryLimit,
    setStockHistoryLimit,
    abcDays,
    setAbcDays,
    abcBundle,
    loadingAbc,
  };
}
