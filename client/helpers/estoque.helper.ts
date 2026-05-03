import {
  StockDistributionItem,
  StockProportionResponse,
} from "@/interfaces/interfaces";
import type { DashboardStockProportionBlock } from "@stokio/sdk";
import { SectorType } from "@/utils/enums";

export function prepareStockDistributionData(
  response: StockProportionResponse | DashboardStockProportionBlock,
  sector: SectorType,
): StockDistributionItem[] {
  const { percentuais, totais } = response as StockProportionResponse;

  const items: StockDistributionItem[] = [
    {
      name: "Medicamentos (Geral)",
      value: percentuais.medicamentos_geral,
      rawValue: totais.medicamentos_geral,
    },
    {
      name: "Medicamentos (Individual)",
      value: percentuais.medicamentos_individual,
      rawValue: totais.medicamentos_individual,
    },
    {
      name: "Insumos (Geral)",
      value: percentuais.insumos_geral,
      rawValue: totais.insumos_geral,
    },
    {
      name: "Insumos (Individual)",
      value: percentuais.insumos_individual,
      rawValue: totais.insumos_individual,
    },
  ];

  if (sector === SectorType.ENFERMAGEM) {
    items.push(
      {
        name: "Carrinho de Emergência (Medicamentos)",
        value: percentuais.carrinho_emergencia_medicamentos,
        rawValue: totais.carrinho_emergencia_medicamentos,
      },
      {
        name: "Carrinho de Psicotrópicos (Medicamentos)",
        value: percentuais.carrinho_psicotropicos_medicamentos,
        rawValue: totais.carrinho_psicotropicos_medicamentos,
      },
      {
        name: "Carrinho de Emergência (Insumos)",
        value: percentuais.carrinho_emergencia_insumos,
        rawValue: totais.carrinho_emergencia_insumos,
      },
      {
        name: "Carrinho de Psicotrópicos (Insumos)",
        value: percentuais.carrinho_psicotropicos_insumos,
        rawValue: totais.carrinho_psicotropicos_insumos,
      },
    );
  }

  return items.filter((i) => i.rawValue > 0);
}
