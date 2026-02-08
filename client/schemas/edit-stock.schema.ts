import { z } from "zod";
import { SectorType, OriginType, ItemStockType } from "@/utils/enums";

export const editStockSchema = z
  .object({
    quantidade: z
      .number({
        required_error: "Quantidade é obrigatória",
        invalid_type_error: "Quantidade deve ser um número",
      })
      .int("Quantidade deve ser um número inteiro")
      .min(1, "Quantidade deve ser maior que zero")
      .max(999999, "Quantidade não pode ser maior que 999.999"),

    armario_id: z.number().nullable().optional(),
    gaveta_id: z.number().nullable().optional(),
    validade: z.date().nullable().optional(),

    origem: z
      .union([z.nativeEnum(OriginType), z.null(), z.undefined()])
      .optional(),

    setor: z.nativeEnum(SectorType, {
      required_error: "Setor é obrigatório",
      invalid_type_error: "Setor inválido",
    }),

    lote: z
      .string()
      .max(50, "Lote não pode ter mais de 50 caracteres")
      .optional()
      .nullable(),

    casela_id: z.number().nullable().optional(),

    tipo: z.nativeEnum(ItemStockType, {
      required_error: "Tipo de estoque é obrigatório",
      invalid_type_error: "Tipo de estoque inválido",
    }),

    preco: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === "") return true;
          const num = parseFloat(val.replace(",", "."));
          return !isNaN(num) && num >= 0;
        },
        {
          message: "Preço deve ser um número válido maior ou igual a zero",
        },
      ),

    observacao: z
      .string()
      .max(255, "Observação não pode ter mais de 255 caracteres")
      .optional()
      .nullable(),

    dias_para_repor: z
      .number({
        invalid_type_error: "Dias para repor deve ser um número",
      })
      .int("Dias para repor deve ser um número inteiro")
      .min(0, "Dias para repor não pode ser negativo")
      .optional()
      .nullable(),
  })

  .refine(
    (data) => {
      if (data.gaveta_id !== null) {
        return data.armario_id === null;
      }
      return true;
    },
    {
      message: "Não é possível selecionar armário e gaveta ao mesmo tempo",
      path: ["gaveta_id"],
    },
  )

  .refine(
    (data) => {
      if (data.armario_id !== null) {
        return data.gaveta_id === null;
      }
      return true;
    },
    {
      message: "Não é possível selecionar armário e gaveta ao mesmo tempo",
      path: ["armario_id"],
    },
  )

  .refine(
    (data) => {
      if (data.casela_id !== null) {
        return data.armario_id !== null && data.gaveta_id === null;
      }
      return true;
    },
    {
      message:
        "Casela só pode ser selecionada quando um armário está selecionado",
      path: ["casela_id"],
    },
  );

export type EditStockFormData = z.infer<typeof editStockSchema>;