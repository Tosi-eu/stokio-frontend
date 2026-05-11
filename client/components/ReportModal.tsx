import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bandage,
  Stethoscope,
  Check,
  X,
  Loader2,
  User,
  Syringe,
  Users,
  ArrowRightLeft,
  Activity,
  AlertTriangle,
  ChevronsUpDown,
} from "lucide-react";
import {
  createReportExportJob,
  downloadReportExportBlob,
  getReportExportJob,
  getResidents,
} from "@/api/requests";
import { MovementPeriod } from "@/components/StockReporter";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import {
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  Command,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getReportTitle } from "@/helpers/relatorio.helper";
import { parseYearMonthToDate } from "@/helpers/dates.helper";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { formatCaselaLabel } from "@/helpers/storage-location-display.helper";
type StatusType = "idle" | "loading" | "success" | "error";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
}

interface Resident {
  casela: number;
  name: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
}

export default function ReportModal({ open, onClose }: ReportModalProps) {
  const { uiDisplay } = useTenant();
  const [status, setStatus] = useState<StatusType>("idle");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedResident, setSelectedResident] = useState<number | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [movementPeriod, setMovementPeriod] = useState<MovementPeriod>(
    MovementPeriod.DIARIO,
  );
  const [movementDate, setMovementDate] = useState<Date | null>(null);
  const [movementMonth, setMovementMonth] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [transferDate, setTransferDate] = useState<Date | null>(null);
  const [movementPeriodTransfer, setMovementPeriodTransfer] =
    useState<MovementPeriod>(MovementPeriod.DIARIO);
  const [residentSearch, setResidentSearch] = useState("");

  const reportOptions = [
    { value: "insumos", label: "Insumos", icon: Bandage },
    { value: "medicamentos", label: "Medicamentos", icon: Stethoscope },
    { value: "residentes", label: "Residentes", icon: User },
    { value: "psicotropicos", label: "Psicotrópicos", icon: Syringe },
    {
      value: "insumos_medicamentos",
      label: "Insumos e Medicamentos",
      icon: Check,
    },
    { value: "residente_consumo", label: "Consumo por Residente", icon: Users },
    {
      value: "transferencias",
      label: "Transferências (Farmácia → Enfermaria)",
      icon: ArrowRightLeft,
    },
    { value: "movimentacoes", label: "Movimentações", icon: Activity },
    {
      value: "medicamentos_residente",
      label: "Medicamentos por Residente",
      icon: User,
    },
    {
      value: "medicamentos_vencidos",
      label: "Medicamentos Vencidos",
      icon: AlertTriangle,
    },
    {
      value: "expiringSoon",
      label: "Medicamentos e Insumos Próximos ao Vencimento",
      icon: AlertTriangle,
    },
  ];

  const loadResidents = useCallback(async () => {
    setLoadingResidents(true);
    try {
      const residentsList = await fetchAllPaginated<Resident>((p, l) =>
        getResidents(p, l).then((r) => ({
          data: ((r.data ?? []) as Array<Record<string, unknown>>).map((x) => ({
            casela: Number(x.casela),
            name: String(x.name ?? ""),
            cpf: x.cpf != null ? String(x.cpf) : null,
            data_nascimento:
              x.data_nascimento != null ? String(x.data_nascimento) : null,
            idade:
              typeof x.idade === "number" && Number.isFinite(x.idade)
                ? x.idade
                : null,
          })),
          hasNext: r.hasNext ?? false,
        })),
      );
      setResidents(residentsList ?? []);
    } catch (error) {
      console.error("Failed to load residents:", error);
      setResidents([]);
    } finally {
      setLoadingResidents(false);
    }
  }, []);

  useEffect(() => {
    if (
      open &&
      (selectedReports[0] === "residente_consumo" ||
        selectedReports[0] === "medicamentos_residente")
    ) {
      void loadResidents();
    }
  }, [open, selectedReports, loadResidents]);

  const handleClose = useCallback(() => {
    setStatus("idle");
    setSelectedReports([]);
    setSelectedResident(null);
    setResidentSearch("");
    setMovementDate(null);
    setStartDate(null);
    setEndDate(null);
    setTransferDate(null);
    setMovementPeriodTransfer(MovementPeriod.DIARIO);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => {
        handleClose();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [status, handleClose]);

  const handleSelectReport = (value: string) => {
    setSelectedReports([value]);
    if (value !== "residente_consumo" && value !== "medicamentos_residente") {
      setSelectedResident(null);
    }
    if (value === "movimentacoes") {
      setMovementPeriod(MovementPeriod.DIARIO);
      setMovementDate((d) => d ?? new Date());
      setMovementMonth("");
      setStartDate(null);
      setEndDate(null);
    }
    if (value === "transferencias") {
      setMovementPeriodTransfer(MovementPeriod.DIARIO);
      setTransferDate((d) => d ?? new Date());
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedReports.length) return;

    const tipo = selectedReports[0];
    setStatus("loading");

    try {
      const params: Record<string, string> = {};

      if (tipo === "movimentacoes") {
        if (movementPeriod === MovementPeriod.DIARIO) {
          if (!movementDate) {
            toast({ title: "Selecione a data", variant: "error" });
            setStatus("idle");
            return;
          }
          params.periodo = MovementPeriod.DIARIO;
          params.data = movementDate.toISOString().split("T")[0];
        } else if (movementPeriod === MovementPeriod.MENSAL) {
          if (!movementMonth) {
            toast({ title: "Selecione o mês", variant: "error" });
            setStatus("idle");
            return;
          }
          params.periodo = MovementPeriod.MENSAL;
          params.mes = movementMonth;
        } else if (movementPeriod === MovementPeriod.INTERVALO) {
          if (!startDate || !endDate) {
            toast({
              title: "Selecione o intervalo de datas",
              variant: "error",
            });
            setStatus("idle");
            return;
          }
          if (endDate.getTime() < startDate.getTime()) {
            toast({
              title: "Intervalo inválido",
              description: "A data final precisa ser maior ou igual à inicial.",
              variant: "error",
            });
            setStatus("idle");
            return;
          }
          params.periodo = MovementPeriod.INTERVALO;
          params.data_inicial = startDate.toISOString().split("T")[0];
          params.data_final = endDate.toISOString().split("T")[0];
        }
      } else if (tipo === "transferencias") {
        if (movementPeriodTransfer === MovementPeriod.DIARIO) {
          if (!transferDate) {
            toast({
              title: "Selecione a data da transferência",
              variant: "error",
            });
            setStatus("idle");
            return;
          }
          params.data = transferDate.toISOString().split("T")[0];
        } else if (movementPeriodTransfer === MovementPeriod.INTERVALO) {
          if (!startDate || !endDate) {
            toast({
              title: "Selecione o intervalo de datas",
              variant: "error",
            });
            setStatus("idle");
            return;
          }
          if (endDate.getTime() < startDate.getTime()) {
            toast({
              title: "Intervalo inválido",
              description: "A data final precisa ser maior ou igual à inicial.",
              variant: "error",
            });
            setStatus("idle");
            return;
          }
          params.data_inicial = startDate.toISOString().split("T")[0];
          params.data_final = endDate.toISOString().split("T")[0];
        }
      } else {
        const casela =
          tipo === "residente_consumo" || tipo === "medicamentos_residente"
            ? selectedResident
            : undefined;

        if (casela != null) params.casela = String(casela);
      }

      const fmt = uiDisplay.defaultReportFormat ?? "pdf";

      const job = await createReportExportJob(tipo, {
        ...params,
        format: fmt === "pdf" ? "pdf" : "xlsx",
      });

      const startedAt = Date.now();
      while (true) {
        const j = (await getReportExportJob(job.jobId)) as {
          status?: string;
          error?: string | null;
        };
        const s = String(j?.status ?? "");
        if (s === "succeeded") break;
        if (s === "failed") {
          throw new Error(j?.error ?? "Falha ao gerar planilha");
        }
        if (Date.now() - startedAt > 5 * 60_000) {
          throw new Error("Geração demorando demais. Tente novamente.");
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      const blob = await downloadReportExportBlob(job.jobId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-${tipo}.${fmt === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("success");
    } catch (e) {
      console.error(e);
      const m = e instanceof Error ? e.message : "";
      if (m === "Data obrigatória") {
        toast({
          title:
            tipo === "transferencias"
              ? "Selecione a data da transferência"
              : "Selecione a data",
          variant: "error",
        });
      } else if (m === "Mês obrigatório") {
        toast({ title: "Selecione o mês", variant: "error" });
      } else if (m === "Intervalo obrigatório") {
        toast({ title: "Selecione o intervalo de datas", variant: "error" });
      }
      setStatus("error");
    }
  };

  const showResidentSelector =
    selectedReports[0] === "residente_consumo" ||
    selectedReports[0] === "medicamentos_residente";

  const showMovementFilters = selectedReports[0] === "movimentacoes";

  const iconSize = 140;

  const filteredResidents = residents.filter((r) => {
    if (!residentSearch) return true;
    const q = residentSearch.trim().toLowerCase();
    if (!q) return true;
    if (/^\d+$/.test(q)) return String(r.casela).startsWith(q);
    return r.name.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="p-6 w-full flex flex-col items-center"
            >
              <DialogHeader className="w-full mb-4 text-center">
                <DialogTitle className="text-xl font-bold text-gray-800">
                  {getReportTitle(
                    selectedReports[0],
                    movementPeriod,
                    movementPeriod === MovementPeriod.INTERVALO
                      ? [startDate, endDate]
                      : movementDate || movementMonth,
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="w-full flex flex-col gap-2 items-center">
                {reportOptions.map(({ value, label, icon: Icon }) => {
                  const isSelected = selectedReports[0] === value;

                  return (
                    <div key={value} className="w-full max-w-md">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        onClick={() => handleSelectReport(value)}
                        className={`border rounded-lg px-4 py-2 flex items-center gap-3 cursor-pointer transition-all
                    ${
                      isSelected
                        ? "border-primary bg-accent/50"
                        : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
                    }
                  `}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </motion.div>

                      {isSelected && value === "transferencias" && (
                        <div className="mt-2 p-3 border rounded-lg grid grid-cols-2 gap-3 text-sm">
                          <div className="col-span-2">
                            <label className="block mb-1 text-gray-600">
                              Período
                            </label>
                            <select
                              value={movementPeriodTransfer}
                              onChange={(e) =>
                                setMovementPeriodTransfer(
                                  e.target.value as MovementPeriod,
                                )
                              }
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value={MovementPeriod.DIARIO}>
                                Diário
                              </option>
                              <option value={MovementPeriod.INTERVALO}>
                                Intervalo
                              </option>
                            </select>
                          </div>

                          {movementPeriodTransfer === MovementPeriod.DIARIO && (
                            <div className="col-span-2">
                              <label className="block mb-1 text-gray-600">
                                Data da Transferência
                              </label>
                              <DatePicker
                                selected={transferDate}
                                onChange={(date: Date) => setTransferDate(date)}
                                dateFormat="dd/MM/yyyy"
                                locale="pt-BR"
                                className="w-full border rounded px-2 py-1"
                              />
                            </div>
                          )}

                          {movementPeriodTransfer ===
                            MovementPeriod.INTERVALO && (
                            <>
                              <div>
                                <label className="block mb-1 text-gray-600">
                                  Data inicial
                                </label>
                                <DatePicker
                                  selected={startDate}
                                  onChange={(date: Date) => setStartDate(date)}
                                  dateFormat="dd/MM/yyyy"
                                  locale="pt-BR"
                                  className="w-full border rounded px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-gray-600">
                                  Data final
                                </label>
                                <DatePicker
                                  selected={endDate}
                                  onChange={(date: Date) => setEndDate(date)}
                                  dateFormat="dd/MM/yyyy"
                                  locale="pt-BR"
                                  className="w-full border rounded px-2 py-1"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {isSelected && showMovementFilters && (
                        <div className="mt-2 p-3 border rounded-lg grid grid-cols-2 gap-3 text-sm">
                          <div className="col-span-2">
                            <label className="block mb-1 text-gray-600">
                              Período
                            </label>
                            <select
                              value={movementPeriod}
                              onChange={(e) =>
                                setMovementPeriod(
                                  e.target.value as MovementPeriod,
                                )
                              }
                              className="w-full border rounded px-2 py-1"
                            >
                              <option value={MovementPeriod.DIARIO}>
                                Diário
                              </option>
                              <option value={MovementPeriod.MENSAL}>
                                Mensal
                              </option>
                              <option value={MovementPeriod.INTERVALO}>
                                Intervalo
                              </option>
                            </select>
                          </div>

                          {movementPeriod === MovementPeriod.DIARIO && (
                            <div className="col-span-2">
                              <label className="block mb-1 text-gray-600">
                                Data
                              </label>
                              <DatePicker
                                selected={movementDate}
                                onChange={(date: Date) => setMovementDate(date)}
                                dateFormat="dd/MM/yyyy"
                                locale="pt-BR"
                                className="w-full border rounded px-2 py-1"
                              />
                            </div>
                          )}

                          {movementPeriod === MovementPeriod.MENSAL && (
                            <div className="col-span-2">
                              <label className="block mb-1 text-gray-600">
                                Mês
                              </label>
                              <DatePicker
                                selected={
                                  movementMonth
                                    ? parseYearMonthToDate(movementMonth)
                                    : null
                                }
                                onChange={(date: Date) => {
                                  const year = date.getFullYear();
                                  const month = String(
                                    date.getMonth() + 1,
                                  ).padStart(2, "0");
                                  setMovementMonth(`${year}-${month}`);
                                }}
                                dateFormat="MM/yyyy"
                                showMonthYearPicker
                                locale="pt-BR"
                                placeholderText="Selecione o mês"
                                className="w-full border rounded px-2 py-1"
                              />
                            </div>
                          )}

                          {movementPeriod === MovementPeriod.INTERVALO && (
                            <>
                              <div>
                                <label className="block mb-1 text-gray-600">
                                  Data inicial
                                </label>
                                <DatePicker
                                  selected={startDate}
                                  onChange={(date: Date) => setStartDate(date)}
                                  dateFormat="dd/MM/yyyy"
                                  locale="pt-BR"
                                  className="w-full border rounded px-2 py-1"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-gray-600">
                                  Data final
                                </label>
                                <DatePicker
                                  selected={endDate}
                                  onChange={(date: Date) => setEndDate(date)}
                                  dateFormat="dd/MM/yyyy"
                                  locale="pt-BR"
                                  className="w-full border rounded px-2 py-1"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {isSelected && showResidentSelector && (
                        <div className="mt-2 p-3 border rounded-lg">
                          <label className="block mb-1 text-gray-600 text-sm">
                            Residente
                          </label>

                          {loadingResidents ? (
                            <div className="flex justify-center py-2">
                              <Loader2 className="animate-spin text-primary" />
                            </div>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between text-sm"
                                >
                                  {selectedResident != null
                                    ? formatCaselaLabel(uiDisplay.casela, {
                                        caselaId: selectedResident,
                                        residentName: residents.find(
                                          (r) => r.casela === selectedResident,
                                        )?.name,
                                      })
                                    : "Selecionar residente"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>

                              <PopoverContent
                                side="bottom"
                                align="start"
                                sideOffset={4}
                                avoidCollisions={false}
                                className="w-full p-0"
                              >
                                <Command shouldFilter={false}>
                                  <CommandInput
                                    placeholder="Buscar residente"
                                    value={residentSearch}
                                    onValueChange={setResidentSearch}
                                  />
                                  <CommandEmpty>
                                    Nenhum residente encontrado.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {filteredResidents.map((r) => (
                                      <CommandItem
                                        key={r.casela}
                                        value={
                                          r.casela?.toString() + " - " + r.name
                                        }
                                        onSelect={() => {
                                          setSelectedResident(r.casela);
                                          setResidentSearch("");
                                        }}
                                      >
                                        {uiDisplay.casela === "nome"
                                          ? `${r.name} (${r.casela})`
                                          : `Casela ${r.casela}`}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button
                  className="mt-4 w-full max-w-md bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={
                    !selectedReports.length ||
                    (showResidentSelector && !selectedResident)
                  }
                  onClick={handleGenerate}
                >
                  Gerar relatório
                </Button>
              </div>
            </motion.div>
          )}
          {status === "loading" && (
            <div className="p-12 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p>
                {uiDisplay.defaultReportFormat === "xlsx"
                  ? "Gerando planilha…"
                  : "Gerando PDF…"}
              </p>
            </div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center h-72 justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
                className="relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="absolute inset-0 bg-primary/15 rounded-full"
                  style={{
                    width: iconSize + 40,
                    height: iconSize + 40,
                    marginLeft: -20,
                    marginTop: -20,
                  }}
                />
                <Check
                  className="text-primary relative z-10"
                  style={{ width: iconSize, height: iconSize }}
                  strokeWidth={3}
                />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-xl font-bold text-primary"
              >
                Relatório gerado com sucesso!
              </motion.p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center h-72 justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
                className="relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="absolute inset-0 bg-red-100 rounded-full"
                  style={{
                    width: iconSize + 40,
                    height: iconSize + 40,
                    marginLeft: -20,
                    marginTop: -20,
                  }}
                />
                <X
                  className="text-red-600 relative z-10"
                  style={{ width: iconSize, height: iconSize }}
                  strokeWidth={3}
                />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-xl font-bold text-red-600"
              >
                Erro ao gerar relatório
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
