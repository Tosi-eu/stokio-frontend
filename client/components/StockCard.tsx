import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { AlertTriangle } from "lucide-react";
import type { StockItemRaw } from "@/interfaces/interfaces";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useDrawerCategoryMap } from "@/hooks/use-drawer-category-map.hook";
import {
  formatCaselaLabel,
  formatGavetaLabel,
} from "@/helpers/storage-location-display.helper";

interface StockCardProps {
  item: StockItemRaw;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export function StockCard({
  item,
  selected,
  onSelect,
  disabled = false,
}: StockCardProps) {
  const { uiDisplay } = useTenant();
  const drawerCategoryByNum = useDrawerCategoryMap();

  const display = (v: unknown): string | number =>
    v !== null && v !== undefined && v !== ""
      ? typeof v === "number"
        ? v
        : String(v)
      : "N/A";

  const isSuspended = item.status === "suspended";
  const isOutOfStock = Number(item.quantidade) === 0;
  const isExpired = item.st_expiracao === "expired";

  const isDisabled = disabled || isSuspended || isOutOfStock || isExpired;

  const disabledReason = isSuspended
    ? "Medicamento suspenso"
    : isOutOfStock
      ? "Sem estoque disponível"
      : isExpired
        ? "Medicamento vencido"
        : undefined;

  const fields: { label: string; value: string | number }[] = [
    { label: "Nome", value: display(item.nome) },
    { label: "Quantidade", value: display(item.quantidade) },
  ];

  if (item.tipo_item === "medicamento") {
    fields.push({
      label: "Princípio ativo",
      value: display(item.principio_ativo),
    });
  }

  fields.push({ label: "Armário", value: display(item.armario_id) });
  if (item.casela_id) {
    fields.push({
      label: "Casela",
      value: formatCaselaLabel(uiDisplay, {
        caselaId: item.casela_id,
        residentName: item.paciente,
        sector: item.setor,
      }),
    });
  } else {
    const gid = item.gaveta_id;
    fields.push({
      label: "Gaveta",
      value: formatGavetaLabel(uiDisplay.gaveta, {
        gavetaId: gid ?? undefined,
        categoriaNome: gid != null ? drawerCategoryByNum.get(gid) : undefined,
      }),
    });
  }
  fields.push({ label: "Paciente", value: display(item.paciente) });
  fields.push({ label: "Setor", value: display(item.setor) });

  if (item.origem)
    fields.push({ label: "Origem", value: display(item.origem) });

  const mid = Math.ceil(fields.length / 2);
  const left = fields.slice(0, mid);
  const right = fields.slice(mid);

  const card = (
    <div
      onClick={() => {
        if (!isDisabled) onSelect();
      }}
      className={`
        relative w-full min-h-[200px] rounded-xl border p-5 shadow-sm transition-all flex flex-col
        ${
          selected
            ? "bg-accent/60 border-primary ring-1 ring-primary/20"
            : "bg-card border-border hover:bg-muted/40"
        }
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {isDisabled && disabledReason && (
        <div className="absolute top-4 right-4 text-yellow-500">
          <AlertTriangle size={18} />
        </div>
      )}

      <div className="font-semibold text-foreground text-base mb-3 line-clamp-2">
        {item.nome}
      </div>

      <div className="flex justify-between gap-6 text-sm text-muted-foreground">
        <div className="space-y-1">
          {left.map((f, i) => (
            <div key={i}>
              <span className="font-medium text-foreground">{f.label}:</span>{" "}
              {f.value}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {right.map((f, i) => (
            <div key={i}>
              <span className="font-medium text-foreground">{f.label}:</span>{" "}
              {f.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isDisabled || !disabledReason) return card;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
