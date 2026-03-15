export async function tap<T>(fn: () => Promise<T> | T): Promise<T> {
  return fn();
}

export function parseDateFromString(
  dateStr: string | null | undefined,
): Date | null {
  if (!dateStr) return null;

  const [day, month, year] = dateStr.split("/").map(Number);
  if (!day || !month || !year) return null;

  return new Date(year, month - 1, day);
}
