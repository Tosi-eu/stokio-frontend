"use client";

import { useState, useCallback } from "react";
import type { ResidentIssuedMedicalRecord } from "@/api/requests";
import { patchResidentProntuarioItem } from "@/api/requests";
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
  PRONTUARIO_PERIODOS,
  formatProntuarioPeriodoLabel,
} from "@/components/residents/prontuario.constants";

function kindLabel(c: ResidentIssuedMedicalRecord["categoria"]): string {
  return c === "medicamento" ? "Medicamento" : "Insumo";
}

export function ResidentProntuarioTable({
  casela,
  items,
  previewMode,
  canUpdate,
  onSaved,
}: {
  casela: number;
  items: ResidentIssuedMedicalRecord[];
  previewMode: boolean;
  canUpdate: boolean;
  onSaved: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResidentIssuedMedicalRecord | null>(
    null,
  );
  const [freqInput, setFreqInput] = useState("");
  const [periodoValue, setPeriodoValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const openEdit = useCallback((row: ResidentIssuedMedicalRecord) => {
    setEditing(row);
    setFreqInput(
      row.frequencia_aplicacao != null ? String(row.frequencia_aplicacao) : "",
    );
    setPeriodoValue(row.periodo_aplicacao?.trim() ?? "");
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
      editing.categoria === "medicamento"
        ? editing.medicamento_id
        : editing.insumo_id;
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
    const clearBoth = freqTrim === "" && periodoValue === "";

    if (!clearBoth) {
      const n = Number(freqTrim);
      if (!Number.isInteger(n) || n < 1) {
        toast({
          title: "Frequência inválida",
          description:
            "Informe um número inteiro ≥ 1 ou limpe ambos os campos.",
          variant: "warning",
          duration: 3500,
        });
        return;
      }
      if (!periodoValue) {
        toast({
          title: "Período obrigatório",
          description: "Selecione o período de aplicação.",
          variant: "warning",
          duration: 3500,
        });
        return;
      }
    }

    setSaving(true);
    try {
      await patchResidentProntuarioItem(casela, {
        categoria: editing.categoria,
        item_id: itemId,
        frequencia_aplicacao: clearBoth ? null : Number(freqTrim),
        periodo_aplicacao: clearBoth ? null : periodoValue,
      });
      toast({
        title: "Posologia atualizada",
        description: clearBoth
          ? "Registo de posologia removido para este item."
          : "Dados guardados.",
        variant: "success",
        duration: 3000,
      });
      closeDialog();
      onSaved();
    } catch (err: unknown) {
      toast({
        title: "Erro ao guardar",
        description: getErrorMessage(
          err,
          "Não foi possível atualizar a posologia.",
          "Residents:prontuarioPatch",
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
    periodoValue,
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
              <th className="px-3 py-2 font-medium">Observação</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Frequência
              </th>
              <th className="px-3 py-2 font-medium">Período</th>
              {canUpdate && !previewMode ? (
                <th className="px-3 py-2 font-medium w-14"> </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => {
              const itemId =
                row.categoria === "medicamento"
                  ? row.medicamento_id
                  : row.insumo_id;
              const key = `${row.categoria}-${itemId ?? row.nome}-${idx}`;
              return (
                <tr key={key} className="border-b border-border/60">
                  <td className="px-3 py-2">{kindLabel(row.categoria)}</td>
                  <td className="px-3 py-2 font-medium">{row.nome}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.detalhe?.trim() ? row.detalhe : "—"}
                  </td>
                  <td
                    className="px-3 py-2 text-muted-foreground max-w-[200px] truncate"
                    title={row.observacao ?? ""}
                  >
                    {row.observacao?.trim() ? row.observacao : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.frequencia_aplicacao != null
                      ? row.frequencia_aplicacao
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {formatProntuarioPeriodoLabel(row.periodo_aplicacao)}
                  </td>
                  {canUpdate && !previewMode ? (
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        aria-label={`Editar posologia: ${row.nome}`}
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
            <DialogTitle>Posologia e aplicação</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3 py-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {editing.nome}
                </span>{" "}
                · {kindLabel(editing.categoria)}
              </p>
              <div className="space-y-1">
                <Label htmlFor="pront-freq">Frequência de aplicação</Label>
                <Input
                  id="pront-freq"
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
                  value={periodoValue ? periodoValue : "__none__"}
                  onValueChange={(v) =>
                    setPeriodoValue(v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {PRONTUARIO_PERIODOS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe frequência e período vazios e guarde para remover a
                posologia deste item.
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
