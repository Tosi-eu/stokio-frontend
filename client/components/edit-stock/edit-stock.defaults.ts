import { ItemStockType } from "@/utils/enums";

/** Valores iniciais do formulário de edição de estoque (useForm defaultValues). */
export function getEditStockFormDefaults(defaultSetor: string) {
  return {
    quantidade: 0,
    armario_id: null,
    gaveta_id: null,
    validade: null,
    origem: null,
    setor: defaultSetor,
    lote: null,
    casela_id: null,
    tipo: ItemStockType.GERAL,
    preco: "",
    observacao: null,
    dias_para_repor: null,
  };
}
