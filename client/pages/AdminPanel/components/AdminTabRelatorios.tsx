import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { MovementPeriod } from "@/components/StockReporter";
import { REPORT_OPTIONS } from "../constants";
import { useTenant } from "@/hooks/use-tenant.hook";
import { formatResidentCaselaAutocompleteLabel } from "@/helpers/resident-casela-autocomplete.helper";

interface AdminTabRelatoriosProps {
  selectedReportType: string;
  setSelectedReportType: (v: string) => void;
  showReportResidentSelector: boolean;
  loadingReportResidents: boolean;
  selectedReportResident: number | null;
  setSelectedReportResident: (v: number | null) => void;
  reportResidents: Array<{ casela: number; name: string }>;
  reportResidentSearch: string;
  setReportResidentSearch: (v: string) => void;
  filteredReportResidents: Array<{ casela: number; name: string }>;
  showReportMovementFilters: boolean;
  reportMovementPeriod: MovementPeriod;
  setReportMovementPeriod: (v: MovementPeriod) => void;
  reportMovementDate: Date | null;
  setReportMovementDate: (v: Date | null) => void;
  reportMovementMonth: string;
  setReportMovementMonth: (v: string) => void;
  reportStartDate: Date | null;
  setReportStartDate: (v: Date | null) => void;
  reportEndDate: Date | null;
  setReportEndDate: (v: Date | null) => void;
  parseYearMonthToDate: (ym: string) => Date | null;
  showReportTransferFilters: boolean;
  reportTransferPeriod: MovementPeriod;
  setReportTransferPeriod: (v: MovementPeriod) => void;
  reportTransferDate: Date | null;
  setReportTransferDate: (v: Date | null) => void;
  reportStatus: string;
  reportPreviewLoading: boolean;
  reportPreviewUrl: string | null;
  setReportPreviewUrl: (v: string | null) => void;
  handleGenerateReport: () => void;
  handlePreviewReport: () => void;
  handleExportSpreadsheet: () => void;
}

export function AdminTabRelatorios({
  selectedReportType,
  setSelectedReportType,
  showReportResidentSelector,
  loadingReportResidents,
  selectedReportResident,
  setSelectedReportResident,
  reportResidents,
  reportResidentSearch,
  setReportResidentSearch,
  filteredReportResidents,
  showReportMovementFilters,
  reportMovementPeriod,
  setReportMovementPeriod,
  reportMovementDate,
  setReportMovementDate,
  reportMovementMonth,
  setReportMovementMonth,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  parseYearMonthToDate,
  showReportTransferFilters,
  reportTransferPeriod,
  setReportTransferPeriod,
  reportTransferDate,
  setReportTransferDate,
  reportStatus,
  reportPreviewLoading,
  reportPreviewUrl,
  setReportPreviewUrl,
  handleGenerateReport,
  handlePreviewReport,
  handleExportSpreadsheet,
}: AdminTabRelatoriosProps) {
  const { uiDisplay } = useTenant();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geração de relatórios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Tipo de relatório</Label>
          <Select
            value={selectedReportType}
            onValueChange={(v) => {
              setSelectedReportType(v);
              if (v !== "residente_consumo" && v !== "medicamentos_residente") {
                setSelectedReportResident(null);
              }
            }}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um relatório" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showReportResidentSelector && (
          <div className="grid gap-2">
            <Label>Residente</Label>
            {loadingReportResidents ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full max-w-md justify-between"
                  >
                    {selectedReportResident != null
                      ? (() => {
                          const r = reportResidents.find(
                            (x) => x.casela === selectedReportResident,
                          );
                          return r
                            ? formatResidentCaselaAutocompleteLabel(r)
                            : `Casela ${selectedReportResident}`;
                        })()
                      : "Selecione o residente"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nome ou casela…"
                      value={reportResidentSearch}
                      onValueChange={setReportResidentSearch}
                    />
                    <CommandEmpty>Nenhum residente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {filteredReportResidents.map((r) => (
                        <CommandItem
                          key={r.casela}
                          value={`${r.casela}-${r.name}`}
                          onSelect={() => {
                            setSelectedReportResident(r.casela);
                            setReportResidentSearch("");
                          }}
                        >
                          {formatResidentCaselaAutocompleteLabel(r)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        {showReportMovementFilters && (
          <div className="grid gap-2 p-3 border rounded-lg max-w-md">
            <Label>Período (movimentações)</Label>
            <Select
              value={reportMovementPeriod}
              onValueChange={(v: MovementPeriod) => setReportMovementPeriod(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MovementPeriod.DIARIO}>Diário</SelectItem>
                <SelectItem value={MovementPeriod.MENSAL}>Mensal</SelectItem>
                <SelectItem value={MovementPeriod.INTERVALO}>
                  Intervalo
                </SelectItem>
              </SelectContent>
            </Select>
            {reportMovementPeriod === MovementPeriod.DIARIO && (
              <div>
                <Label className="text-xs">Data</Label>
                <DatePicker
                  selected={reportMovementDate}
                  onChange={(d: Date | null) => setReportMovementDate(d)}
                  dateFormat="dd/MM/yyyy"
                  locale="pt-BR"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
            )}
            {reportMovementPeriod === MovementPeriod.MENSAL && (
              <div>
                <Label className="text-xs">Mês</Label>
                <DatePicker
                  selected={
                    reportMovementMonth
                      ? parseYearMonthToDate(reportMovementMonth)
                      : null
                  }
                  onChange={(d: Date | null) => {
                    if (!d) setReportMovementMonth("");
                    else {
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, "0");
                      setReportMovementMonth(`${y}-${m}`);
                    }
                  }}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  locale="pt-BR"
                  placeholderText="Selecione o mês"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
            )}
            {reportMovementPeriod === MovementPeriod.INTERVALO && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Data inicial</Label>
                  <DatePicker
                    selected={reportStartDate}
                    onChange={(d: Date | null) => setReportStartDate(d)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full border rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Data final</Label>
                  <DatePicker
                    selected={reportEndDate}
                    onChange={(d: Date | null) => setReportEndDate(d)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full border rounded px-2 py-1.5"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {showReportTransferFilters && (
          <div className="grid gap-2 p-3 border rounded-lg max-w-md">
            <Label>Período (transferências)</Label>
            <Select
              value={reportTransferPeriod}
              onValueChange={(v: MovementPeriod) => setReportTransferPeriod(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MovementPeriod.DIARIO}>Diário</SelectItem>
                <SelectItem value={MovementPeriod.INTERVALO}>
                  Intervalo
                </SelectItem>
              </SelectContent>
            </Select>
            {reportTransferPeriod === MovementPeriod.DIARIO && (
              <div>
                <Label className="text-xs">Data</Label>
                <DatePicker
                  selected={reportTransferDate}
                  onChange={(d: Date | null) => setReportTransferDate(d)}
                  dateFormat="dd/MM/yyyy"
                  locale="pt-BR"
                  className="w-full border rounded px-2 py-1.5"
                />
              </div>
            )}
            {reportTransferPeriod === MovementPeriod.INTERVALO && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Data inicial</Label>
                  <DatePicker
                    selected={reportStartDate}
                    onChange={(d: Date | null) => setReportStartDate(d)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full border rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs">Data final</Label>
                  <DatePicker
                    selected={reportEndDate}
                    onChange={(d: Date | null) => setReportEndDate(d)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full border rounded px-2 py-1.5"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={
              !selectedReportType ||
              reportStatus === "loading" ||
              (showReportResidentSelector && selectedReportResident == null)
            }
          >
            {reportStatus === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uiDisplay.defaultReportFormat === "xlsx"
                  ? "Gerando planilha..."
                  : "Gerando PDF..."}
              </>
            ) : uiDisplay.defaultReportFormat === "xlsx" ? (
              <>Gerar e baixar planilha (Excel)</>
            ) : (
              <>Gerar e baixar PDF</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handlePreviewReport}
            disabled={
              !selectedReportType ||
              reportPreviewLoading ||
              reportStatus === "loading" ||
              (showReportResidentSelector && selectedReportResident == null)
            }
          >
            {reportPreviewLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>Pré-visualizar</>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportSpreadsheet}
            disabled={
              !selectedReportType ||
              reportStatus === "loading" ||
              (showReportResidentSelector && selectedReportResident == null)
            }
          >
            Exportar planilha (Excel)
          </Button>
        </div>

        {reportPreviewUrl && (
          <div className="mt-6 space-y-2 border rounded-lg bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Pré-visualização do relatório
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  URL.revokeObjectURL(reportPreviewUrl);
                  setReportPreviewUrl(null);
                }}
              >
                Fechar pré-visualização
              </Button>
            </div>
            <div className="rounded-md border bg-white overflow-hidden min-h-[500px]">
              <object
                data={reportPreviewUrl}
                type="application/pdf"
                className="w-full min-h-[500px] h-[70vh]"
                title="Pré-visualização do relatório"
              >
                <p className="p-4 text-sm text-muted-foreground">
                  Se o PDF não aparecer aqui,{" "}
                  <button
                    type="button"
                    className="text-primary underline hover:no-underline"
                    onClick={() => window.open(reportPreviewUrl, "_blank")}
                  >
                    abra em nova aba
                  </button>
                  .
                </p>
              </object>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
