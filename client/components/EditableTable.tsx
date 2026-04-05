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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DeletePopUp from "./DeletePopUp";
import { SkeletonTable } from "@/components/SkeletonTable";
import DeleteStockModal from "./DeleteStockModal";
import { AnimatePresence, motion } from "framer-motion";

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
  <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
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
        <div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
        <div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
              Suspenso
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {row.suspended_at instanceof Date
              ? `Suspenso em ${row.suspended_at.toLocaleDateString()}`
              : row.suspended_at
                ? `Suspenso em ${new Date(row.suspended_at as string).toLocaleDateString()}`
                : "Medicamento suspenso"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
  showAddons = true,
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
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showStockDeleteModal, setShowStockDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const instanceId = useId();
  const { toast } = useToast();
  const router = useRouter();

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

  const handleAddRow = () => {
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
        description:
          err instanceof Error
            ? err.message
            : "Não foi possível remover o item.",
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-end px-4 py-3 border-b bg-accent/40">
        {showAddons && (
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary hover:bg-accent/70 rounded-lg"
          >
            <Plus size={16} /> Adicionar
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max table-auto">
          <thead>
            <tr className="bg-muted border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold text-center whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {showAddons && (
                <th className="px-4 py-3 text-xs font-semibold sticky right-0 bg-muted z-10 min-w-[120px] whitespace-nowrap text-center">
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
                      className={`border-b group ${
                        row
                          ? row.status === "suspended"
                            ? "bg-slate-200 opacity-70"
                            : "hover:bg-accent/40"
                          : "bg-white hover:bg-accent/40"
                      }`}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-4 text-xs text-center align-middle ${
                            !row ? "group-hover:bg-accent/40" : ""
                          }`}
                        >
                          <div className="max-w-[200px] mx-auto">
                            {renderCell(row, col.key)}
                          </div>
                        </td>
                      ))}

                      {showAddons && (
                        <td
                          className={`px-4 py-3 flex justify-center gap-4 sticky right-0 z-10 min-w-[120px] ${
                            row?.status === "suspended"
                              ? "bg-slate-200 opacity-70"
                              : row
                                ? "bg-white group-hover:bg-accent/40"
                                : "bg-white group-hover:bg-accent/40"
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
                                onClick={() => onRemoveIndividual?.(row)}
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
                                  isActive(row)
                                    ? onSuspend?.(row)
                                    : onResume?.(row)
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
        <div className="flex justify-center gap-4 py-4 border-t">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg border ${
              currentPage === 1
                ? "bg-gray-200 text-gray-500"
                : "bg-white text-primary hover:bg-accent/40"
            }`}
          >
            Anterior
          </button>

          <button
            onClick={onNextPage}
            disabled={!hasNextPage}
            className={`px-4 py-2 rounded-lg border ${
              !hasNextPage
                ? "bg-gray-200 text-gray-500"
                : "bg-white text-primary hover:bg-accent/40"
            }`}
          >
            Próximo
          </button>
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

const renderExpiryTag = (row: Record<string, unknown>) => {
  const status =
    typeof row.expirationStatus === "string" ? row.expirationStatus : undefined;
  const message =
    typeof row.expirationMsg === "string" ? row.expirationMsg : undefined;

  if (!status) return "-";

  const colorMap: Record<string, string> = {
    expired: "bg-red-50 text-red-700 border border-red-200",
    critical: "bg-orange-50 text-orange-700 border border-orange-200",
    warning: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    healthy: "bg-sky-50 text-sky-800 border border-sky-200",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`px-2 py-1 rounded-full text-[11px] font-medium ${colorMap[status] || ""}`}
          >
            {typeof row.expiry === "string" ? row.expiry : "-"}
          </span>
        </TooltipTrigger>
        <TooltipContent>{message || "-"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const renderQuantityTag = (row: Record<string, unknown>) => {
  const status =
    typeof row.quantityStatus === "string" ? row.quantityStatus : undefined;
  const message =
    typeof row.quantityMsg === "string" ? row.quantityMsg : undefined;

  const colorMap: Record<string, string> = {
    empty: "bg-red-100 text-red-700 border border-red-300",
    low: "bg-orange-100 text-orange-700 border border-orange-300",
    critical: "bg-red-100 text-red-700 border border-red-300",
    medium: "bg-yellow-100 text-yellow-700 border border-yellow-300",
    high: "bg-sky-100 text-sky-800 border border-sky-300",
    normal: "bg-sky-100 text-sky-800 border border-sky-300",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium cursor-default ${colorMap[status || ""] || ""}`}
          >
            {row.quantity !== null && row.quantity !== undefined
              ? String(row.quantity)
              : "-"}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
