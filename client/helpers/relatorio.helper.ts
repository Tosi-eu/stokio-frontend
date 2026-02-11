import { MovementPeriod } from "@/components/StockReporter";
import { formatDateToPtBr } from "./dates.helper";

export const formatMonthToPtBr = (monthString: string) => {
  const [year, month] = monthString.split("-");
  return `${month}/${year}`;
};

export const getReportTitle = (
  tipo: string,
  period?: MovementPeriod,
  date?: Date | string | [Date | string, Date | string],
) => {
  switch (tipo) {
    case "insumos":
      return "Relatório de Insumos";
    case "medicamentos":
      return "Relatório de Medicamentos";
    case "residentes":
      return "Relatório de Residentes";
    case "psicotropicos":
      return "Relatório de Psicotrópicos";
    case "insumos_medicamentos":
      return "Relatório de Insumos e Medicamentos";
    case "residente_consumo":
      return "Relatório de Consumo por Residente";
    case "transferencias":
      return "Relatório de Transferências";
    case "movimentacoes":
      if (period === MovementPeriod.DIARIO)
        return `Relatório Diário (${formatDateToPtBr(date as Date | string)})`;
      if (period === MovementPeriod.MENSAL)
        return `Relatório Mensal (${formatMonthToPtBr(date as string)})`;
      if (period === MovementPeriod.INTERVALO)
        return `Relatório (${formatDateToPtBr(date[0])} → ${formatDateToPtBr(
          date[1],
        )})`;
      return "Relatório de Movimentações";
    case "medicamentos_residente":
      return "Relatório de Medicamentos por Residente";
    case "medicamentos_vencidos":
      return "Relatório de Medicamentos Vencidos";
    case "expiringSoon":
      return "Relatório de Medicamentos e Insumos Próximos ao Vencimento";
    default:
      return "Relatório";
  }
};
