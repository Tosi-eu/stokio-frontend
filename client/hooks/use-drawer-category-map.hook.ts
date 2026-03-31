import { useEffect, useState } from "react";
import { getDrawers } from "@/api/requests";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";

let cachedMap: Map<number, string> | null = null;
let inflight: Promise<Map<number, string>> | null = null;

async function loadDrawerCategoryMap(): Promise<Map<number, string>> {
  const allDrawers = await fetchAllPaginated(
    (page, limit) => getDrawers(page, limit),
    100,
  );
  const m = new Map<number, string>();
  for (const d of allDrawers as Array<{
    numero: number;
    categoria?: string;
  }>) {
    if (d.categoria) m.set(d.numero, d.categoria);
  }
  return m;
}

export function useDrawerCategoryMap() {
  const [map, setMap] = useState<Map<number, string>>(
    () => cachedMap ?? new Map(),
  );

  useEffect(() => {
    if (cachedMap) return;
    if (!inflight) {
      inflight = loadDrawerCategoryMap().then((m) => {
        cachedMap = m;
        inflight = null;
        return m;
      });
    }
    void inflight.then((m) => setMap(m));
  }, []);

  return map;
}
