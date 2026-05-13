import { getReport, getResidentActiveMedicalRecord } from "@/api/requests";
import { MovementPeriod, MovementsParams } from "@/components/StockReporter";

export type StockReportResidentMeta = {
  casela: number;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
};

export type FetchStockReportPayloadOpts = {
  tipo: string;
  movementPeriod: MovementPeriod;
  movementDate: Date | null;
  movementMonth: string;
  startDate: Date | null;
  endDate: Date | null;
  movementPeriodTransfer: MovementPeriod;
  transferDate: Date | null;
  selectedResident: number | null;
  residents: StockReportResidentMeta[];
};

export async function fetchStockReportPayloadForPdf(
  opts: FetchStockReportPayloadOpts,
): Promise<unknown> {
  const {
    tipo,
    movementPeriod,
    movementDate,
    movementMonth,
    startDate,
    endDate,
    movementPeriodTransfer,
    transferDate,
    selectedResident,
    residents,
  } = opts;

  if (tipo === "movimentacoes") {
    let params: MovementsParams;
    if (movementPeriod === MovementPeriod.DIARIO) {
      if (!movementDate) throw new Error("Data obrigatória");
      params = {
        periodo: MovementPeriod.DIARIO,
        data: movementDate.toISOString().split("T")[0],
      };
    } else if (movementPeriod === MovementPeriod.MENSAL) {
      if (!movementMonth) throw new Error("Mês obrigatório");
      params = { periodo: MovementPeriod.MENSAL, mes: movementMonth };
    } else {
      if (!startDate || !endDate) throw new Error("Intervalo obrigatório");
      params = {
        periodo: MovementPeriod.INTERVALO,
        data_inicial: startDate.toISOString().split("T")[0],
        data_final: endDate.toISOString().split("T")[0],
      };
    }
    return getReport("movimentacoes", undefined, params);
  }

  if (tipo === "transferencias") {
    let params: MovementsParams;
    if (movementPeriodTransfer === MovementPeriod.DIARIO) {
      if (!transferDate) throw new Error("Data obrigatória");
      params = {
        periodo: MovementPeriod.DIARIO,
        data: transferDate.toISOString().split("T")[0],
      };
    } else {
      if (!startDate || !endDate) throw new Error("Intervalo obrigatório");
      params = {
        periodo: MovementPeriod.INTERVALO,
        data_inicial: startDate.toISOString().split("T")[0],
        data_final: endDate.toISOString().split("T")[0],
      };
    }
    return getReport("transferencias", undefined, params);
  }

  if (tipo === "prontuario_residente") {
    if (selectedResident == null) {
      throw new Error("Selecione um residente para o prontuário");
    }
    return getResidentActiveMedicalRecord(selectedResident);
  }

  const casela =
    tipo === "residente_consumo" || tipo === "medicamentos_residente"
      ? (selectedResident ?? undefined)
      : undefined;

  const payload = await getReport(tipo, casela);
  if (casela == null) return payload;

  const r = residents.find((x) => x.casela === casela) ?? null;
  if (!r) return payload;

  if (tipo === "residente_consumo") {
    return {
      ...(payload as Record<string, unknown>),
      cpf: r.cpf ?? null,
      data_nascimento: r.data_nascimento ?? null,
      idade: r.idade ?? null,
    };
  }

  if (tipo === "medicamentos_residente") {
    if (Array.isArray(payload)) {
      if (payload.length === 0) return payload;
      const first = payload[0] as Record<string, unknown>;
      return [
        {
          ...first,
          cpf: r.cpf ?? null,
          data_nascimento: r.data_nascimento ?? null,
          idade: r.idade ?? null,
        },
        ...payload.slice(1),
      ];
    }
    return {
      ...(payload as Record<string, unknown>),
      cpf: r.cpf ?? null,
      data_nascimento: r.data_nascimento ?? null,
      idade: r.idade ?? null,
    };
  }

  return payload;
}
