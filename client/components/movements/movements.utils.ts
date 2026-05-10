export function parseMovementDateMs(raw: unknown): number {
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d, 12, 0, 0, 0).getTime();
  }
  const ms = Date.parse(s);
  if (Number.isFinite(ms)) return ms;
  const ms2 = Date.parse(s.replace(" ", "T"));
  return Number.isFinite(ms2) ? ms2 : 0;
}
