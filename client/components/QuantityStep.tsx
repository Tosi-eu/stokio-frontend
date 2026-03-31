import { StockItemRaw } from "@/interfaces/interfaces";
import { StockCard } from "@/components/StockCard";
import clsx from "clsx";

import type { UseFormRegisterReturn } from "react-hook-form";

interface Props {
  item: StockItemRaw | null;
  quantity: number;
  quantityRegister: UseFormRegisterReturn<"quantity">;
  quantityErrors: { quantity?: { message?: string } };
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export default function QuantityStep({
  item,
  quantity,
  quantityRegister,
  quantityErrors,
  isSubmitting,
  onBack,
  onConfirm,
}: Props) {
  if (!item) return null;

  const exceedsStock = quantity > item.quantidade;
  const isInvalid = !quantity || quantity <= 0 || exceedsStock;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
        <div className="bg-accent/40 px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-slate-800">
            Detalhes do Item
          </h2>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <StockCard
              item={item}
              selected={false}
              onSelect={() => {}}
              disabled={false}
            />
          </div>

          <div className="w-full md:w-80 flex flex-col justify-center">
            <label className="block text-sm text-slate-700 mb-2">
              Quantidade
            </label>

            <input
              type="number"
              min={1}
              max={item.quantidade}
              {...quantityRegister}
              placeholder="0"
              disabled={isSubmitting}
              className={clsx(
                "w-full rounded-lg p-3 text-sm transition-all focus:outline-none",
                exceedsStock || quantityErrors.quantity
                  ? "border border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50"
                  : "border border-input focus:ring-2 focus:ring-ring focus:border-primary",
              )}
            />

            <span className="text-xs text-slate-500 mt-2">
              Disponível: {item.quantidade}
            </span>

            {exceedsStock && (
              <span className="text-xs text-red-600 mt-1 font-medium">
                Quantidade maior do que o disponível
              </span>
            )}
            {quantityErrors.quantity && (
              <span className="text-xs text-red-600 mt-1 font-medium">
                {quantityErrors.quantity.message}
              </span>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onBack}
                type="button"
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
              >
                Voltar
              </button>

              <button
                onClick={onConfirm}
                type="button"
                disabled={isInvalid || isSubmitting}
                className={clsx(
                  "flex-1 px-4 py-2 rounded-lg font-semibold transition",
                  isInvalid || isSubmitting
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {isSubmitting ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
