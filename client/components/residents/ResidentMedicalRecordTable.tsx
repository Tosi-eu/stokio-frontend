"use client";

import { useState, useCallback } from "react";
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
import { Pencil } from "lucide-react";
import {
  MEDICAL_RECORD_PERIOD_OPTIONS,
  formatMedicalRecordPeriodLabel,
} from "@/components/residents/medical-record.constants";

function kindLabel(c: ActiveMedicalRecordItem["category"]): string {
  return c === "medicine" ? "Medicine" : "Supply";
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
  const [saving, setSaving] = useState(false);

  const openEdit = useCallback((row: ActiveMedicalRecordItem) => {
    setEditing(row);
    setFreqInput(
      row.applicationFrequency != null ? String(row.applicationFrequency) : "",
    );
    setPeriodValue(row.applicationPeriod?.trim() ?? "");
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
        title: "Incomplete data",
        description: "Could not identify the item.",
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
          title: "Invalid frequency",
          description: "Enter an integer ≥ 1 or clear both fields.",
          variant: "warning",
          duration: 3500,
        });
        return;
      }
      if (!periodValue) {
        toast({
          title: "Period required",
          description: "Select an application period.",
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
      });
      toast({
        title: "Dosage updated",
        description: clearBoth
          ? "Dosage cleared for this item."
          : "Changes saved.",
        variant: "success",
        duration: 3000,
      });
      closeDialog();
      onSaved();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: getErrorMessage(
          err,
          "Could not update dosage.",
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
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Detail</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Frequency
              </th>
              <th className="px-3 py-2 font-medium">Period</th>
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
              return (
                <tr key={key} className="border-b border-border/60">
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
                  {canUpdate && !previewMode ? (
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        aria-label={`Edit dosage: ${row.name}`}
                        disabled={itemId == null}
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Dosage and application</DialogTitle>
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
                  Application frequency
                </Label>
                <Input
                  id="medical-record-freq"
                  inputMode="numeric"
                  value={freqInput}
                  onChange={(e) => setFreqInput(e.target.value)}
                  placeholder="e.g. 3"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Number of times in the period (e.g. 3 times per day).
                </p>
              </div>
              <div className="space-y-1">
                <Label>Period</Label>
                <Select
                  value={periodValue ? periodValue : "__none__"}
                  onValueChange={(v) =>
                    setPeriodValue(v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select period" />
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
              <p className="text-xs text-muted-foreground">
                Leave frequency and period empty and save to remove dosage for
                this item.
              </p>
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
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => void handleSave()}
              disabled={saving || previewMode}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
