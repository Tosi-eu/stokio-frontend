export const MOVEMENTS_TABLE_COLUMNS = [
  { key: "name", label: "Produto", editable: false },
  { key: "additionalData", label: "Complemento", editable: false },
  { key: "quantity", label: "Quantidade", editable: false },
  { key: "operator", label: "Usuário", editable: false },
  { key: "movementDate", label: "Data", editable: false },
  { key: "cabinet", label: "Armário", editable: false },
  { key: "drawerDisplay", label: "Gaveta", editable: false },
  { key: "resident", label: "Casela", editable: false },
  { key: "sector", label: "Setor", editable: false },
  { key: "lot", label: "Lote", editable: false },
] as const;
