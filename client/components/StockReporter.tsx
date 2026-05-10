import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { PDF_REPORT_LOGO_URL } from "@/constants/app-branding";
import {
  formatDateOrDateTimePtBr,
  formatDateToPtBr,
  formatTimePtBr,
  formatValidityDate,
} from "@/helpers/dates.helper";

export enum MovementPeriod {
  DIARIO = "diario",
  MENSAL = "mensal",
  INTERVALO = "intervalo",
}

export type MovementsParams =
  | {
      periodo: MovementPeriod.DIARIO;
      data: string;
    }
  | {
      periodo: MovementPeriod.MENSAL;
      mes: string;
    }
  | {
      periodo: MovementPeriod.INTERVALO;
      data_inicial: string;
      data_final: string;
    };

interface ResidentesResponse {
  detalhes: RowData[];
  consumo_mensal: RowData[];
}

export interface TransferReport {
  data: string;
  nome: string;
  principio_ativo: string | null;
  descricao: string | null;
  quantidade: number;
  casela: number | null;
  residente: string | null;
  armario: number | null;
  lote: string | null;
  destino: string | null;
  observacao: string | null;
}

export interface PeriodMovementReport {
  data: string;
  tipo_movimentacao: "entrada" | "saida" | "transferencia";
  nome: string;
  principio_ativo: string | null;
  descricao: string | null;
  quantidade: number;
  casela: number | null;
  residente: string | null;
  armario: number | null;
  gaveta: number | null;
  setor: string;
  lote: string | null;
  destino: string | null;
}

export interface ResidentMedicinesReport {
  residente: string;
  casela: number;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
  medicamento: string;
  principio_ativo: string;
  dosagem: string;
  quantidade: number;
  validade: string;
}

export interface ExpiredMedicineReport {
  medicamento: string;
  principio_ativo: string;
  quantidade: number;
  validade: string;
  residente: string | null;
  dias_vencido: number;
  lote: string | null;
  setor: string;
}

export interface ExpiringSoonReport {
  tipo: "medicamento" | "insumo";
  nome: string;
  principio_ativo?: string | null;
  descricao?: string | null;
  quantidade: number;
  validade: string;
  dias_para_vencer: number;
  residente: string | null;
  lote: string | null;
  setor: string;
  armario?: number | null;
  gaveta?: number | null;
}

interface MovementsReportPayload {
  data: PeriodMovementReport[];
  _reportMeta?: { period?: MovementPeriod };
}

interface InsumosMedicamentosReport {
  medicamentos?: unknown[];
  insumos?: unknown[];
}

interface PsicotropicosReport {
  psicotropico?: unknown[];
}

interface ResidentConsumptionReport {
  residente: string;
  casela: number;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
  medicamentos: {
    nome: string;
    principio_ativo: string;
    preco_formatado: string;
    quantidade_estoque: number;
    observacao?: string | null;
  }[];
  insumos: {
    nome: string;
    descricao: string | null;
    preco_formatado: string;
    quantidade_estoque: number;
  }[];
  custos_medicamentos: {
    item: string;
    nome: string;
    custo_mensal_formatado: string;
    custo_anual_formatado: string;
  }[];
  custos_insumos: {
    item: string;
    nome: string;
    custo_mensal_formatado: string;
    custo_anual_formatado: string;
  }[];
  total_estimado_formatado: string;
}

interface RowData {
  insumo?: string;
  principio_ativo?: string;
  quantidade?: number | string;
  validade?: string;
  residente?: string;
  medicamento?: string;
  casela?: number | string;
  data?: string;
  consumo_mensal?: string | number;
  armario?: number | string;
  gaveta?: number | string;
  medicamentos?: RowData[];
  insumos?: RowData[];
  [key: string]: unknown;
}

type ResidentMedicalRecordReport = {
  residente: string;
  casela: number | string;
  cpf?: string | null;
  data_nascimento?: string | null;
  idade?: number | null;
  itens: RowData[];
};

function formatPdfRowDates(r: RowData): RowData {
  const out = { ...r } as Record<string, unknown>;
  if (out.validade != null && String(out.validade).trim() !== "") {
    out.validade = formatValidityDate(String(out.validade));
  }
  for (const key of [
    "data",
    "data_movimentacao",
    "data_entrada",
    "data_saida",
  ]) {
    const v = out[key];
    if (v != null && String(v).trim() !== "") {
      out[key] = formatDateOrDateTimePtBr(String(v));
    }
  }
  return out as RowData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingHorizontal: 30,
    paddingBottom: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    backgroundColor: "#ffffff",
  },

  topLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  logo: { width: 130, height: 60, objectFit: "contain" },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
    color: "#000",
    textTransform: "uppercase",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 6,
    color: "#000",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e5e5e5",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 8,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },

  striped: {
    backgroundColor: "#f2f2f2",
  },

  cell: {
    flex: 1,
    paddingHorizontal: 2,
    fontSize: 8,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  cellNumeric: {
    flex: 0.5,
    paddingHorizontal: 2,
    fontSize: 8,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    overflow: "hidden",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    right: 30,
    fontSize: 8,
    color: "#444",
  },
});

interface ColumnConfig {
  header: string;
  key: string;
  isNumeric?: boolean;
}

function renderTableWithConfig(
  columns: ColumnConfig[],
  rows: RowData[],
  customCellRenderer?: (
    row: RowData,
    column: ColumnConfig,
    index: number,
  ) => React.ReactNode,
) {
  return (
    <>
      <View style={styles.tableHeader}>
        {columns.map((col, i) => (
          <Text
            key={i}
            style={col.isNumeric ? styles.cellNumeric : styles.cell}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {rows.map((row, idx) => (
        <View
          key={idx}
          style={[styles.tableRow, idx % 2 === 0 ? styles.striped : undefined]}
        >
          {columns.map((col, i) => {
            if (customCellRenderer) {
              return <View key={i}>{customCellRenderer(row, col, i)}</View>;
            }

            const key = col.key
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/\s+/g, "_");

            const value = (row[key as keyof RowData] ?? "") as string | number;

            return (
              <Text
                key={i}
                style={col.isNumeric ? styles.cellNumeric : styles.cell}
              >
                {value}
              </Text>
            );
          })}
        </View>
      ))}
    </>
  );
}

function renderTable(headers: string[], rows: RowData[]) {
  const columns: ColumnConfig[] = headers.map((h) => {
    const normalized = h
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "_");

    const numericColumns = [
      "quantidade",
      "armario",
      "gaveta",
      "casela",
      "dias_vencido",
      "dias_para_vencer",
      "consumo_mensal",
      "item",
    ];

    return {
      header: h,
      key: normalized,
      isNumeric: numericColumns.includes(normalized),
    };
  });

  return renderTableWithConfig(columns, rows);
}

export function createStockPDF(
  tipo: string,
  data:
    | RowData[]
    | ResidentMedicalRecordReport
    | ResidentesResponse
    | ResidentConsumptionReport
    | TransferReport[]
    | MovementsReportPayload
    | ResidentMedicinesReport[]
    | ExpiredMedicineReport[]
    | ExpiringSoonReport[],
  _reportMeta?: { period: MovementPeriod },
  options?: { logoUrl?: string | null },
) {
  const effectiveLogoUrl =
    options?.logoUrl && String(options.logoUrl).trim()
      ? String(options.logoUrl).trim()
      : PDF_REPORT_LOGO_URL;
  const isResidentConsumption = tipo === "residente_consumo";
  const isTransferReport = tipo === "transferencias";
  const isMovementsReport = tipo === "movimentacoes";
  const isResidentMedicines = tipo === "medicamentos_residente";
  const isExpiredMedicines = tipo === "medicamentos_vencidos";
  const isExpiringSoon = tipo === "expiringSoon";
  const isResidentMedicalRecordReport = tipo === "prontuario_residente";
  const consumptionData = isResidentConsumption
    ? (data as ResidentConsumptionReport)
    : null;
  const transferData = isTransferReport ? (data as TransferReport[]) : null;

  const movementsData = isMovementsReport
    ? (data as MovementsReportPayload).data
    : null;
  const residentMedicinesData = isResidentMedicines
    ? (data as ResidentMedicinesReport[])
    : null;
  const expiredMedicinesData = isExpiredMedicines
    ? (data as ExpiredMedicineReport[])
    : null;
  const expiringSoonData = isExpiringSoon
    ? (data as ExpiringSoonReport[])
    : null;

  const residentMedicalRecordData = isResidentMedicalRecordReport
    ? (data as ResidentMedicalRecordReport)
    : null;

  const movementsPayload = isMovementsReport
    ? (data as MovementsReportPayload)
    : null;

  const movementHeading =
    movementsPayload?._reportMeta?.period === MovementPeriod.MENSAL
      ? "MOVIMENTAÇÕES MENSAIS"
      : movementsPayload?._reportMeta?.period === MovementPeriod.INTERVALO
        ? "MOVIMENTAÇÕES NO PERÍODO"
        : "MOVIMENTAÇÕES DO DIA";
  const movementSection =
    movementsPayload?._reportMeta?.period === MovementPeriod.MENSAL
      ? "Movimentações do Mês"
      : movementsPayload?._reportMeta?.period === MovementPeriod.INTERVALO
        ? "Movimentações do Período"
        : "Movimentações do Dia";
  const movementEmpty =
    movementsPayload?._reportMeta?.period === MovementPeriod.MENSAL
      ? "Nenhuma movimentação encontrada no mês."
      : movementsPayload?._reportMeta?.period === MovementPeriod.INTERVALO
        ? "Nenhuma movimentação encontrada no período."
        : "Nenhuma movimentação encontrada no dia.";

  const showCabinetColumn =
    Array.isArray(movementsData) &&
    movementsData.some((movement) => movement.armario != null);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.topLine} />

        <View style={styles.header}>
          <Image src={effectiveLogoUrl} style={styles.logo} />
          <Text style={styles.title}>
            {isResidentConsumption
              ? "CONSUMO DO RESIDENTE"
              : isTransferReport
                ? "TRANSFERÊNCIAS DA FARMÁCIA PARA ENFERMARIA"
                : isMovementsReport
                  ? movementHeading
                  : isResidentMedicines
                    ? "MEDICAMENTOS POR RESIDENTE"
                    : isExpiredMedicines
                      ? "MEDICAMENTOS VENCIDOS"
                      : isExpiringSoon
                        ? "MEDICAMENTOS E INSUMOS PRÓXIMOS AO VENCIMENTO"
                        : isResidentMedicalRecordReport
                          ? "PRONTUÁRIO DO RESIDENTE"
                          : "ESTOQUE ATUAL"}
          </Text>
        </View>

        {isResidentMedicalRecordReport && residentMedicalRecordData && (
          <>
            <View style={{ marginBottom: 15 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}
              >
                Residente: {residentMedicalRecordData.residente}
              </Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Casela: {residentMedicalRecordData.casela}
              </Text>
              {residentMedicalRecordData.cpf ? (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  CPF: {residentMedicalRecordData.cpf}
                </Text>
              ) : null}
              {residentMedicalRecordData.data_nascimento ? (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Nascimento:{" "}
                  {formatDateToPtBr(residentMedicalRecordData.data_nascimento)}
                </Text>
              ) : null}
              {typeof residentMedicalRecordData.idade === "number" ? (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Idade: {residentMedicalRecordData.idade}
                </Text>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Itens em stock</Text>

            {renderTableWithConfig(
              [
                { header: "Categoria", key: "categoria" },
                { header: "Nome", key: "nome" },
                { header: "Qtd.", key: "quantidade", isNumeric: true },
                { header: "Validade", key: "validade" },
                { header: "Entrada", key: "data_entrada" },
                { header: "Saída", key: "data_saida" },
                { header: "Armário", key: "armario", isNumeric: true },
                { header: "Gaveta", key: "gaveta", isNumeric: true },
                { header: "Setor", key: "setor" },
                { header: "Lote", key: "lote" },
              ],
              (residentMedicalRecordData.itens ?? []).map((r) => {
                const ext = r as RowData & { qtd?: unknown };
                return formatPdfRowDates({
                  ...r,
                  quantidade:
                    ext.quantidade != null && ext.quantidade !== ""
                      ? ext.quantidade
                      : ext.qtd,
                } as RowData);
              }),
            )}
          </>
        )}

        {isResidentConsumption && consumptionData && (
          <>
            <View style={{ marginBottom: 15 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "bold", marginBottom: 5 }}
              >
                Residente: {consumptionData.residente}
              </Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                Casela: {consumptionData.casela}
              </Text>
              {consumptionData.cpf ? (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  CPF: {consumptionData.cpf}
                </Text>
              ) : null}
              {consumptionData.data_nascimento ? (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Nascimento:{" "}
                  {formatDateToPtBr(consumptionData.data_nascimento)}
                </Text>
              ) : null}
              {typeof consumptionData.idade === "number" ? (
                <Text style={{ fontSize: 12, color: "#666" }}>
                  Idade: {consumptionData.idade}
                </Text>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>1. Medicamentos e Uso</Text>
            {consumptionData.medicamentos.length > 0 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.cell}>Nome do Medicamento</Text>
                  <Text style={styles.cell}>Preço Unitário (R$)</Text>
                  <Text style={styles.cell}>Observação</Text>
                </View>
                {consumptionData.medicamentos.map((med, idx) => {
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0 ? styles.striped : undefined,
                      ]}
                    >
                      <Text style={styles.cell}>{med.nome || "-"}</Text>
                      <Text style={styles.cell}>
                        {med.preco_formatado || "-"}
                      </Text>
                      <Text style={styles.cell}>{med.observacao || "-"}</Text>
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum medicamento encontrado para este residente.
              </Text>
            )}

            <Text style={styles.sectionTitle}>2. Insumos</Text>
            {consumptionData.insumos.length > 0 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.cell}>Nome do Insumo</Text>
                  <Text style={styles.cell}>Descrição</Text>
                  <Text style={styles.cell}>Preço Unitário (R$)</Text>
                </View>
                {consumptionData.insumos.map((input, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text style={styles.cell}>{input.nome || "-"}</Text>
                    <Text style={styles.cell}>{input.descricao || "-"}</Text>
                    <Text style={styles.cell}>
                      {input.preco_formatado || "-"}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum insumo encontrado para este residente.
              </Text>
            )}

            <Text style={styles.sectionTitle}>
              Custos Estimados - Medicamentos
            </Text>
            {consumptionData.custos_medicamentos.length > 0 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.cell}>Item</Text>
                  <Text style={styles.cell}>Nome do Medicamento</Text>
                  <Text style={styles.cell}>Custo Mensal (R$)</Text>
                  <Text style={styles.cell}>Custo Anual (R$)</Text>
                </View>
                {consumptionData.custos_medicamentos.map((custo, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text style={styles.cell}>{custo.item || "-"}</Text>
                    <Text style={styles.cell}>{custo.nome || "-"}</Text>
                    <Text style={styles.cell}>
                      {custo.custo_mensal_formatado || "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {custo.custo_anual_formatado || "-"}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum custo de medicamento encontrado.
              </Text>
            )}

            <Text style={styles.sectionTitle}>Custos Estimados - Insumos</Text>
            {consumptionData.custos_insumos.length > 0 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.cell}>Item</Text>
                  <Text style={styles.cell}>Nome do Insumo</Text>
                  <Text style={styles.cell}>Custo Mensal (R$)</Text>
                  <Text style={styles.cell}>Custo Anual (R$)</Text>
                </View>
                {consumptionData.custos_insumos.map((custo, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text style={styles.cell}>{custo.item || "-"}</Text>
                    <Text style={styles.cell}>{custo.nome || "-"}</Text>
                    <Text style={styles.cell}>
                      {custo.custo_mensal_formatado || "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {custo.custo_anual_formatado || "-"}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum custo de insumo encontrado.
              </Text>
            )}

            <View
              style={{
                marginTop: 20,
                padding: 10,
                backgroundColor: "#f0f0f0",
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "#000",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Total Estimado Anual: R${" "}
                {consumptionData.total_estimado_formatado || "-"}
              </Text>
            </View>
          </>
        )}

        {tipo === "residentes" && (
          <>
            <Text style={styles.sectionTitle}>Medicamentos por Residente</Text>

            {renderTable(
              [
                "Residente",
                "Casela",
                "Medicamento",
                "Principio Ativo",
                "Quantidade",
                "Validade",
              ],
              ((data as ResidentesResponse).detalhes as RowData[]).map(
                formatPdfRowDates,
              ),
            )}

            <Text style={styles.sectionTitle}>Consumo Mensal</Text>

            {renderTable(
              [
                "Residente",
                "Casela",
                "Medicamento",
                "Principio Ativo",
                "Data",
                "Consumo Mensal",
              ],
              ((data as ResidentesResponse).consumo_mensal as RowData[]).map(
                formatPdfRowDates,
              ),
            )}
          </>
        )}

        {tipo === "medicamentos" && (
          <>
            <Text style={styles.sectionTitle}>Medicamentos</Text>
            {renderTable(
              [
                "Medicamento",
                "Principio Ativo",
                "Quantidade",
                "Validade",
                "Data Entrada",
                "Data Saída",
                "Residente",
              ],
              (data as RowData[]).map(formatPdfRowDates),
            )}
          </>
        )}

        {tipo === "insumos" && (
          <>
            <Text style={styles.sectionTitle}>Insumos</Text>
            {renderTable(
              [
                "Insumo",
                "Quantidade",
                "Armario",
                "Validade",
                "Data Entrada",
                "Data Saída",
                "Residente",
              ],
              (data as RowData[]).map(formatPdfRowDates),
            )}
          </>
        )}

        {isExpiringSoon && expiringSoonData && (
          <>
            <Text style={styles.sectionTitle}>
              Medicamentos e Insumos Próximos ao Vencimento
            </Text>

            {expiringSoonData.length > 0 ? (
              <>
                {renderTableWithConfig(
                  [
                    { header: "Tipo", key: "tipo" },
                    { header: "Nome", key: "nome" },
                    { header: "Complemento", key: "complemento" },
                    {
                      header: "Quantidade",
                      key: "quantidade",
                      isNumeric: true,
                    },
                    { header: "Validade", key: "validade" },
                    {
                      header: "Dias para Vencer",
                      key: "dias_para_vencer",
                      isNumeric: true,
                    },
                    { header: "Setor", key: "setor" },
                    { header: "Armário", key: "armario", isNumeric: true },
                    { header: "Gaveta", key: "gaveta", isNumeric: true },
                    { header: "Lote", key: "lote" },
                    { header: "Residente", key: "residente" },
                  ],
                  expiringSoonData.map((item) => ({
                    tipo:
                      item.tipo === "medicamento" ? "Medicamento" : "Insumo",
                    nome: item.nome || "-",
                    complemento: item.principio_ativo || item.descricao || "-",
                    quantidade: item.quantidade ?? "-",
                    validade: item.validade
                      ? formatValidityDate(item.validade)
                      : "-",
                    dias_para_vencer: item.dias_para_vencer ?? "-",
                    setor: item.setor || "-",
                    armario: item.armario ?? "-",
                    gaveta: item.gaveta ?? "-",
                    lote: item.lote || "-",
                    residente: item.residente || "-",
                  })),
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum item próximo ao vencimento encontrado.
              </Text>
            )}
          </>
        )}

        {tipo === "insumos_medicamentos" && (
          <>
            <Text style={styles.sectionTitle}>Medicamentos</Text>
            {renderTable(
              [
                "Medicamento",
                "Principio Ativo",
                "Quantidade",
                "Validade",
                "Residente",
              ],
              (
                ((data as InsumosMedicamentosReport).medicamentos ??
                  []) as RowData[]
              ).map(formatPdfRowDates),
            )}

            <Text style={styles.sectionTitle}>Insumos</Text>
            {renderTable(
              ["Insumo", "Quantidade", "Armario"],
              (
                ((data as InsumosMedicamentosReport).insumos ?? []) as RowData[]
              ).map(formatPdfRowDates),
            )}
          </>
        )}

        {tipo === "psicotropicos" && (
          <>
            <Text style={styles.sectionTitle}>Psicotrópicos</Text>
            {renderTable(
              [
                "Tipo",
                "Medicamento",
                "Residente",
                "Data Movimentação",
                "Quantidade",
              ],
              (
                ((data as PsicotropicosReport).psicotropico ?? []) as RowData[]
              ).map(formatPdfRowDates),
            )}
          </>
        )}

        {isTransferReport && transferData && (
          <>
            {transferData.length > 0 ? (
              <>
                {renderTableWithConfig(
                  [
                    { header: "Data", key: "data" },
                    { header: "Item", key: "nome" },
                    { header: "Complemento", key: "complemento" },
                    {
                      header: "Quantidade",
                      key: "quantidade",
                      isNumeric: true,
                    },
                    { header: "Armário", key: "armario", isNumeric: true },
                    { header: "Casela", key: "casela", isNumeric: true },
                    { header: "Residente", key: "residente" },
                    { header: "Lote", key: "lote" },
                    { header: "Destino", key: "destino" },
                    { header: "Observação", key: "observacao" },
                  ],
                  transferData.map((transfer) => ({
                    data: transfer.data
                      ? formatDateOrDateTimePtBr(transfer.data)
                      : "-",
                    nome: transfer.nome || "-",
                    complemento:
                      transfer.principio_ativo || transfer.descricao || "-",
                    quantidade: transfer.quantidade ?? "-",
                    armario: transfer.armario ?? "-",
                    casela: transfer.casela ?? "-",
                    residente: transfer.residente || "-",
                    lote: transfer.lote || "-",
                    destino: transfer.destino || "-",
                    observacao: transfer.observacao || "-",
                  })),
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhuma transferência encontrada no período selecionado.
              </Text>
            )}
          </>
        )}

        {isMovementsReport && movementsData && (
          <>
            <Text style={styles.sectionTitle}>{movementSection}</Text>

            {movementsData.length > 0 ? (
              <>
                {renderTableWithConfig(
                  [
                    { header: "Data/Hora", key: "data" },
                    { header: "Tipo", key: "tipo_movimentacao" },
                    { header: "Item", key: "nome" },
                    { header: "Complemento", key: "complemento" },
                    {
                      header: "Quantidade",
                      key: "quantidade",
                      isNumeric: true,
                    },
                    { header: "Setor", key: "setor" },
                    { header: "Casela", key: "casela", isNumeric: true },
                    {
                      header: showCabinetColumn ? "Armário" : "Gaveta",
                      key: showCabinetColumn ? "armario" : "gaveta",
                      isNumeric: true,
                    },
                    { header: "Lote", key: "lote" },
                    { header: "Destino", key: "destino" },
                  ],
                  movementsData.map((movement) => ({
                    data: movement.data
                      ? formatDateOrDateTimePtBr(movement.data)
                      : "-",
                    tipo_movimentacao: movement.tipo_movimentacao || "-",
                    nome: movement.nome || "-",
                    complemento:
                      movement.principio_ativo ?? movement.descricao ?? "-",
                    quantidade: movement.quantidade ?? "-",
                    setor: movement.setor || "-",
                    casela: movement.casela ?? "-",
                    armario: showCabinetColumn
                      ? (movement.armario ?? "-")
                      : undefined,
                    gaveta: !showCabinetColumn
                      ? (movement.gaveta ?? "-")
                      : undefined,
                    lote: movement.lote ?? "-",
                    destino: movement.destino ?? "-",
                  })),
                )}
              </>
            ) : (
              <Text style={{ fontSize: 8, marginTop: 10, color: "#666" }}>
                {movementEmpty}
              </Text>
            )}
          </>
        )}

        {isResidentMedicines && residentMedicinesData && (
          <>
            {residentMedicinesData.length > 0 ? (
              <>
                <View style={{ marginBottom: 15 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      marginBottom: 5,
                    }}
                  >
                    Residente: {residentMedicinesData[0]?.residente || ""}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#666" }}>
                    Casela: {residentMedicinesData[0]?.casela || ""}
                  </Text>
                  {residentMedicinesData[0]?.cpf ? (
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      CPF: {residentMedicinesData[0]?.cpf}
                    </Text>
                  ) : null}
                  {residentMedicinesData[0]?.data_nascimento ? (
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      Nascimento:{" "}
                      {formatDateToPtBr(
                        String(residentMedicinesData[0]?.data_nascimento),
                      )}
                    </Text>
                  ) : null}
                  {typeof residentMedicinesData[0]?.idade === "number" ? (
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      Idade: {residentMedicinesData[0]?.idade}
                    </Text>
                  ) : null}
                </View>

                {renderTableWithConfig(
                  [
                    { header: "Medicamento", key: "medicamento" },
                    { header: "Princípio Ativo", key: "principio_ativo" },
                    {
                      header: "Quantidade",
                      key: "quantidade",
                      isNumeric: true,
                    },
                    { header: "Validade", key: "validade" },
                  ],
                  residentMedicinesData.map((item) => ({
                    medicamento: item.medicamento || "-",
                    principio_ativo: item.principio_ativo || "-",
                    quantidade: item.quantidade ?? "-",
                    validade: item.validade
                      ? formatValidityDate(item.validade)
                      : "-",
                  })),
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum medicamento encontrado para este residente.
              </Text>
            )}
          </>
        )}

        {isExpiredMedicines && expiredMedicinesData && (
          <>
            <Text style={styles.sectionTitle}>Medicamentos Vencidos</Text>

            {expiredMedicinesData.length > 0 ? (
              <>
                {renderTableWithConfig(
                  [
                    { header: "Medicamento", key: "medicamento" },
                    { header: "Princípio Ativo", key: "principio_ativo" },
                    {
                      header: "Quantidade",
                      key: "quantidade",
                      isNumeric: true,
                    },
                    { header: "Validade", key: "validade" },
                    {
                      header: "Dias Vencido",
                      key: "dias_vencido",
                      isNumeric: true,
                    },
                    { header: "Lote", key: "lote" },
                    { header: "Setor", key: "setor" },
                    { header: "Residente", key: "residente" },
                  ],
                  expiredMedicinesData.map((item) => ({
                    medicamento: item.medicamento || "-",
                    principio_ativo: item.principio_ativo || "-",
                    quantidade: item.quantidade ?? "-",
                    validade: item.validade
                      ? formatValidityDate(item.validade)
                      : "-",
                    dias_vencido: item.dias_vencido ?? "-",
                    lote: item.lote || "-",
                    setor: item.setor || "-",
                    residente: item.residente || "-",
                  })),
                )}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum medicamento vencido encontrado.
              </Text>
            )}
          </>
        )}

        <Text style={styles.footer}>
          Gerado em: {formatDateToPtBr(new Date())} às{" "}
          {formatTimePtBr(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
