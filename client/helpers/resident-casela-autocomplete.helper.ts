/** Rótulo único para selects de residente/casela: `Nome (número)`. */
export function formatResidentCaselaAutocompleteLabel(r: {
  name: string;
  casela: number;
}): string {
  return `${String(r.name).trim()} (${r.casela})`;
}

/** Mesma lógica da lista de residentes: nome contém texto OU número da casela contém o que foi digitado. */
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
