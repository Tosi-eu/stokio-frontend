export const MEDICAL_RECORD_PERIOD_OPTIONS = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "fortnight", label: "Quinzena" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
] as const;

export function formatMedicalRecordPeriodLabel(
  raw: string | null | undefined,
): string {
  if (raw == null || String(raw).trim() === "") return "—";
  const v = String(raw).trim().toLowerCase();
  const found = MEDICAL_RECORD_PERIOD_OPTIONS.find((p) => p.value === v);
  if (found) return found.label;
  const legacy: Record<string, string> = {
    dia: "Dia",
    semana: "Semana",
    quinzena: "Quinzena",
    mes: "Mês",
    mês: "Mês",
    ano: "Ano",
  };
  return legacy[v] ?? raw;
}

export function formatMedicalRecordPeriodKeyLabel(
  periodApi: string | null | undefined,
  periodKey: string | null | undefined,
): string {
  if (!periodKey) return "";
  const per = String(periodApi ?? "").toLowerCase();
  if (per === "day") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(periodKey);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return periodKey;
}
