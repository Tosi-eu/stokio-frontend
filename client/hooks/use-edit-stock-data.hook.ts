import { useQuery } from "@tanstack/react-query";
import { getCabinets, getDrawers, getResidents } from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import type { Cabinet, Drawer, Patient } from "@/interfaces/interfaces";

/** Cache cabinets, drawers, residents for 5 minutes—EditStock dropdowns. */
const STALE_MS = 5 * 60 * 1000;

async function fetchAllCabinets(): Promise<Cabinet[]> {
  const rows = await fetchAllPaginated<Cabinet>(
    (page, limit) =>
      getCabinets(page, limit).then((res) => ({
        data: Array.isArray(res?.data) ? (res.data as Cabinet[]) : [],
        hasNext: Boolean(res?.hasNext),
      })),
    100,
  );
  return rows;
}

async function fetchAllDrawers(): Promise<Drawer[]> {
  const rows = await fetchAllPaginated<Drawer>(
    (page, limit) =>
      getDrawers(page, limit).then((res) => ({
        data: Array.isArray(res?.data) ? (res.data as Drawer[]) : [],
        hasNext: Boolean(res?.hasNext),
      })),
    100,
  );
  return rows;
}

async function fetchAllResidents(): Promise<Patient[]> {
  const rows = await fetchAllPaginated<Patient>(
    (page, limit) =>
      getResidents(page, limit).then((res) => ({
        data: Array.isArray(res?.data) ? (res.data as Patient[]) : [],
        hasNext: Boolean(res?.hasNext),
      })),
    100,
  );
  return rows;
}

export function useEditStockData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["edit-stock-data"],
    queryFn: async () => {
      const [cabinets, drawers, residents] = await Promise.all([
        fetchAllCabinets(),
        fetchAllDrawers(),
        fetchAllResidents(),
      ]);
      return { cabinets, drawers, residents };
    },
    staleTime: STALE_MS,
  });

  return {
    cabinets: data?.cabinets ?? [],
    drawers: data?.drawers ?? [],
    residents: data?.residents ?? [],
    isLoading,
    error,
  };
}
