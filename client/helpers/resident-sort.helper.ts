export function compareResidentNameCodeUnit(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function compareResidentsByNameThenCasela<
  T extends { name: string; casela: number },
>(a: T, b: T): number {
  const byName = compareResidentNameCodeUnit(a.name, b.name);
  if (byName !== 0) return byName;
  return a.casela - b.casela;
}

export function compareResidentsByCaselaThenName<
  T extends { name: string; casela: number },
>(a: T, b: T): number {
  const byCasela = a.casela - b.casela;
  if (byCasela !== 0) return byCasela;
  return compareResidentNameCodeUnit(a.name, b.name);
}
