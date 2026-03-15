export async function fetchAllPaginated<T>(
  fetchFn: (
    page: number,
    limit: number,
  ) => Promise<{
    data: T[];
    hasNext: boolean;
  }>,
  limit = 100,
): Promise<T[]> {
  let page = 1;
  const all: T[] = [];
  let hasNext = true;

  while (hasNext) {
    const res = await fetchFn(page, limit);

    all.push(...(res.data ?? []));
    hasNext = res.hasNext;
    page++;
  }

  return all;
}

export const DEFAULT_PAGE_SIZE = 10;

export function paginate<T>(data: T[], page: number) {
  const start = (page - 1) * DEFAULT_PAGE_SIZE;
  return data.slice(start, start + DEFAULT_PAGE_SIZE);
}
