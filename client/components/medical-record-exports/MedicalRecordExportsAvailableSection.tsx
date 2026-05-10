"use client";

import type { Dispatch, SetStateAction } from "react";
import type { MedicalRecordExportAvailableRow } from "@/api/requests";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Inbox,
  SearchX,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TABLE_HEAD } from "@/components/medical-record-exports/medical-record-exports.constants";
import {
  AvailableTableSkeleton,
  EmptyStateCard,
  FormatBadge,
  textoItensNaCasela,
} from "@/components/medical-record-exports/medical-record-exports.shared";
import { formatDateTimePtBr } from "@/helpers/dates.helper";
import type { ExportFormat } from "@/components/medical-record-exports/medical-record-exports.shared";

export type MedicalRecordExportsAvailableSectionProps = {
  loadAvailable: () => Promise<void>;
  availableLoading: boolean;
  availableLength: number;
  filteredAvailableCount: number;
  paginatedAvailable: MedicalRecordExportAvailableRow[];
  availablePage: number;
  setAvailablePage: Dispatch<SetStateAction<number>>;
  availableTotalPages: number;
  availableFrom: number;
  availableTo: number;
  residentNameQuery: string;
  setResidentNameQuery: Dispatch<SetStateAction<string>>;
  busyCasela: string | null;
  setVersionsModalRow: (row: MedicalRecordExportAvailableRow | null) => void;
  handleSmartDownload: (
    row: MedicalRecordExportAvailableRow,
    format: ExportFormat,
  ) => Promise<void>;
  handleForceGenerate: (
    row: MedicalRecordExportAvailableRow,
    format: ExportFormat,
  ) => Promise<void>;
};

export function MedicalRecordExportsAvailableSection(
  props: MedicalRecordExportsAvailableSectionProps,
) {
  const {
    loadAvailable,
    availableLoading,
    availableLength,
    filteredAvailableCount,
    paginatedAvailable,
    availablePage,
    setAvailablePage,
    availableTotalPages,
    availableFrom,
    availableTo,
    residentNameQuery,
    setResidentNameQuery,
    busyCasela,
    setVersionsModalRow,
    handleSmartDownload,
    handleForceGenerate,
  } = props;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Exportar prontuários</CardTitle>
          <CardDescription className="text-[15px] leading-relaxed">
            Filtre pelo nome. Use “Descarregar” (PDF ou Excel), “Gerar novo” ou
            “Ver versões” (no modal pode filtrar por data).
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2"
          onClick={() => void loadAvailable()}
          disabled={availableLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${availableLoading ? "animate-spin" : ""}`}
            aria-hidden
          />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid min-w-[220px] max-w-md flex-1 gap-2">
              <Label htmlFor="resident-name-filter">Filtrar por nome</Label>
              <Input
                id="resident-name-filter"
                type="search"
                placeholder="Digite parte do nome"
                value={residentNameQuery}
                onChange={(e) => setResidentNameQuery(e.target.value)}
                className="rounded-xl bg-background"
                autoComplete="off"
              />
            </div>
            {residentNameQuery.trim() ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-0.5"
                onClick={() => setResidentNameQuery("")}
              >
                Limpar nome
              </Button>
            ) : null}
          </div>
        </div>

        {availableLoading ? (
          <AvailableTableSkeleton />
        ) : availableLength === 0 ? (
          <EmptyStateCard
            icon={Inbox}
            title="Nenhum residente listado"
            description={
              <>
                Confira na área{" "}
                <Link
                  href="/residents"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Residentes
                </Link>{" "}
                se há medicamentos ou insumos na casela para exportar o
                prontuário.
              </>
            }
          />
        ) : filteredAvailableCount === 0 ? (
          <EmptyStateCard
            icon={SearchX}
            title="Nenhum resultado para este nome"
            description={`Nenhum residente corresponde a “${residentNameQuery.trim()}”.`}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResidentNameQuery("")}
            >
              Limpar filtro
            </Button>
          </EmptyStateCard>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/80">
            <Table className="table-fixed min-w-[760px]">
              <colgroup>
                <col className="w-[4.5rem]" />
                <col />
                <col className="w-[24%]" />
                <col className="w-[26%]" />
                <col className="w-[14rem]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className={`${TABLE_HEAD} py-3`}>Casela</TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Residente
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Na casela
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3`}>
                    Último Download
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD} py-3 text-right`}>
                    O que fazer
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAvailable.map((row) => {
                  const vers = row.versions ?? [];
                  return (
                    <TableRow
                      key={row.residentId}
                      className="align-top transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="px-3 py-3 font-medium tabular-nums">
                        {row.casela}
                      </TableCell>
                      <TableCell className="min-w-0 px-3 py-3">
                        <span className="block font-medium leading-snug break-words">
                          {row.residentName}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm leading-snug text-muted-foreground">
                        {textoItensNaCasela(
                          row.medicineStockLines,
                          row.inputStockLines,
                        )}
                      </TableCell>
                      <TableCell className="min-w-0 px-3 py-3 text-sm leading-snug">
                        {row.jobId && row.generatedAt ? (
                          <>
                            <span className="text-foreground">
                              {formatDateTimePtBr(row.generatedAt)}
                            </span>
                            <span className="mt-2 flex flex-wrap items-center gap-2">
                              <FormatBadge format={row.format} />
                              {vers.length > 1 ? (
                                <span className="text-xs text-muted-foreground">
                                  · {vers.length} versões
                                </span>
                              ) : null}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Nenhum ficheiro ainda.
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right align-top">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant={row.jobId ? "default" : "outline"}
                                  size="sm"
                                  className="whitespace-nowrap"
                                  disabled={busyCasela === row.casela}
                                  title="Descarregar em PDF ou Excel"
                                >
                                  <Download
                                    className="mr-1.5 h-4 w-4"
                                    aria-hidden
                                  />
                                  {busyCasela === row.casela
                                    ? "A processar…"
                                    : "Descarregar"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-44 p-2">
                                <div className="grid gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2 rounded-lg"
                                    disabled={busyCasela === row.casela}
                                    onClick={() =>
                                      void handleSmartDownload(row, "pdf")
                                    }
                                  >
                                    <FileText
                                      className="h-4 w-4 shrink-0 opacity-70"
                                      aria-hidden
                                    />
                                    PDF
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2 rounded-lg"
                                    disabled={busyCasela === row.casela}
                                    onClick={() =>
                                      void handleSmartDownload(row, "xlsx")
                                    }
                                  >
                                    <FileSpreadsheet
                                      className="h-4 w-4 shrink-0 opacity-70"
                                      aria-hidden
                                    />
                                    Excel
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="whitespace-nowrap"
                                  disabled={busyCasela === row.casela}
                                  title="Gera uma nova versão e descarrega"
                                >
                                  {busyCasela === row.casela
                                    ? "A gerar…"
                                    : "Gerar novo"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-44 p-2">
                                <div className="grid gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2 rounded-lg"
                                    disabled={busyCasela === row.casela}
                                    onClick={() =>
                                      void handleForceGenerate(row, "pdf")
                                    }
                                  >
                                    <FileText
                                      className="h-4 w-4 shrink-0 opacity-70"
                                      aria-hidden
                                    />
                                    PDF
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2 rounded-lg"
                                    disabled={busyCasela === row.casela}
                                    onClick={() =>
                                      void handleForceGenerate(row, "xlsx")
                                    }
                                  >
                                    <FileSpreadsheet
                                      className="h-4 w-4 shrink-0 opacity-70"
                                      aria-hidden
                                    />
                                    Excel
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {vers.length > 0 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground"
                              onClick={() => setVersionsModalRow(row)}
                            >
                              Ver versões ({vers.length})
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="bg-transparent font-normal">
                <TableRow className="border-t border-border/60 bg-muted/10 hover:bg-muted/10">
                  <TableCell colSpan={5} className="p-4">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-center text-sm text-muted-foreground">
                        {filteredAvailableCount === 0
                          ? "Sem registos"
                          : `A mostrar ${availableFrom}–${availableTo} de ${filteredAvailableCount}`}
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={availablePage <= 1}
                          onClick={() =>
                            setAvailablePage((p) => Math.max(1, p - 1))
                          }
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden />
                        </Button>
                        <span className="tabular-nums px-2 text-sm text-muted-foreground">
                          {availablePage} / {availableTotalPages}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={availablePage >= availableTotalPages}
                          onClick={() =>
                            setAvailablePage((p) =>
                              Math.min(availableTotalPages, p + 1),
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
