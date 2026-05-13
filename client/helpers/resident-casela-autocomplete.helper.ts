export function formatResidentCaselaAutocompleteLabel(r: {
  name: string;
  casela: number;
}): string {
  return `${String(r.name).trim()} (${r.casela})`;
}

export function matchesResidentCaselaSearch(
  r: { name: string; casela: number },
  rawQuery: string,
): boolean {
  const q = rawQuery.trim();
  if (!q) return true;
  const lower = q.toLowerCase();
  if (r.name.toLowerCase().includes(lower)) return true;
  return String(r.casela).includes(q.trim());
}
