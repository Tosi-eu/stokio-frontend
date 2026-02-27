import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { AlertTriangle } from "lucide-react";
import type { StockItemRaw } from "@/interfaces/interfaces";

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
    fields.push({ label: "Casela", value: display(item.casela_id) });
  } else {
    fields.push({ label: "Gaveta", value: display(item.gaveta_id) });
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
        relative w-full h-[200px] rounded-xl p-5 border shadow-sm transition-all flex flex-col
        ${
          selected
            ? "bg-sky-50 border-sky-600 shadow-md"
            : "bg-white border-slate-300 hover:bg-slate-50"
        }
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {isDisabled && disabledReason && (
        <div className="absolute top-4 right-4 text-yellow-500">
          <AlertTriangle size={18} />
        </div>
      )}

      <div className="font-semibold text-slate-800 text-base mb-3">
        {item.nome}
      </div>

      <div className="flex justify-between gap-6 text-sm text-slate-600">
        <div className="space-y-1">
          {left.map((f, i) => (
            <div key={i}>
              <span className="font-medium text-slate-700">{f.label}:</span>{" "}
              {f.value}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {right.map((f, i) => (
            <div key={i}>
              <span className="font-medium text-slate-700">{f.label}:</span>{" "}
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
