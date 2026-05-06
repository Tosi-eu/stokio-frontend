import {
  ItemStockType,
  OperationType,
  OriginType,
  SectorType,
} from "@/utils/enums";
import { ReactNode } from "react";
import { StockExpiryStatus, StockQuantityStatus } from "./types";
import type { EffectivePermissionMatrixSerialized } from "@/domain/permission-matrix.types";

export interface RawStockMedicine {
  id?: number;
  estoque_minimo: string;
  dosagem: string;
  nome: string;
  principio_ativo: string;
  unidade_medida: string;
}

export interface RawStockInput {
  id?: number;
  nome: string;
  descricao: string;
  estoque_minimo: number;
}

export interface Column {
  key: string;
  label: string;
  editable?: boolean;
  type?: string | Date;
  enum?: string[];
}

export interface EditableTableProps {
  data: Record<string, unknown>[];
  columns: Column[];
  entityType?: string;
  showAddons?: boolean;
  minRows?: number;
  onAdd?: (newRow: Record<string, unknown>) => void;
  onEdit?: (updatedRow: Record<string, unknown>, index: number) => void;
  onDelete?: (index: number) => void;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface LayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumb?: BreadcrumbItem[];
  minimal?: boolean;
}

export interface DeletePopUpProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message?: string;
}

export interface User {
  email: string;
  password: string;
}

export interface LoggedUser {
  id: number;
  login: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  role?: "admin" | "user";
  tenantId?: number;

  permissions?: {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  permissionMatrix?: EffectivePermissionMatrixSerialized;
  isTenantOwner?: boolean;
  is_tenant_owner?: boolean;
  isSuperAdmin?: boolean;
  is_super_admin?: boolean;
}

export interface AuthContextType {
  user: LoggedUser | null;
  login: (login: string, password: string, tenantSlug: string) => Promise<void>;
  logout: () => void;

  patchStoredUser: (partial: Partial<LoggedUser>) => void;
}

export interface Patient {
  casela: number;
  name: string;
}

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  measurementUnit: string;
  substance: string;
  minimumStock: number;
}

export interface Cabinet {
  numero: number;
  categoria: string;
}

export interface CabinetCategory {
  id: number;
  nome: string;
}

export interface Input {
  id: number;
  name: string;
  description: string;
  minimumStock: number;
}

export interface MedicineInventory {
  id: number;
  medicineId?: number;
  residentId?: number;
  cabinetId: number;
  quantity: number;
  expiry: string;
  origin: OriginType;
  stockType: ItemStockType;
}

export interface InputInventory {
  id: number;
  inputId: number;
  cabinetId: number;
  quantity: number;
}

export interface StockListAlertItem {
  nome?: string;
  principio_ativo?: string;
  descricao?: string | null;
  quantidade?: number;
  minimo?: number;
  validade?: string;
  setor?: string;
  tipo_item?: string;
  st_quantidade?: string | null;
  st_expiracao?: string | null;
  tentativas_busca?: number;
}

export interface StockItemRaw {
  item_id: number;
  estoque_id: number;
  tipo_item: OperationType | string;
  nome: string;
  principio_ativo?: string;
  descricao?: string | null;
  validade: string;
  data_entrada?: string | null;
  data_saida?: string | null;
  quantidade: number;
  minimo?: number;
  origem: string;
  tipo: string;
  paciente?: string | null;
  armario_id?: number | null;
  gaveta_id?: number | null;
  casela_id?: number | null;
  detalhes?: string;
  setor: string;
  status?: string | null;
  suspenso_em?: string | null;
  st_expiracao?: string | null;
  msg_expiracao?: string | null;
  st_quantidade?: string | null;
  msg_quantidade?: string | null;
  lote?: string | null;
  preco?: number | null;
}

export interface StockItem {
  id: number;
  name: string;
  description?: string | null;
  activeSubstance?: string | null;
  dosage?: string | null;
  measurementUnit?: string | null;
  expiry: string;
  entryDate?: string | null;
  exitDate?: string | null;
  quantity: number;
  minimumStock?: number;
  patient?: string;
  cabinet?: number | string;
  drawer?: number | string;
  casela?: number | null;
  itemType: OperationType;
  stockType: ItemStockType | string;
  tipo?: string;
  status?: string | null;
  sector: string;
  suspended_at?: Date | null;
  origin?: string;
  lot?: string | null;
  preco?: number | null;
  expirationStatus: string;
  quantityStatus: string;
  expirationMsg: string;
  quantityMsg: string;
  destino?: string | null;
  detail?: string | null;
  daysToReplacement?: number | null;
  medicamentoId?: number | null;
}

export interface InputFormProps {
  inputs: Input[];
  caselas: Patient[];
  cabinets: Cabinet[];
  drawers: Drawer[];
  isLoading?: boolean;

  onSubmit: (data: {
    inputId: number;
    quantity: number;

    cabinetId?: number | null;
    drawerId?: number | null;

    isEmergencyCart: boolean;

    casela?: number;
    validity?: Date | null;
    stockType: string;
    sector: string;
    lot?: string | null;
    preco?: string;
  }) => void;
}

export interface MedicineFormProps {
  medicines: Medicine[];
  caselas: Patient[];
  cabinets: Cabinet[];
  drawers: Drawer[];
  initialData?: MedicineFormInitialData;
  isLoading?: boolean;

  onSubmit: (data: {
    id: number;
    quantity: number;

    cabinetId?: number | null;
    drawerId?: number | null;
    isEmergencyCart: boolean;

    casela?: number;
    expirationDate: Date;
    origin: string;
    stockType: string;
    sector: string;
    lot?: string | null;
    observacao?: string;
    preco?: string;
  }) => void;
}

export interface RecentMovement {
  name: string;
  type: string;
  operator: string;
  casela: string | number;
  quantity: number;
  patient: string;
  cabinet: string | number;
  date: string;
}

export interface StockStatusItem {
  id: number;
  name: string;
  quantity: number;
  expiry: string | null;
  st_quantidade: StockQuantityStatus;
  st_expiracao: StockExpiryStatus;
  minimo?: number;
  paciente?: string | null;
  armario_id?: number | null;
  casela_id?: number | null;
}

export type { StockProportionResponse } from "@stokio/sdk";

export interface StockDistributionItem {
  name: string;
  value: number;
  rawValue: number;
}

export interface CabinetStockItem {
  cabinet: number;
  total: number;
}

export interface DrawerStockItem {
  drawer: number;
  total: number;
}

export interface MedicineRankingItem {
  name: string;
  substance: string;
  total: number;
  entradas: number;
  saidas: number;
}

export interface RawMovement {
  id?: number;
  tipo?: string;
  quantidade?: number;
  data?: string;

  medicamento_id?: number | null;
  insumo_id?: number | null;
  armario_id?: number | null;
  gaveta_id?: number | null;
  setor?: string | null;
  lote?: string | null;

  MedicineModel?: {
    nome?: string;
    principio_ativo?: string | null;
  };

  InputModel?: {
    nome?: string;
    descricao?: string | null;
  };

  LoginModel?: {
    login?: string;
    first_name?: string;
    last_name?: string;
  };

  ResidentModel?: {
    nome?: string;
    num_casela?: number;
  };

  CabinetModel?: {
    num_armario?: number;
  };

  DrawerModel?: {
    num_gaveta?: number;
    DrawerCategoryModel?: { nome?: string };
  };
}

export interface Drawer {
  numero: number;
  categoria_id?: number;
  categoria: string;
}

export interface DrawerCategory {
  id: number;
  nome: string;
}

export interface MedicineFormInitialData {
  id: number | null;
  quantity: number;
  stockType: ItemStockType;
  expirationDate: Date | null;
  resident: string;
  casela: number | null;
  cabinetId: number | null;
  drawerId: number | null;
  origin: OriginType | "";
  sector: SectorType | "";
}
