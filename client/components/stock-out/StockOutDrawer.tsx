"use client";

import type { StockItemRaw } from "@/interfaces/interfaces";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { stockOutQuantitySchema } from "@/schemas/stock-out.schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useEffect } from "react";
import { useTenant } from "@/hooks/use-tenant.hook";
import { useDrawerCategoryMap } from "@/hooks/use-drawer-category-map.hook";
import {
  formatCaselaLabel,
  formatGavetaLabel,
} from "@/helpers/storage-location-display.helper";

function deriveItemStatus(item: StockItemRaw) {
  const isSuspended = item.status === "suspended";
  const isOutOfStock = Number(item.quantidade) === 0;
  const isExpired = item.st_expiracao === "expired";
  const disabled = isSuspended || isOutOfStock || isExpired;
  return { disabled, isSuspended, isOutOfStock, isExpired };
}

function display(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = typeof v === "string" ? v : String(v);
  return s.trim() ? s : "—";
}

export type StockOutDrawerProps = {
  open: boolean;
  item: StockItemRaw | null;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (qty: number) => void;
};

export function StockOutDrawer({
  open,
  item,
  submitting,
  onOpenChange,
  onConfirm,
}: StockOutDrawerProps) {
  const { uiDisplay } = useTenant();
  const drawerCategoryByNum = useDrawerCategoryMap();

  const form = useFormWithZod(stockOutQuantitySchema, {
    defaultValues: { quantity: 0 },
  });

  const qty = form.watch("quantity");

  useEffect(() => {
    if (!open) return;
    form.reset({ quantity: 0 });
  }, [open, form]);

  const max = item ? Number(item.quantidade ?? 0) : 0;
  const exceedsStock = Boolean(item) && qty > max;
  const status = item ? deriveItemStatus(item) : null;

  const confirmDisabled =
    !item || status?.disabled || submitting || !qty || qty <= 0 || exceedsStock;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-[min(520px,calc(100vw-3rem))]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Confirmar saída</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 min-h-0 overflow-auto">
          {item ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <div>
                <div className="font-semibold text-foreground">
                  {display(item.nome)}
                </div>
                {item.tipo_item === "medicamento" &&
                String(item.principio_ativo ?? "").trim() ? (
                  <div className="text-sm text-muted-foreground">
                    {display(item.principio_ativo)}
                  </div>
                ) : null}
                <div className="mt-1 text-sm text-muted-foreground">
                  Disponível: <span className="font-medium">{max}</span>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium text-right">
                    {display(item.tipo_item)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Armário</dt>
                  <dd className="font-medium text-right">
                    {display(item.armario_id)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {item.casela_id ? "Casela" : "Gaveta"}
                  </dt>
                  <dd className="font-medium text-right">
                    {item.casela_id
                      ? formatCaselaLabel(uiDisplay.casela, {
                          caselaId: item.casela_id,
                          residentName: item.paciente,
                        })
                      : formatGavetaLabel(uiDisplay.gaveta, {
                          gavetaId: item.gaveta_id ?? undefined,
                          categoriaNome:
                            item.gaveta_id != null
                              ? drawerCategoryByNum.get(item.gaveta_id)
                              : undefined,
                        })}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Paciente</dt>
                  <dd className="font-medium text-right">
                    {display(item.paciente)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Setor</dt>
                  <dd className="font-medium text-right">
                    {display(item.setor)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Origem</dt>
                  <dd className="font-medium text-right">
                    {display(item.origem)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Lote</dt>
                  <dd className="font-medium text-right">
                    {display(item.lote)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Validade</dt>
                  <dd className="font-medium text-right">
                    {display(item.validade)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-right">
                    {display(item.status)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Expiração</dt>
                  <dd className="font-medium text-right">
                    {display(item.msg_expiracao) !== "—"
                      ? display(item.msg_expiracao)
                      : display(item.st_expiracao)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground">Quantidade (status)</dt>
                  <dd className="font-medium text-right">
                    {display(item.msg_quantidade) !== "—"
                      ? display(item.msg_quantidade)
                      : display(item.st_quantidade)}
                  </dd>
                </div>
                {String(item.detalhes ?? "").trim() ? (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Detalhes</dt>
                    <dd className="font-medium text-right">
                      {display(item.detalhes)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              {status?.isSuspended ? (
                <div className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                  Item suspenso — não é possível dar saída.
                </div>
              ) : null}
              {status?.isExpired ? (
                <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                  Item vencido — não é possível dar saída.
                </div>
              ) : null}
              {status?.isOutOfStock ? (
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  Sem estoque disponível.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Selecione um item para continuar.
            </div>
          )}

          <form
            onSubmit={form.handleSubmit((data) => onConfirm(data.quantity))}
            className="space-y-2"
          >
            <label className="block text-sm font-medium text-foreground">
              Quantidade
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              disabled={!item || status?.disabled || submitting}
              aria-invalid={form.formState.errors.quantity ? "true" : "false"}
              className={cn(exceedsStock && "border-red-500")}
              {...form.register("quantity", { valueAsNumber: true })}
            />

            {exceedsStock ? (
              <p className="text-xs font-medium text-red-600">
                Quantidade maior do que o disponível.
              </p>
            ) : null}
            {form.formState.errors.quantity?.message ? (
              <p className="text-xs font-medium text-red-600">
                {form.formState.errors.quantity.message}
              </p>
            ) : null}
          </form>
        </div>

        <DrawerFooter className="border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={() =>
              void form.handleSubmit((d) => onConfirm(d.quantity))()
            }
            disabled={confirmDisabled}
          >
            {submitting ? "Confirmando..." : "Confirmar"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
