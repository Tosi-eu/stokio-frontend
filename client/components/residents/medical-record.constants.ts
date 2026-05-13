export const MEDICAL_RECORD_PERIOD_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "fortnight", label: "Fortnight" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

export function formatMedicalRecordPeriodLabel(
  raw: string | null | undefined,
): string {
  if (raw == null || String(raw).trim() === "") return "—";
  const v = String(raw).trim().toLowerCase();
  const found = MEDICAL_RECORD_PERIOD_OPTIONS.find((p) => p.value === v);
  if (found) return found.label;
  const legacy: Record<string, string> = {
    dia: "Day",
    semana: "Week",
    quinzena: "Fortnight",
    mes: "Month",
    ano: "Year",
  };
  return legacy[v] ?? raw;
}
