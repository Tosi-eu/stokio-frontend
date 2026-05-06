/** Compatível com `PaginatedResponse` do SDK (`hasNext` opcional). */
export async function fetchAllPaginated<T>(
  fetchFn: (
    page: number,
    limit: number,
  ) => Promise<{
    data?: T[] | null;
    hasNext?: boolean;
  }>,
  limit = 100,
): Promise<T[]> {
  let page = 1;
  const all: T[] = [];
  let hasNext = true;

  while (hasNext) {
    const res = await fetchFn(page, limit);
    const chunk = res.data ?? [];
    all.push(...chunk);

    if (res.hasNext === false) hasNext = false;
    else if (res.hasNext === true) hasNext = true;
    else hasNext = chunk.length >= limit;

    page++;
  }

  return all;
}

export const DEFAULT_PAGE_SIZE = 10;

export function paginate<T>(data: T[], page: number) {
  const start = (page - 1) * DEFAULT_PAGE_SIZE;
  return data.slice(start, start + DEFAULT_PAGE_SIZE);
}
