import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

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

interface ResidentConsumptionReport {
  residente: string;
  casela: number;
  medicamentos: {
    nome: string;
    dosagem: string;
    unidade_medida: string;
    principio_ativo: string;
    preco: number | null;
    quantidade_estoque: number;
    observacao?: string | null;
  }[];
  insumos: {
    nome: string;
    descricao: string | null;
    preco: number | null;
    quantidade_estoque: number;
  }[];
  custos_medicamentos: {
    item: string;
    nome: string;
    custo_mensal: number;
    custo_anual: number;
  }[];
  custos_insumos: {
    item: string;
    nome: string;
    custo_mensal: number;
    custo_anual: number;
  }[];
  total_estimado: number;
}

interface RowData {
  insumo?: string;
  principio_ativo?: string;
  quantidade?: number | string;
  validade: string;
  residente?: string;
  medicamento?: string;
  casela?: number;
  data?: string;
  consumo_mensal?: string | number;
  armario?: number;
  medicamentos?: RowData[];
  insumos?: RowData[];
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

  logo: { width: 90 },

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

  footer: {
    position: "absolute",
    bottom: 20,
    right: 30,
    fontSize: 8,
    color: "#444",
  },
});

function renderTable(headers: string[], rows: RowData[]) {
  return (
    <>
      <View style={styles.tableHeader}>
        {headers.map((h, i) => (
          <Text key={i} style={styles.cell}>
            {h}
          </Text>
        ))}
      </View>

      {rows.map((row, idx) => (
        <View
          key={idx}
          style={[styles.tableRow, idx % 2 === 0 ? styles.striped : undefined]}
        >
          {headers.map((h, i) => {
            const key = h
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/\s+/g, "_");

            let value: any = row[key as keyof RowData] ?? "";

            return (
              <Text key={i} style={styles.cell}>
                {value}
              </Text>
            );
          })}
        </View>
      ))}
    </>
  );
}

export function createStockPDF(
  tipo: string,
  data:
    | RowData[]
    | ResidentesResponse
    | ResidentConsumptionReport
    | TransferReport[]
    | PeriodMovementReport[]
    | ResidentMedicinesReport[]
    | ExpiredMedicineReport[],
  _reportMeta?: { period: MovementPeriod },
) {
  const isResidentConsumption = tipo === "residente_consumo";
  const isTransferReport = tipo === "transferencias";
  const isMovementsReport = tipo === "movimentacoes";
  const isResidentMedicines = tipo === "medicamentos_residente";
  const isExpiredMedicines = tipo === "medicamentos_vencidos";
  const consumptionData = isResidentConsumption
    ? (data as ResidentConsumptionReport)
    : null;
  const transferData = isTransferReport ? (data as TransferReport[]) : null;

  const movementsData = isMovementsReport
    ? ((data as any).data as PeriodMovementReport[])
    : null;
  const residentMedicinesData = isResidentMedicines
    ? (data as ResidentMedicinesReport[])
    : null;
  const expiredMedicinesData = isExpiredMedicines
    ? (data as ExpiredMedicineReport[])
    : null;

  const movementsPayload = isMovementsReport ? (data as any) : null;

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
          <Image
            src={
              import.meta.env.VITE_LOGO_URL ||
              import.meta.env.LOGO_URL ||
              "/logo.png"
            }
            style={styles.logo}
          />
          <Text style={styles.title}>
            {isResidentConsumption
              ? "CONSUMO DO RESIDENTE"
              : isTransferReport
                ? "TRANSFERÊNCIAS DE SETOR"
                : isMovementsReport
                  ? movementHeading
                  : isResidentMedicines
                    ? "MEDICAMENTOS POR RESIDENTE"
                    : isExpiredMedicines
                      ? "MEDICAMENTOS VENCIDOS"
                      : "ESTOQUE ATUAL"}
          </Text>
        </View>

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
            </View>

            <Text style={styles.sectionTitle}>1. Medicamentos e Uso</Text>
            {consumptionData.medicamentos.length > 0 ? (
              <>
                <View style={styles.tableHeader}>
                  <Text style={styles.cell}>Nome do Medicamento</Text>
                  <Text style={styles.cell}>Dosagem</Text>
                  <Text style={styles.cell}>Preço Unitário (R$)</Text>
                  <Text style={styles.cell}>Observação</Text>
                </View>
                {consumptionData.medicamentos.map((med, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text style={styles.cell}>{med.nome || "-"}</Text>
                    <Text style={styles.cell}>
                      {med.dosagem && med.unidade_medida
                        ? `${med.dosagem} ${med.unidade_medida}`
                        : med.dosagem || med.unidade_medida || "-"}
                    </Text>
                    <Text style={styles.cell}>
                      {med.preco !== null && med.preco !== undefined
                        ? `R$ ${Number(med.preco).toFixed(2)}`
                        : "-"}
                    </Text>
                    <Text style={styles.cell}>{med.observacao || "-"}</Text>
                  </View>
                ))}
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
                      {input.preco ? `R$ ${input.preco.toFixed(2)}` : "-"}
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
                      R$ {custo.custo_mensal.toFixed(2)}
                    </Text>
                    <Text style={styles.cell}>
                      R$ {custo.custo_anual.toFixed(2)}
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
                      R$ {custo.custo_mensal.toFixed(2)}
                    </Text>
                    <Text style={styles.cell}>
                      R$ {custo.custo_anual.toFixed(2)}
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
                {consumptionData.total_estimado.toFixed(2)}
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
              (data as ResidentesResponse).detalhes,
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
              (data as ResidentesResponse).consumo_mensal,
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
                "Residente",
              ],
              data as RowData[],
            )}
          </>
        )}

        {tipo === "insumos" && (
          <>
            <Text style={styles.sectionTitle}>Insumos</Text>
            {renderTable(
              ["Insumo", "Quantidade", "Armario", "Validade"],
              data as RowData[],
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
              (data as any).medicamentos ?? [],
            )}

            <Text style={styles.sectionTitle}>Insumos</Text>
            {renderTable(
              ["Insumo", "Quantidade", "Armario"],
              (data as any).insumos ?? [],
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
              (data as any).psicotropico ?? [],
            )}
          </>
        )}

        {isTransferReport && transferData && (
          <>
            <Text style={styles.sectionTitle}>
              Transferências de Farmácia para Enfermaria
            </Text>

            {transferData.length > 0 ? (
              <>
                <View style={[styles.tableHeader, { fontSize: 8 }]}>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Item</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>
                    Complemento
                  </Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Quantidade</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Armário</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Casela</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Residente</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Lote</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Destino</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Data</Text>
                </View>

                {transferData.map((transfer, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.nome || "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.principio_ativo || transfer.descricao || "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.quantidade}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.armario ?? "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.casela ?? "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.residente || "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.lote || "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.destino || "-"}
                    </Text>

                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {transfer.data}
                    </Text>
                  </View>
                ))}
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
                <View style={[styles.tableHeader, { fontSize: 8 }]}>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Tipo
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Item
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Complemento
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Quantidade
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Setor
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Casela
                  </Text>

                  {showCabinetColumn ? (
                    <Text style={styles.cell}>Armário</Text>
                  ) : (
                    <Text style={styles.cell}>Gaveta</Text>
                  )}

                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Lote
                  </Text>

                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Destino
                  </Text>
                </View>

                {movementsData.map((movement, idx) => {
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.tableRow,
                        idx % 2 === 0 ? styles.striped : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.tipo_movimentacao}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.nome || "-"}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.principio_ativo ?? movement.descricao ?? "-"}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.quantidade ?? "-"}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.setor || "-"}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.casela ?? "-"}
                      </Text>
                      {showCabinetColumn ? (
                        <Text style={styles.cell}>
                          {movement.armario ?? "-"}
                        </Text>
                      ) : (
                        <Text style={styles.cell}>
                          {movement.gaveta ?? "-"}
                        </Text>
                      )}
                      <Text
                        wrap
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.lote ?? "-"}
                      </Text>
                      <Text
                        style={[
                          styles.cell,
                          { fontSize: 8, textAlign: "center" },
                        ]}
                      >
                        {movement.destino ?? "-"}
                      </Text>
                    </View>
                  );
                })}
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
                </View>

                <View style={[styles.tableHeader, { fontSize: 8 }]}>
                  <Text style={[styles.cell, { fontSize: 8 }]}>
                    Medicamento
                  </Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>
                    Princípio Ativo
                  </Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Dosagem</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Quantidade</Text>
                  <Text style={[styles.cell, { fontSize: 8 }]}>Validade</Text>
                </View>

                {residentMedicinesData.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {item.medicamento}
                    </Text>
                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {item.principio_ativo}
                    </Text>
                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {item.dosagem}
                    </Text>
                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {item.quantidade}
                    </Text>
                    <Text style={[styles.cell, { fontSize: 8 }]}>
                      {item.validade}
                    </Text>
                  </View>
                ))}
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
                <View style={[styles.tableHeader, { fontSize: 8 }]}>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Medicamento
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Princípio Ativo
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Quantidade
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Validade
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Dias Vencido
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Lote
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Setor
                  </Text>
                  <Text
                    style={[styles.cell, { fontSize: 8, textAlign: "center" }]}
                  >
                    Residente
                  </Text>
                </View>

                {expiredMedicinesData.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? styles.striped : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.medicamento || "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.principio_ativo || "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.quantidade ?? "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.validade || "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.dias_vencido ?? "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.lote || "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.setor || "-"}
                    </Text>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: 8, textAlign: "center" },
                      ]}
                    >
                      {item.residente || "-"}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={{ fontSize: 10, marginTop: 10, color: "#666" }}>
                Nenhum medicamento vencido encontrado.
              </Text>
            )}
          </>
        )}

        <Text style={styles.footer}>
          Gerado em: {new Date().toLocaleDateString("pt-BR")} às{" "}
          {new Date().toLocaleTimeString("pt-BR")}
        </Text>
      </Page>
    </Document>
  );
}
