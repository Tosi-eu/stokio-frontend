"use client";

import { useCallback, useMemo, useState } from "react";
import type { ActiveMedicalRecordItem } from "@/api/requests";
import { patchResidentMedicalRecordSlot } from "@/api/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import {
  formatMedicalRecordPeriodKeyLabel,
  formatMedicalRecordPeriodLabel,
} from "@/components/residents/medical-record.constants";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function itemIdFor(row: ActiveMedicalRecordItem): number | null {
  return row.category === "medicine" ? row.medicineId : row.supplyId;
}

function formatCompletedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ResidentMedicalRecordSlots({
  casela,
  row,
  previewMode,
  canUpdate,
  onSaved,
}: {
  casela: number;
  row: ActiveMedicalRecordItem;
  previewMode: boolean;
  canUpdate: boolean;
  onSaved: () => void;
}) {
  const freq = row.applicationFrequency;
  const hasPosology =
    freq != null && freq >= 1 && Boolean(row.applicationPeriod?.trim());

  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [timeDrafts, setTimeDrafts] = useState<Record<number, string>>({});

  const slots = useMemo(() => {
    if (!hasPosology) return [];
    const fromApi = row.applicationSlots ?? [];
    if (fromApi.length >= (freq ?? 0)) return fromApi;
    return Array.from({ length: freq ?? 0 }, (_, index) => ({
      index,
      scheduledTime: null,
      completedAt: null,
    }));
  }, [hasPosology, row.applicationSlots, freq]);

  const completedCount = slots.filter((s) => s.completedAt).length;

  const getDraftTime = useCallback(
    (slotIndex: number, scheduledTime: string | null) => {
      if (timeDrafts[slotIndex] !== undefined) return timeDrafts[slotIndex];
      return scheduledTime ?? "";
    },
    [timeDrafts],
  );

  const runSlotAction = useCallback(
    async (
      slotIndex: number,
      action: "setTime" | "complete" | "uncomplete",
      scheduledTime?: string,
    ) => {
      const itemId = itemIdFor(row);
      if (itemId == null) return;
      setPendingSlot(slotIndex);
      try {
        await patchResidentMedicalRecordSlot(casela, {
          category: row.category,
          itemId,
          slotIndex,
          action,
          ...(scheduledTime ? { scheduledTime } : {}),
        });
        setTimeDrafts((prev) => {
          const next = { ...prev };
          delete next[slotIndex];
          return next;
        });
        onSaved();
      } catch (err: unknown) {
        toast({
          title: "Não foi possível atualizar a etapa",
          description: getErrorMessage(
            err,
            "Tente novamente.",
            "Residents:medicalRecordSlot",
          ),
          variant: "error",
          duration: 4000,
        });
      } finally {
        setPendingSlot(null);
      }
    },
    [casela, row, onSaved],
  );

  if (!hasPosology) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Defina frequência e período para gerir etapas de aplicação.
      </p>
    );
  }

  const periodLabel = formatMedicalRecordPeriodLabel(row.applicationPeriod);
  const periodKeyLabel = formatMedicalRecordPeriodKeyLabel(
    row.applicationPeriod,
    row.periodKey,
  );

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Período:{" "}
          <span className="text-foreground font-medium">{periodLabel}</span>
          {periodKeyLabel ? (
            <>
              {" "}
              · <span className="text-foreground">{periodKeyLabel}</span>
            </>
          ) : null}
        </span>
        <span className="font-medium text-foreground">
          {completedCount}/{freq} concluída{freq === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="space-y-2">
        {slots.map((slot) => {
          const draft = getDraftTime(slot.index, slot.scheduledTime);
          const hasValidTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(draft.trim());
          const isDone = Boolean(slot.completedAt);
          const busy = pendingSlot === slot.index;

          return (
            <li
              key={slot.index}
              className={cn(
                "flex flex-col gap-2 rounded-lg border border-border/50 bg-background/80 p-2 sm:flex-row sm:items-center sm:gap-3",
                isDone && "border-primary/25 bg-primary/[0.04]",
              )}
            >
              <span className="text-sm font-medium shrink-0 w-20">
                Etapa {slot.index + 1}
              </span>
              <Input
                type="time"
                className="h-9 w-full sm:w-[130px] rounded-lg"
                value={draft}
                disabled={!canUpdate || previewMode || isDone || busy}
                onChange={(e) =>
                  setTimeDrafts((prev) => ({
                    ...prev,
                    [slot.index]: e.target.value,
                  }))
                }
                onBlur={() => {
                  if (!canUpdate || previewMode || isDone) return;
                  const t = draft.trim();
                  if (t && t !== (slot.scheduledTime ?? "")) {
                    void runSlotAction(slot.index, "setTime", t);
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {isDone ? (
                  <>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {formatCompletedAt(slot.completedAt!)}
                    </span>
                    {canUpdate && !previewMode ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg text-xs"
                        disabled={busy}
                        onClick={() =>
                          void runSlotAction(slot.index, "uncomplete")
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" aria-hidden />
                        Desfazer
                      </Button>
                    ) : null}
                  </>
                ) : canUpdate && !previewMode ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    disabled={!hasValidTime || busy}
                    onClick={() =>
                      void runSlotAction(slot.index, "complete", draft.trim())
                    }
                  >
                    Concluir
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
