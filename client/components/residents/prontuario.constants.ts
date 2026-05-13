export const PRONTUARIO_PERIODOS = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "quinzena", label: "Quinzena" },
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
] as const;

export function formatProntuarioPeriodoLabel(
  raw: string | null | undefined,
): string {
  if (raw == null || String(raw).trim() === "") return "—";
  const v = String(raw).trim().toLowerCase();
  const found = PRONTUARIO_PERIODOS.find((p) => p.value === v);
  return found?.label ?? raw;
}
