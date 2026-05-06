export enum OperationType {
  MEDICINE = "medicamento",
  INPUT = "insumo",
}

export enum OriginType {
  FAMILIA = "Família",
  ALTOCUSTO = "Altocusto",
  UBS = "UBS",
  FARMACIA_POPULAR = "Farmácia Popular",
  COMPRA_DOACAO = "Compra/Doação",
}

export enum StockCategory {
  MEDICINE = "Medicamento",
  INPUT = "Insumo",
}

export enum ItemStockType {
  GERAL = "geral",
  INDIVIDUAL = "individual",
  CARRINHO = "carrinho_emergencia",
  CARRINHO_PSICOTROPICOS = "carrinho_psicotropicos",
}

export enum TransactionType {
  COMPRA = "Compra",
  DOACAO = "Doação",
  REPOSICAO = "Reposição",
}

export enum MovementType {
  IN = "entrada",
  OUT = "saida",
  TRANSFER = "transferencia",
}

export enum StockTypeLabels {
  geral = "Estoque geral",
  individual = "Estoque individual",
  carrinho_emergencia = "Carrinho de emergência",
  carrinho_psicotropicos = "Carrinho de psicotrópicos",
}

export enum StockWizardSteps {
  TIPO = "tipo",
  ITENS = "itens",
  QUANTIDADE = "quantidade",
}

export enum EventStatus {
  PENDENTE = "pending",
  ENVIADO = "sent",
  CANCELADO = "cancelled",
}

export enum SectorType {
  FARMACIA = "farmacia",
  ENFERMAGEM = "enfermagem",
}

export enum NotificationDestiny {
  SUS = "sus",
  FAMILY = "familia",
  PHARMACY = "farmacia",
  STOCK = "estoque",
}
