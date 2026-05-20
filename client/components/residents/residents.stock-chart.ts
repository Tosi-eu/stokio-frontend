import type { ActiveMedicalRecordItem } from "@/api/requests";
import { formatMedicalRecordPeriodLabel } from "@/components/residents/medical-record.constants";

export function activeMedicalRecordToChartRows(
  items: ActiveMedicalRecordItem[],
): Record<string, unknown>[] {
  return items.map((i) => ({
    kind: i.category === "medicine" ? "Medicine" : "Supply",
    name: i.name,
    detail: i.detail?.trim() ? i.detail : "—",
    note: i.note?.trim() ? i.note : "—",
    frequency:
      i.applicationFrequency != null ? String(i.applicationFrequency) : "—",
    period: formatMedicalRecordPeriodLabel(i.applicationPeriod),
  }));
}

export function residentInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
