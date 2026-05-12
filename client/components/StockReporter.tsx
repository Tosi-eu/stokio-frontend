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
    backgroundColor: "#0f172a",
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#0f172a",
    alignItems: "flex-start",
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    alignItems: "flex-start",
  },

  striped: {
    backgroundColor: "#f1f5f9",
  },

  cellShell: {
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },

  cellText: {
    fontSize: 7,
    color: "#0f172a",
    lineHeight: 1.35,
    textAlign: "center",
  },

  cellTextNumeric: {
    fontSize: 7,
    color: "#0f172a",
    lineHeight: 1.35,
    textAlign: "center",
  },

  headerCellText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#f8fafc",
    lineHeight: 1.35,
    textAlign: "center",
  },

  headerCellTextNumeric: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#f8fafc",
    lineHeight: 1.35,
    textAlign: "center",
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
  /** Peso horizontal da coluna (nome/descrição maiores que código). */
  flex?: number;
}

function defaultFlexForKey(normalizedKey: string, isNumeric: boolean): number {
  if (isNumeric) return 0.62;
  const k = normalizedKey.toLowerCase();
  if (
    /nome|descricao|medicamento|insumo|residente|principio|observacao|destino|complemento|detalhe/.test(
      k,
    )
  ) {
    return 2;
  }
  if (/data|tipo|validade|setor|lote|categoria/.test(k)) {
    return 1.05;
  }
  return 1;
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
        {columns.map((col, i) => {
          const flex = col.flex ?? defaultFlexForKey(col.key, !!col.isNumeric);
          const isNum = !!col.isNumeric;
          return (
            <View key={i} style={[styles.cellShell, { flex }]}>
              <Text
                style={
                  isNum ? styles.headerCellTextNumeric : styles.headerCellText
                }
              >
                {col.header}
              </Text>
            </View>
          );
        })}
      </View>

      {rows.map((row, idx) => (
        <View
          key={idx}
          style={[styles.tableRow, idx % 2 === 0 ? styles.striped : undefined]}
        >
          {columns.map((col, i) => {
            const flex =
              col.flex ?? defaultFlexForKey(col.key, !!col.isNumeric);
            if (customCellRenderer) {
              return (
                <View key={i} style={[styles.cellShell, { flex }]}>
                  {customCellRenderer(row, col, i)}
                </View>
              );
            }

            const key = col.key
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/\s+/g, "_");

            const value = (row[key as keyof RowData] ?? "") as string | number;

            return (
              <View key={i} style={[styles.cellShell, { flex }]}>
                <Text
                  style={
                    col.isNumeric ? styles.cellTextNumeric : styles.cellText
                  }
                >
                  {value}
                </Text>
              </View>
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

    const isNumeric = numericColumns.includes(normalized);

    return {
      header: h,
      key: normalized,
      isNumeric,
      flex: defaultFlexForKey(normalized, isNumeric),
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
                  <View style={[styles.cellShell, { flex: 2.2 }]}>
                    <Text style={styles.headerCellText}>
                      Nome do Medicamento
                    </Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1 }]}>
                    <Text style={styles.headerCellTextNumeric}>
                      Preço Unitário (R$)
                    </Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1.6 }]}>
                    <Text style={styles.headerCellText}>Observação</Text>
                  </View>
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
                      <View style={[styles.cellShell, { flex: 2.2 }]}>
                        <Text style={styles.cellText}>{med.nome || "-"}</Text>
                      </View>
                      <View style={[styles.cellShell, { flex: 1 }]}>
                        <Text style={styles.cellTextNumeric}>
                          {med.preco_formatado || "-"}
                        </Text>
                      </View>
                      <View style={[styles.cellShell, { flex: 1.6 }]}>
                        <Text style={styles.cellText}>
                          {med.observacao || "-"}
                        </Text>
                      </View>
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
                  <View style={[styles.cellShell, { flex: 1.4 }]}>
                    <Text style={styles.headerCellText}>Nome do Insumo</Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 2 }]}>
                    <Text style={styles.headerCellText}>Descrição</Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1 }]}>
                    <Text style={styles.headerCellTextNumeric}>
                      Preço Unitário (R$)
                    </Text>
                  </View>
                </View>
                {consumptionData.insumos.map((input, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <View style={[styles.cellShell, { flex: 1.4 }]}>
                      <Text style={styles.cellText}>{input.nome || "-"}</Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 2 }]}>
                      <Text style={styles.cellText}>
                        {input.descricao || "-"}
                      </Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 1 }]}>
                      <Text style={styles.cellTextNumeric}>
                        {input.preco_formatado || "-"}
                      </Text>
                    </View>
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
                  <View style={[styles.cellShell, { flex: 0.75 }]}>
                    <Text style={styles.headerCellText}>Item</Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 2 }]}>
                    <Text style={styles.headerCellText}>
                      Nome do Medicamento
                    </Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1 }]}>
                    <Text style={styles.headerCellTextNumeric}>
                      Custo Mensal (R$)
                    </Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1 }]}>
                    <Text style={styles.headerCellTextNumeric}>
                      Custo Anual (R$)
                    </Text>
                  </View>
                </View>
                {consumptionData.custos_medicamentos.map((custo, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <View style={[styles.cellShell, { flex: 0.75 }]}>
                      <Text style={styles.cellText}>{custo.item || "-"}</Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 2 }]}>
                      <Text style={styles.cellText}>{custo.nome || "-"}</Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 1 }]}>
                      <Text style={styles.cellTextNumeric}>
                        {custo.custo_mensal_formatado || "-"}
                      </Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 1 }]}>
                      <Text style={styles.cellTextNumeric}>
                        {custo.custo_anual_formatado || "-"}
                      </Text>
                    </View>
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
                  <View style={[styles.cellShell, { flex: 0.75 }]}>
                    <Text style={styles.headerCellText}>Item</Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 2 }]}>
                    <Text style={styles.headerCellText}>Nome do Insumo</Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1 }]}>
                    <Text style={styles.headerCellTextNumeric}>
                      Custo Mensal (R$)
                    </Text>
                  </View>
                  <View style={[styles.cellShell, { flex: 1 }]}>
                    <Text style={styles.headerCellTextNumeric}>
                      Custo Anual (R$)
                    </Text>
                  </View>
                </View>
                {consumptionData.custos_insumos.map((custo, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <View style={[styles.cellShell, { flex: 0.75 }]}>
                      <Text style={styles.cellText}>{custo.item || "-"}</Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 2 }]}>
                      <Text style={styles.cellText}>{custo.nome || "-"}</Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 1 }]}>
                      <Text style={styles.cellTextNumeric}>
                        {custo.custo_mensal_formatado || "-"}
                      </Text>
                    </View>
                    <View style={[styles.cellShell, { flex: 1 }]}>
                      <Text style={styles.cellTextNumeric}>
                        {custo.custo_anual_formatado || "-"}
                      </Text>
                    </View>
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
                    { header: "Data/Hora", key: "data", flex: 1.2 },
                    {
                      header: "Tipo",
                      key: "tipo_movimentacao",
                      flex: 0.82,
                    },
                    { header: "Item", key: "nome", flex: 1.95 },
                    { header: "Complemento", key: "complemento", flex: 1.75 },
                    {
                      header: "Quantidade",
                      key: "quantidade",
                      isNumeric: true,
                      flex: 0.58,
                    },
                    { header: "Setor", key: "setor", flex: 0.95 },
                    {
                      header: "Casela",
                      key: "casela",
                      isNumeric: true,
                      flex: 0.52,
                    },
                    {
                      header: showCabinetColumn ? "Armário" : "Gaveta",
                      key: showCabinetColumn ? "armario" : "gaveta",
                      isNumeric: true,
                      flex: 0.52,
                    },
                    { header: "Lote", key: "lote", flex: 0.85 },
                    { header: "Destino", key: "destino", flex: 0.95 },
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
