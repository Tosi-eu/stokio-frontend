import type { LucideIcon } from "lucide-react";
import { HeartPulse, Pill } from "lucide-react";

export const TENANT_ONBOARDING_SECTOR_OPTIONS: Array<{
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    key: "farmacia",
    label: "Farmácia",
    hint: "Estoque e movimentações no setor farmácia (gráficos e filtros).",
    icon: Pill,
  },
  {
    key: "enfermagem",
    label: "Enfermagem",
    hint: "Estoque no setor enfermagem, quando aplicável ao seu abrigo.",
    icon: HeartPulse,
  },
];
