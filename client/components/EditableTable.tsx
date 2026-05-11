import { useState, useEffect, useMemo, useId } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  PauseCircle,
  PlayCircle,
  UserMinus,
  ArrowLeftRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { setSpaNavigationState } from "@/helpers/spa-navigation-state.helper";
import { EditableTableProps } from "@/interfaces/interfaces";
import { useToast } from "@/hooks/use-toast.hook";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DeletePopUp from "./DeletePopUp";
import { SkeletonTable } from "@/components/SkeletonTable";
import DeleteStockModal from "./DeleteStockModal";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import { getErrorMessage } from "@/helpers/validation.helper";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import type { PermissionResourceKey } from "@/domain/permission-matrix.types";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";
import { cn } from "@/lib/utils";
import { usePersistedColumnWidths } from "@/hooks/use-persisted-column-widths";

import {
  deleteCabinet,
  deleteDrawer,
  deleteInput,
  deleteMedicine,
  deleteResident,
  deleteStockItem,
} from "@/api/requests";

const typeMap: Record<string, string> = {
  Medicamento: "medicines",
  Insumo: "inputs",
};

const toPermissionResourceKey = (
  v: string | null | undefined,
): PermissionResourceKey | null => {
  if (!v) return null;
  const allowed: readonly PermissionResourceKey[] = [
    "dashboard",
    "residents",
    "medicines",
    "inputs",
    "stock",
    "movements",
    "reports",
    "notifications",
    "admin",
    "cabinets",
    "drawers",
    "cabinet_categories",
    "drawer_categories",
    "tenant",
    "imports",
    "profile",
    "medical_record_exports",
  ] as const;
  return (allowed as readonly string[]).includes(v)
    ? (v as PermissionResourceKey)
    : null;
};

const tableVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const rowVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const SkeletonCell = () => (
  <div className="h-4 w-full bg-muted rounded-md animate-pulse" />
);

const SkeletonRow = ({ cols }: { cols: number }) => (
  <motion.tr
    variants={rowVariants}
    initial="initial"
    animate="animate"
    className="border-b"
  >
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonCell />
      </td>
    ))}
    <td className="px-4 py-3">
      <div className="flex justify-center gap-3">
        <div className="h-5 w-5 bg-muted rounded animate-pulse" />
        <div className="h-5 w-5 bg-muted rounded animate-pulse" />
      </div>
    </td>
  </motion.tr>
);

interface StatusBadgeProps {
  row: Record<string, unknown>;
}

const StatusBadge = ({ row }: StatusBadgeProps) => {
  if (!row?.status) return "-";

  if (row.status === "suspended") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            Suspenso
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {row.suspended_at instanceof Date
            ? `Suspenso em ${formatDateToPtBr(row.suspended_at)}`
            : row.suspended_at
              ? `Suspenso em ${formatDateToPtBr(row.suspended_at as string)}`
              : "Medicamento suspenso"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
      Ativo
    </span>
  );
};

export default function EditableTable({
  data,
  columns,
  entityType,
  columnWidthKey,
  showAddons = true,
  readOnly = false,
  currentPage = 1,
  hasNextPage = false,
  loading = false,
  onNextPage,
  onPrevPage,
  onRemoveIndividual,
  onTransferSector,
  onSuspend,
  onResume,
  onDeleteSuccess,
  minRows = 5,
}: EditableTableProps & {
  entityType?: string;
  showAddons?: boolean;
  readOnly?: boolean;
  currentPage?: number;
  hasNextPage?: boolean;
  minRows?: number;
  loading?: boolean;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onRemoveIndividual?: (row: Record<string, unknown>) => void;
  onTransferSector?: (row: Record<string, unknown>) => void;
  onSuspend?: (row: Record<string, unknown>) => void;
  onResume?: (row: Record<string, unknown>) => void;
  onDeleteSuccess?: () => void;
}) {
  const effectiveShowAddons = showAddons && !readOnly;
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showStockDeleteModal, setShowStockDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const instanceId = useId();
  const { toast } = useToast();
  const router = useRouter();
  const { can, canMovementTipo } = usePermissionMatrix();

  const columnWidthsStorageSuffix = columnWidthKey ?? entityType ?? "default";
  const { colWidths, startResize, resetColumnWidth, hasCustomWidths } =
    usePersistedColumnWidths(columnWidthsStorageSuffix);

  useEffect(() => {
    setRows(data);
  }, [data]);

  const displayRows = useMemo(() => {
    if (rows.length >= minRows) return rows;

    return [
      ...rows,
      ...Array.from({ length: minRows - rows.length }, () => null),
    ];
  }, [rows, minRows]);

  const isIndividualMedicine = (row: Record<string, unknown>): boolean =>
    row?.casela !== "-" &&
    typeof row?.stockType === "string" &&
    row.stockType.includes("individual");

  const isActive = (row: Record<string, unknown>): boolean =>
    row?.status === "active";

  const disabledActionClass =
    "opacity-40 cursor-not-allowed pointer-events-none";

  const resourceKey = useMemo(() => {
    const key =
      entityType === "entries" || entityType === "exits" ? "stock" : entityType;
    return toPermissionResourceKey(key ?? null);
  }, [entityType]);

  const requirePermission = (
    ok: boolean,
    message: string = "Você não tem permissão para realizar esta ação.",
  ): boolean => {
    if (ok) return true;
    toast({
      title: "Sem permissão",
      description: message,
      variant: "error",
      duration: 3000,
    });
    return false;
  };

  const handleAddRow = () => {
    if (
      resourceKey &&
      !requirePermission(
        can(resourceKey, "create"),
        "Você não tem permissão para criar novos registros.",
      )
    ) {
      return;
    }

    const routes: Record<string, string> = {
      entries: "/stock/in",
      exits: "/stock/out",
      stock: "/stock/in",
      medicines: "/medicines/register",
      residents: "/residents/register",
      inputs: "/inputs/register",
      cabinets: "/cabinets/register",
      drawers: "/drawer/register",
    };

    const route = routes[entityType ?? ""];
    if (route) router.push(route);
  };

  const canTransfer = (row: Record<string, unknown>): boolean => {
    return entityType === "stock" && row?.itemType != null;
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    if (row.status === "suspended") {
      toast({
        title: "Medicamento suspenso",
        description: "Reative o medicamento para poder editá-lo.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    let type = typeMap[String(row?.type ?? "")];
    if (entityType) type = entityType;

    if (!type) return;

    if (
      !requirePermission(
        can(toPermissionResourceKey(type) ?? "dashboard", "update"),
        "Você não tem permissão para editar este item.",
      )
    ) {
      return;
    }

    if (entityType === "stock") {
      setSpaNavigationState({ item: row });
      router.push("/stock/edit");
      return;
    }

    setSpaNavigationState({ item: row });
    router.push(`/${type}/edit`);
  };

  const renderCell = (
    row: Record<string, unknown> | null,
    colKey: string,
  ): React.ReactNode => {
    if (!row) return "\u00A0";

    switch (colKey) {
      case "status":
        return <StatusBadge row={row} />;

      case "preco": {
        const v = row[colKey];
        if (v === null || v === undefined || v === "") return "-";
        const num = typeof v === "number" ? v : Number(v);
        if (Number.isNaN(num)) return "-";
        return `R$ ${num.toFixed(2)}`;
      }

      case "expiry":
        return renderExpiryTag(row);

      case "quantity":
        return renderQuantityTag(row);

      case "daysToReplacement": {
        const value = row[colKey];
        if (value === null || value === undefined) return "-";
        const numValue = typeof value === "number" ? value : Number(value);
        return isNaN(numValue)
          ? "-"
          : `${numValue} ${numValue === 1 ? "dia" : "dias"}`;
      }

      default: {
        const value = row[colKey];
        return value !== null && value !== undefined ? String(value) : "-";
      }
    }
  };

  const handleDeleteConfirmed = async () => {
    if (deleteIndex === null) return;
    const row = rows[deleteIndex];
    if (!row) return;

    if (resourceKey && !can(resourceKey, "delete")) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para excluir este item.",
        variant: "error",
        duration: 3000,
      });
      setDeleteIndex(null);
      setShowStockDeleteModal(false);
      return;
    }

    setIsDeleting(true);
    try {
      if (entityType === "cabinets") {
        const numero =
          typeof row.numero === "number" ? row.numero : Number(row.numero);
        if (isNaN(numero)) throw new Error("Número inválido");
        await deleteCabinet(numero);
      } else if (entityType === "drawers") {
        const numero =
          typeof row.numero === "number" ? row.numero : Number(row.numero);
        if (isNaN(numero)) throw new Error("Número inválido");
        await deleteDrawer(numero);
      } else if (entityType === "inputs") {
        const id = typeof row.id === "number" ? row.id : Number(row.id);
        if (isNaN(id)) throw new Error("ID inválido");
        await deleteInput(id);
      } else if (entityType === "medicines") {
        const id = typeof row.id === "number" ? row.id : Number(row.id);
        if (isNaN(id)) throw new Error("ID inválido");
        await deleteMedicine(id);
      } else if (entityType === "residents") {
        const casela =
          typeof row.casela === "number"
            ? row.casela
            : typeof row.casela === "string"
              ? Number(row.casela)
              : Number(row.casela);
        if (isNaN(casela)) throw new Error("Casela inválida");
        await deleteResident(casela);
      } else if (entityType === "stock") {
        const id = typeof row.id === "number" ? row.id : Number(row.id);
        if (isNaN(id)) throw new Error("ID inválido");
        const itemType = row.itemType as "medicamento" | "insumo";
        if (
          !itemType ||
          (itemType !== "medicamento" && itemType !== "insumo")
        ) {
          throw new Error("Tipo de item inválido");
        }
        await deleteStockItem(id, itemType);
      }

      toast({ title: "Item removido", variant: "success", duration: 3000 });
      setRows((prev) => prev.filter((_, i) => i !== deleteIndex));

      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

      if (entityType === "stock") {
        setShowStockDeleteModal(false);
      }
      setDeleteIndex(null);
    } catch (err: unknown) {
      toast({
        title: "Erro ao remover item",
        description: getErrorMessage(
          err,
          "Não foi possível remover o item.",
          "EditableTable:delete",
        ),
        variant: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <SkeletonTable rows={minRows} cols={columns.length} />;
  }

  return (
    <div className={cn(pageSurfaceCardClass)}>
      <div className="flex justify-end px-3 sm:px-4 py-3 border-b border-border/60 bg-muted/30 backdrop-blur-[2px]">
        {effectiveShowAddons && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="rounded-xl border-primary/20 bg-background/80 hover:bg-primary/5"
          >
            <Plus size={16} /> Adicionar
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full min-w-max",
            hasCustomWidths ? "table-fixed" : "table-auto",
          )}
        >
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={
                  colWidths[col.key]
                    ? { width: `${colWidths[col.key]}px` }
                    : undefined
                }
              />
            ))}
            {effectiveShowAddons ? <col /> : null}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-border/60 bg-muted/95 shadow-sm backdrop-blur-sm">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="relative px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center whitespace-nowrap"
                >
                  {col.label}
                  <span
                    role="separator"
                    aria-orientation="vertical"
                    title="Arraste para redimensionar. Duplo clique para repor."
                    onMouseDown={(e) => startResize(col.key, e)}
                    onDoubleClick={(e) => resetColumnWidth(col.key, e)}
                    className="absolute right-0 top-0 z-[1] h-full w-2 cursor-col-resize select-none opacity-40 hover:opacity-100"
                  />
                </th>
              ))}
              {effectiveShowAddons && (
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sticky right-0 top-0 bg-muted/95 backdrop-blur-sm z-30 min-w-[120px] whitespace-nowrap text-center border-l border-border/40 shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.06)]">
                  Ações
                </th>
              )}
            </tr>
          </thead>

          <AnimatePresence mode="wait">
            <motion.tbody
              key={`${instanceId}-${loading}-${currentPage}`}
              variants={tableVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {loading
                ? Array.from({ length: minRows }).map((_, i) => (
                    <SkeletonRow key={i} cols={columns.length} />
                  ))
                : displayRows.map((row, i) => (
                    <motion.tr
                      key={i}
                      variants={rowVariants}
                      initial="initial"
                      animate="animate"
                      className={`border-b border-border/50 group transition-colors duration-200 ${
                        row
                          ? row.status === "suspended"
                            ? "bg-muted/70"
                            : "hover:bg-muted/50"
                          : "bg-card/50 hover:bg-muted/40"
                      }`}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-xs text-center align-middle ${
                            !row ? "group-hover:bg-muted/30" : ""
                          }`}
                        >
                          <div
                            className="mx-auto min-w-0 max-w-full break-words text-center"
                            style={{
                              maxWidth: colWidths[col.key]
                                ? `${colWidths[col.key]}px`
                                : "200px",
                            }}
                          >
                            {renderCell(row, col.key)}
                          </div>
                        </td>
                      ))}

                      {effectiveShowAddons && (
                        <td
                          className={`px-4 py-3 flex justify-center gap-4 sticky right-0 z-10 min-w-[120px] border-l border-border/30 shadow-[-8px_0_16px_-8px_rgba(0,0,0,0.05)] ${
                            row?.status === "suspended"
                              ? "bg-muted/70"
                              : row
                                ? "bg-card group-hover:bg-muted/50"
                                : "bg-card/80 group-hover:bg-muted/40"
                          }`}
                        >
                          {row && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditClick(row)}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-primary hover:text-primary/90 hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Editar"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    resourceKey &&
                                    !requirePermission(
                                      can(resourceKey, "delete"),
                                      "Você não tem permissão para excluir itens.",
                                    )
                                  ) {
                                    return;
                                  }
                                  if (entityType === "stock") {
                                    setDeleteIndex(i);
                                    setShowStockDeleteModal(true);
                                  } else {
                                    setDeleteIndex(i);
                                  }
                                }}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-red-600 hover:text-red-800 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                aria-label="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    !requirePermission(
                                      can("stock", "update"),
                                      "Você não tem permissão para alterar associações no estoque.",
                                    )
                                  ) {
                                    return;
                                  }
                                  onRemoveIndividual?.(row);
                                }}
                                disabled={!isIndividualMedicine(row)}
                                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-orange-600 hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                                  !isIndividualMedicine(row) &&
                                  disabledActionClass
                                }`}
                                aria-label="Remover individual"
                              >
                                <UserMinus size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  (() => {
                                    if (
                                      !requirePermission(
                                        can("stock", "update"),
                                        "Você não tem permissão para alterar este item.",
                                      )
                                    ) {
                                      return;
                                    }
                                    if (isActive(row)) onSuspend?.(row);
                                    else onResume?.(row);
                                  })()
                                }
                                disabled={!isIndividualMedicine(row)}
                                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus:outline-none focus-visible:ring-2 ${
                                  isActive(row)
                                    ? "text-yellow-600 hover:bg-amber-50 focus-visible:ring-amber-500"
                                    : "text-primary hover:bg-primary/10 focus-visible:ring-primary"
                                } ${
                                  !isIndividualMedicine(row) &&
                                  disabledActionClass
                                }`}
                                aria-label={
                                  isActive(row) ? "Suspender" : "Retomar"
                                }
                              >
                                {isActive(row) ? (
                                  <PauseCircle size={16} />
                                ) : (
                                  <PlayCircle size={16} />
                                )}
                              </button>
                              {entityType === "stock" && onTransferSector && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!canTransfer(row)) return;
                                    if (
                                      !requirePermission(
                                        canMovementTipo("transferencia"),
                                        "Você não tem permissão para transferir itens (transferência de estoque).",
                                      )
                                    ) {
                                      return;
                                    }
                                    onTransferSector(row);
                                  }}
                                  disabled={!canTransfer(row)}
                                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                    !canTransfer(row) && disabledActionClass
                                  }`}
                                  aria-label="Transferir setor"
                                >
                                  <ArrowLeftRight size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>

      {(onNextPage || onPrevPage) && (
        <div className="flex flex-wrap items-center justify-center gap-3 py-4 px-4 border-t border-border/60 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="min-w-[6.5rem] rounded-xl"
          >
            Anterior
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="min-w-[6.5rem] rounded-xl"
          >
            Próximo
          </Button>
        </div>
      )}

      {entityType === "stock" ? (
        <DeleteStockModal
          open={showStockDeleteModal && deleteIndex !== null}
          onCancel={() => {
            if (!isDeleting) {
              setShowStockDeleteModal(false);
              setDeleteIndex(null);
            }
          }}
          onConfirm={handleDeleteConfirmed}
          itemName={
            deleteIndex !== null && rows[deleteIndex]?.name
              ? String(rows[deleteIndex].name)
              : undefined
          }
          itemType={
            deleteIndex !== null && rows[deleteIndex]?.itemType
              ? (String(rows[deleteIndex].itemType) as "medicamento" | "insumo")
              : undefined
          }
          loading={isDeleting}
        />
      ) : (
        <DeletePopUp
          open={deleteIndex !== null}
          onCancel={() => setDeleteIndex(null)}
          onConfirm={handleDeleteConfirmed}
          message="Tem certeza que deseja remover este item?"
        />
      )}
    </div>
  );
}

function readRowString(
  row: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const v = row[key];
    if (v == null) continue;
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      return String(v);
    }
  }
  return "";
}

function readRowNumber(
  row: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const v = row[key];
    if (v == null) continue;
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function parseDisplayDateForExpiry(s: string): Date | null {
  const t = s.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      12,
      0,
      0,
      0,
    );
  }
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (br) {
    return new Date(
      Number(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
      12,
      0,
      0,
      0,
    );
  }
  return null;
}

function fallbackExpiryStatusKeyFromLabel(expiryLabel: string): string | null {
  const d = parseDisplayDateForExpiry(expiryLabel);
  if (!d || Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "expired";
  if (diff <= 30) return "critical";
  if (diff <= 45) return "warning";
  return "healthy";
}

function fallbackQuantityStatusKey(
  quantity: number,
  minimumStock: number,
): string {
  const min = minimumStock;
  const lowMax = min * 1.35;
  const highThreshold = min * 3;
  if (quantity >= highThreshold) return "high";
  if (quantity >= min && quantity <= lowMax) return "low";
  if (quantity > lowMax && quantity < highThreshold) return "medium";
  return "critical";
}

function normalizeExpiryStatusKey(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (k === "ok") return "healthy";
  return k;
}

function normalizeQuantityStatusKey(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (k === "ok" || k === "normal") return "high";
  if (k === "zero") return "empty";
  return k;
}

const EXPIRY_TOOLTIP_BY_STATUS: Record<string, string> = {
  expired: "Produto fora da validade.",
  critical: "Validade em 30 dias ou menos.",
  warning: "Validade entre 31 e 45 dias.",
  healthy: "Validade superior a 45 dias.",
};

const QUANTITY_TOOLTIP_BY_STATUS: Record<string, string> = {
  empty: "Sem unidades em stock.",
  low: "Quantidade no limite inferior (perto do mínimo).",
  critical: "Quantidade abaixo do mínimo definido.",
  medium: "Quantidade entre faixa média e alta.",
  high: "Quantidade confortável em relação ao mínimo.",
  normal: "Quantidade confortável em relação ao mínimo.",
};

const renderExpiryTag = (row: Record<string, unknown>) => {
  const expiryText =
    typeof row.expiry === "string" ? row.expiry : String(row.expiry ?? "-");

  const rawApi = readRowString(row, "expirationStatus", "st_expiracao");
  const message = readRowString(row, "expirationMsg", "msg_expiracao");

  let status = rawApi ? normalizeExpiryStatusKey(rawApi) : "";
  if (!status && expiryText && expiryText !== "-") {
    status = fallbackExpiryStatusKeyFromLabel(expiryText) ?? "";
  }

  const colorMap: Record<string, string> = {
    expired: "bg-red-50 text-red-800 border border-red-200",
    critical: "bg-orange-50 text-orange-800 border border-orange-200",
    warning: "bg-amber-50 text-amber-900 border border-amber-200",
    healthy:
      "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800",
  };

  const badgeClass = status
    ? (colorMap[status] ??
      "bg-muted text-foreground border border-border font-medium")
    : "bg-muted/80 text-muted-foreground border border-border font-medium";

  const tooltipBody =
    message ||
    (status ? EXPIRY_TOOLTIP_BY_STATUS[status] : null) ||
    "Validade do item.";

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex max-w-full justify-center px-2 py-1 rounded-full text-[11px] font-medium cursor-default ${badgeClass}`}
        >
          {expiryText}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <p className="font-medium text-popover-foreground">{tooltipBody}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const renderQuantityTag = (row: Record<string, unknown>) => {
  const qNum = readRowNumber(row, "quantity", "quantidade");
  const qDisplay =
    row.quantity !== null && row.quantity !== undefined
      ? String(row.quantity)
      : "-";

  const minStock = readRowNumber(
    row,
    "minimumStock",
    "minimo",
    "estoque_minimo",
  );

  const rawApi = readRowString(row, "quantityStatus", "st_quantidade");
  const message = readRowString(row, "quantityMsg", "msg_quantidade");

  let status = rawApi ? normalizeQuantityStatusKey(rawApi) : "";
  if (!status && qDisplay !== "-") {
    status = fallbackQuantityStatusKey(qNum, minStock);
  }

  const colorMap: Record<string, string> = {
    empty: "bg-red-50 text-red-800 border border-red-200",
    low: "bg-orange-50 text-orange-800 border border-orange-200",
    critical: "bg-red-50 text-red-900 border border-red-300",
    medium: "bg-amber-50 text-amber-900 border border-amber-200",
    high: "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800",
    normal:
      "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-800",
  };

  const badgeClass = status
    ? (colorMap[status] ??
      "bg-muted text-foreground border border-border font-medium")
    : "bg-muted/80 text-muted-foreground border border-border font-medium";

  const tooltipBody =
    message ||
    (status ? QUANTITY_TOOLTIP_BY_STATUS[status] : null) ||
    `Quantidade: ${qDisplay}.`;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-medium cursor-default ${badgeClass}`}
        >
          {qDisplay}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-xs">
        <p className="font-medium text-popover-foreground">{tooltipBody}</p>
        {minStock > 0 ? (
          <p className="text-muted-foreground mt-1">Mínimo: {minStock}</p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
};
