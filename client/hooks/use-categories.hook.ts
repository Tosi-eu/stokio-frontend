import { useQuery } from "@tanstack/react-query";
import { getCabinetCategories, getDrawerCategories } from "@/api/requests";

const CATEGORIES_STALE_MS = 5 * 60 * 1000;

export function useCabinetCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cabinet-categories"],
    queryFn: async () => {
      const res = await getCabinetCategories(1, 200);
      return res.data ?? [];
    },
    staleTime: CATEGORIES_STALE_MS,
  });
  return { categories: data ?? [], isLoading, error };
}

export function useDrawerCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["drawer-categories"],
    queryFn: async () => {
      const res = await getDrawerCategories(1, 200);
      return res.data ?? [];
    },
    staleTime: CATEGORIES_STALE_MS,
  });
  return { categories: data ?? [], isLoading, error };
}
