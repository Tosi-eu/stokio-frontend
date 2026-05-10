"use client";

import type {
  MedicalRecordExportAvailableRow,
  MedicalRecordVersionRow,
} from "@/api/requests";
import { formatDateTimePtBr } from "@/helpers/dates.helper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { TABLE_HEAD } from "@/components/medical-record-exports/medical-record-exports.constants";
import { FormatBadge } from "@/components/medical-record-exports/medical-record-exports.shared";

export function MedicalRecordVersionsDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: MedicalRecordExportAvailableRow | null;
  versionFilterFrom: string;
  setVersionFilterFrom: (v: string) => void;
  versionFilterTo: string;
  setVersionFilterTo: (v: string) => void;
  modalVersionsFiltered: MedicalRecordVersionRow[];
  downloadingId: string | null;
  onDownload: (
    jobId: string,
    casela: string,
    generatedAt: string | null | undefined,
    formatRaw: string | null | undefined,
  ) => void;
}) {
  const {
    open,
    onOpenChange,
    row,
    versionFilterFrom,
    setVersionFilterFrom,
    versionFilterTo,
    setVersionFilterTo,
    modalVersionsFiltered,
    downloadingId,
    onDownload,
  } = props;

  const versions = row?.versions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,800px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="shrink-0 px-6 pb-4 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle>
              Versões do prontuário · casela {row?.casela ?? "—"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {row?.residentName}
            </DialogDescription>
          </DialogHeader>
        </div>
        {versions.length > 0 ? (
          <div className="shrink-0 space-y-4 border-t bg-muted/20 px-6 py-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid min-w-[140px] gap-1.5">
                <Label htmlFor="version-from" className="text-xs">
                  Data inicial
                </Label>
                <Input
                  id="version-from"
                  type="date"
                  className="rounded-lg"
                  value={versionFilterFrom}
                  onChange={(e) => setVersionFilterFrom(e.target.value)}
                />
              </div>
              <div className="grid min-w-[140px] gap-1.5">
                <Label htmlFor="version-to" className="text-xs">
                  Data final
                </Label>
                <Input
                  id="version-to"
                  type="date"
                  className="rounded-lg"
                  value={versionFilterTo}
                  onChange={(e) => setVersionFilterTo(e.target.value)}
                />
              </div>
              {versionFilterFrom || versionFilterTo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mb-0.5"
                  onClick={() => {
                    setVersionFilterFrom("");
                    setVersionFilterTo("");
                  }}
                >
                  Limpar datas
                </Button>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              A mostrar {modalVersionsFiltered.length} de {versions.length}{" "}
              versão(ões)
              {(versionFilterFrom || versionFilterTo) &&
              modalVersionsFiltered.length === 0
                ? " — nenhuma neste intervalo."
                : "."}
            </p>
          </div>
        ) : null}
        {versions.length > 0 ? <Separator /> : null}
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto px-6 py-5">
          {versions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma versão guardada.
            </p>
          ) : modalVersionsFiltered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma versão neste intervalo de datas. Ajuste ou limpe os
              filtros.
            </p>
          ) : (
            <div className="rounded-lg border border-border/80">
              <Table>
                <TableHeader>
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className={`${TABLE_HEAD} w-12 px-3 py-2`}>
                      #
                    </TableHead>
                    <TableHead
                      className={`${TABLE_HEAD} whitespace-nowrap px-3 py-2`}
                    >
                      Gerado em
                    </TableHead>
                    <TableHead className={`${TABLE_HEAD} px-3 py-2`}>
                      Tipo
                    </TableHead>
                    <TableHead className={`${TABLE_HEAD} px-3 py-2`}>
                      Quem gerou
                    </TableHead>
                    <TableHead className={`${TABLE_HEAD} px-3 py-2 text-right`}>
                      Baixou
                    </TableHead>
                    <TableHead
                      className={`${TABLE_HEAD} w-[7rem] px-3 py-2 text-right`}
                    >
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalVersionsFiltered.map((v) => (
                    <TableRow
                      key={v.jobId}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="px-3 py-2 tabular-nums text-sm">
                        {v.versionIndex}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                        {formatDateTimePtBr(v.generatedAt)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm">
                        <FormatBadge format={v.format} />
                      </TableCell>
                      <TableCell className="max-w-[180px] px-3 py-2 text-sm">
                        <span
                          className="block truncate"
                          title={v.actorLogin ?? undefined}
                        >
                          {v.actorDisplayName ?? v.actorLogin ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right tabular-nums text-sm">
                        {v.downloadCount}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={downloadingId === v.jobId}
                          onClick={() =>
                            void onDownload(
                              v.jobId,
                              row?.casela ?? "",
                              v.generatedAt,
                              v.format,
                            )
                          }
                        >
                          <Download className="mr-1 h-3.5 w-3.5" aria-hidden />
                          {downloadingId === v.jobId ? "…" : "Baixar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
