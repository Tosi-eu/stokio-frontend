"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MedicalRecordExportJobRow } from "@/api/requests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { TABLE_HEAD } from "@/components/medical-record-exports/medical-record-exports.constants";
import {
  EmptyStateCard,
  FormatBadge,
  HistoryTableSkeleton,
  StatusLabel,
} from "@/components/medical-record-exports/medical-record-exports.shared";
import { formatDateTimePtBr } from "@/helpers/dates.helper";

export type MedicalRecordExportsHistorySectionProps = {
  historyLoading: boolean;
  rows: MedicalRecordExportJobRow[];
  total: number;
  historyPage: number;
  setHistoryPage: Dispatch<SetStateAction<number>>;
  historyTotalPages: number;
  historyFrom: number;
  historyTo: number;
  caselaFilter: string;
  setCaselaFilterAndResetPage: (value: string) => void;
  historyCaselaOptions: Array<{ casela: string; label: string }>;
  truncated: boolean;
  handleDownloadHistoryRow: (row: MedicalRecordExportJobRow) => Promise<void>;
  downloadingId: string | null;
};

export function MedicalRecordExportsHistorySection(
  props: MedicalRecordExportsHistorySectionProps,
) {
  const {
    historyLoading,
    rows,
    total,
    historyPage,
    setHistoryPage,
    historyTotalPages,
    historyFrom,
    historyTo,
    caselaFilter,
    setCaselaFilterAndResetPage,
    historyCaselaOptions,
    truncated,
    handleDownloadHistoryRow,
    downloadingId,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de pedidos</CardTitle>
        <CardDescription className="text-[15px] leading-relaxed">
          Todos os pedidos de prontuário (em fila, a correr, concluídos ou com
          erro). Para baixar um ficheiro já pronto, prefira a tabela acima.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid min-w-[220px] max-w-md flex-1 gap-2">
              <Label htmlFor="history-casela-filter">Casela</Label>
              <Select
                value={caselaFilter.trim() ? caselaFilter.trim() : "__all"}
                onValueChange={setCaselaFilterAndResetPage}
              >
                <SelectTrigger
                  id="history-casela-filter"
                  className="rounded-xl bg-background"
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas</SelectItem>
                  {historyCaselaOptions.map(({ casela, label }) => (
                    <SelectItem key={casela} value={casela}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {truncated && !caselaFilter ? (
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-400/90">
            Só estão visíveis os pedidos mais recentes. Escolha uma casela no
            menu para encontrar pedidos desse residente.
          </p>
        ) : null}

        {historyLoading ? (
          <HistoryTableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyStateCard
            icon={Inbox}
            title="Sem pedidos nesta vista"
            description={
              caselaFilter.trim()
                ? "Não há registos para esta casela. Ajuste o filtro ou limpe para ver todos os pedidos visíveis."
                : "Ainda não há pedidos de exportação de prontuário ou a lista está truncada — filtre pela casela para ver mais."
            }
          >
            {caselaFilter.trim() ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCaselaFilterAndResetPage("__all")}
              >
                Limpar filtro de casela
              </Button>
            ) : null}
          </EmptyStateCard>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/80">
            <Table className="table-fixed min-w-[900px]">
              <colgroup>
                <col className="w-[11rem]" />
                <col className="w-[11rem]" />
                <col className="w-[5rem]" />
                <col className="w-[4.5rem]" />
                <col className="w-[7rem]" />
                <col />
                <col className="w-[5rem]" />
                <col className="w-[11rem]" />
                <col className="w-[7.5rem]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Pedido em
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Pronto em
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>Casela</TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>Tipo</TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>Estado</TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Quem pediu
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3 text-right`}>
                    Baixou
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Última descarga
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3 text-right`}>
                    Ação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="align-top transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="whitespace-nowrap px-3 py-3 text-sm">
                      {formatDateTimePtBr(row.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-muted-foreground">
                      {row.finishedAt
                        ? formatDateTimePtBr(row.finishedAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium tabular-nums">
                      {row.casela || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm">
                      <FormatBadge format={row.format} />
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <StatusLabel status={row.status} error={row.error} />
                    </TableCell>
                    <TableCell className="max-w-[200px] min-w-0 px-3 py-3 text-sm">
                      <span
                        className="block break-words"
                        title={row.actorLogin ?? undefined}
                      >
                        {row.actorDisplayName ??
                          row.actorLogin ??
                          `Utilizador ${row.actorUserId}`}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right tabular-nums text-sm">
                      {row.downloadCount ?? 0}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-3 text-sm text-muted-foreground">
                      {row.lastDownloadAt
                        ? formatDateTimePtBr(row.lastDownloadAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        disabled={
                          row.status !== "succeeded" || downloadingId === row.id
                        }
                        onClick={() => void handleDownloadHistoryRow(row)}
                        title={
                          row.status !== "succeeded"
                            ? "Só pode baixar quando o estado for “Concluído”"
                            : "Baixar o ficheiro"
                        }
                      >
                        <Download className="mr-1.5 h-4 w-4" aria-hidden />
                        {downloadingId === row.id ? "A descarregar…" : "Baixar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-transparent font-normal">
                <TableRow className="border-t border-border/60 bg-muted/10 hover:bg-muted/10">
                  <TableCell colSpan={9} className="p-4">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-center text-sm text-muted-foreground">
                        {total === 0
                          ? "Sem registos"
                          : `A mostrar ${historyFrom}–${historyTo} de ${total}`}
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={historyPage <= 1}
                          onClick={() =>
                            setHistoryPage((p) => Math.max(1, p - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden />
                        </Button>
                        <span className="tabular-nums px-2 text-sm text-muted-foreground">
                          {historyPage} / {historyTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={historyPage >= historyTotalPages}
                          onClick={() =>
                            setHistoryPage((p) =>
                              Math.min(historyTotalPages, p + 1),
                            )
                          }
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
