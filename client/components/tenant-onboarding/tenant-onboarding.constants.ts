import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Archive,
  BarChart3,
  Bell,
  Grid,
  LayoutDashboard,
  Bandage,
  HeartPulse,
  Pill,
  Shield,
  User,
  Users,
  Warehouse,
  ClipboardList,
} from "lucide-react";

export const TENANT_ONBOARDING_MODULES: Array<{
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    hint: "Resumo e indicadores principais",
    icon: LayoutDashboard,
  },
  {
    key: "residents",
    label: "Residentes",
    hint: "Cadastro e gestão de residentes",
    icon: Users,
  },
  {
    key: "medicines",
    label: "Medicamentos",
    hint: "Medicamentos e estoque farmacêutico",
    icon: Pill,
  },
  {
    key: "inputs",
    label: "Insumos",
    hint: "Materiais e insumos diversos",
    icon: Bandage,
  },
  {
    key: "stock",
    label: "Estoque",
    hint: "Visão consolidada do estoque",
    icon: Warehouse,
  },
  {
    key: "cabinets",
    label: "Armários",
    hint: "Armários e categorias",
    icon: Archive,
  },
  {
    key: "drawers",
    label: "Gavetas",
    hint: "Gavetas e categorias",
    icon: Grid,
  },
  {
    key: "movements",
    label: "Movimentações",
    hint: "Entradas, saídas e transferências",
    icon: ArrowLeftRight,
  },
  {
    key: "reports",
    label: "Relatórios",
    hint: "Relatórios e exportações",
    icon: BarChart3,
  },
  {
    key: "audit",
    label: "Auditoria",
    hint: "Trilhas de alterações e log de acessos",
    icon: ClipboardList,
  },
  {
    key: "notifications",
    label: "Notificações",
    hint: "Alertas e avisos do sistema",
    icon: Bell,
  },
  {
    key: "profile",
    label: "Perfil",
    hint: "Conta, e-mail e senha do usuário",
    icon: User,
  },
  {
    key: "admin",
    label: "Administração",
    hint: "Painel administrativo e configurações",
    icon: Shield,
  },
];

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
