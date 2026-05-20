"use client";

import { Fragment, useState, useCallback } from "react";
import type { ActiveMedicalRecordItem } from "@/api/requests";
import { patchResidentMedicalRecordItem } from "@/api/requests";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { ChevronDown, Pencil } from "lucide-react";
import {
  MEDICAL_RECORD_PERIOD_OPTIONS,
  formatMedicalRecordPeriodLabel,
} from "@/components/residents/medical-record.constants";
import { ResidentMedicalRecordSlots } from "@/components/residents/ResidentMedicalRecordSlots";
import { cn } from "@/lib/utils";

function kindLabel(c: ActiveMedicalRecordItem["category"]): string {
  return c === "medicine" ? "Medicamento" : "Insumo";
}

export function ResidentMedicalRecordTable({
  casela,
  items,
  previewMode,
  canUpdate,
  onSaved,
}: {
  casela: number;
  items: ActiveMedicalRecordItem[];
  previewMode: boolean;
  canUpdate: boolean;
  onSaved: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActiveMedicalRecordItem | null>(null);
  const [freqInput, setFreqInput] = useState("");
  const [periodValue, setPeriodValue] = useState<string>("");
  const [doseInput, setDoseInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const colCount = (canUpdate && !previewMode ? 1 : 0) + 9;

  function formatStockProjection(row: ActiveMedicalRecordItem): string {
    if (row.estimatedDaysRemaining == null) return "—";
    if (row.estimatedDaysRemaining <= 0) return "Esgotado";
    const datePart = row.estimatedDepletionDate
      ? ` (${row.estimatedDepletionDate.split("-").reverse().join("/")})`
      : "";
    return `~${row.estimatedDaysRemaining} dia(s)${datePart}`;
  }

  const openEdit = useCallback((row: ActiveMedicalRecordItem) => {
    setEditing(row);
    setFreqInput(
      row.applicationFrequency != null ? String(row.applicationFrequency) : "",
    );
    setPeriodValue(row.applicationPeriod?.trim() ?? "");
    setDoseInput(
      row.applicationDoseQuantity != null
        ? String(row.applicationDoseQuantity)
        : "",
    );
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (saving) return;
    setDialogOpen(false);
    setEditing(null);
  }, [saving]);

  const handleSave = useCallback(async () => {
    if (!editing || previewMode) return;
    const itemId =
      editing.category === "medicine" ? editing.medicineId : editing.supplyId;
    if (itemId == null || !Number.isFinite(itemId)) {
      toast({
        title: "Dados incompletos",
        description: "Não foi possível identificar o item.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    const freqTrim = freqInput.trim();
    const clearBoth = freqTrim === "" && periodValue === "";

    if (!clearBoth) {
      const n = Number(freqTrim);
      if (!Number.isInteger(n) || n < 1) {
        toast({
          title: "Frequência inválida",
          description: "Indique um número inteiro ≥ 1 ou limpe os dois campos.",
          variant: "warning",
          duration: 3500,
        });
        return;
      }
      if (!periodValue) {
        toast({
          title: "Período obrigatório",
          description: "Selecione o período de aplicação.",
          variant: "warning",
          duration: 3500,
        });
        return;
      }
      const doseN = Number(doseInput.trim());
      if (!Number.isInteger(doseN) || doseN < 1) {
        toast({
          title: "Quantidade por aplicação inválida",
          description: "Indique um número inteiro ≥ 1 (unidades por dose).",
          variant: "warning",
          duration: 3500,
        });
        return;
      }
    }

    setSaving(true);
    try {
      await patchResidentMedicalRecordItem(casela, {
        category: editing.category,
        itemId,
        applicationFrequency: clearBoth ? null : Number(freqTrim),
        applicationPeriod: clearBoth ? null : periodValue,
        applicationDoseQuantity: clearBoth ? null : Number(doseInput.trim()),
      });
      toast({
        title: "Dosagem atualizada",
        description: clearBoth
          ? "Dosagem removida para este item."
          : "Alterações guardadas.",
        variant: "success",
        duration: 3000,
      });
      closeDialog();
      onSaved();
    } catch (err: unknown) {
      toast({
        title: "Falha ao guardar",
        description: getErrorMessage(
          err,
          "Não foi possível atualizar a dosagem.",
          "Residents:medicalRecordPatch",
        ),
        variant: "error",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  }, [
    editing,
    previewMode,
    freqInput,
    periodValue,
    doseInput,
    casela,
    closeDialog,
    onSaved,
  ]);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Detalhe</th>
              <th className="px-3 py-2 font-medium">Nota</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Frequência
              </th>
              <th className="px-3 py-2 font-medium">Período</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Qtd/dose
              </th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Estoque
              </th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Previsão
              </th>
              <th className="px-3 py-2 font-medium w-12">Etapas</th>
              {canUpdate && !previewMode ? (
                <th className="px-3 py-2 font-medium w-14"> </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => {
              const itemId =
                row.category === "medicine" ? row.medicineId : row.supplyId;
              const key = `${row.category}-${itemId ?? row.name}-${idx}`;
              const isExpanded = expandedKey === key;
              const hasSlots =
                row.applicationFrequency != null &&
                row.applicationFrequency >= 1 &&
                Boolean(row.applicationPeriod?.trim());
              return (
                <Fragment key={key}>
                  <tr className="border-b border-border/60">
                    <td className="px-3 py-2">{kindLabel(row.category)}</td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.detail?.trim() ? row.detail : "—"}
                    </td>
                    <td
                      className="px-3 py-2 text-muted-foreground max-w-[200px] truncate"
                      title={row.note ?? ""}
                    >
                      {row.note?.trim() ? row.note : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.applicationFrequency != null
                        ? row.applicationFrequency
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {formatMedicalRecordPeriodLabel(row.applicationPeriod)}
                    </td>
                    <td className="px-3 py-2">
                      {row.applicationDoseQuantity != null
                        ? row.applicationDoseQuantity
                        : "—"}
                    </td>
                    <td className="px-3 py-2">{row.stallStockQuantity}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-xs whitespace-nowrap",
                        row.estimatedDaysRemaining != null &&
                          row.estimatedDaysRemaining <= 3 &&
                          "text-destructive font-medium",
                      )}
                    >
                      {formatStockProjection(row)}
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? `Ocultar etapas: ${row.name}`
                            : `Ver etapas: ${row.name}`
                        }
                        disabled={!hasSlots}
                        onClick={() =>
                          setExpandedKey((prev) => (prev === key ? null : key))
                        }
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </Button>
                    </td>
                    {canUpdate && !previewMode ? (
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          aria-label={`Editar dosagem: ${row.name}`}
                          disabled={itemId == null}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                  {isExpanded ? (
                    <tr className="border-b border-border/60">
                      <td colSpan={colCount} className="px-3 py-3 bg-muted/10">
                        <ResidentMedicalRecordSlots
                          casela={casela}
                          row={row}
                          previewMode={previewMode}
                          canUpdate={canUpdate}
                          onSaved={onSaved}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Dosagem e aplicação</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3 py-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {editing.name}
                </span>{" "}
                · {kindLabel(editing.category)}
              </p>
              <div className="space-y-1">
                <Label htmlFor="medical-record-freq">
                  Frequência de aplicação
                </Label>
                <Input
                  id="medical-record-freq"
                  inputMode="numeric"
                  value={freqInput}
                  onChange={(e) => setFreqInput(e.target.value)}
                  placeholder="ex.: 3"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Número de vezes no período (ex.: 3 vezes por dia).
                </p>
              </div>
              <div className="space-y-1">
                <Label>Período</Label>
                <Select
                  value={periodValue ? periodValue : "__none__"}
                  onValueChange={(v) =>
                    setPeriodValue(v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {MEDICAL_RECORD_PERIOD_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="medical-record-dose">
                  Quantidade por aplicação (dose)
                </Label>
                <Input
                  id="medical-record-dose"
                  inputMode="numeric"
                  value={doseInput}
                  onChange={(e) => setDoseInput(e.target.value)}
                  placeholder="ex.: 1"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Unidades baixadas do estoque da casela a cada confirmação.
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={closeDialog}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => void handleSave()}
              disabled={saving || previewMode}
            >
              {saving ? "A guardar…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
