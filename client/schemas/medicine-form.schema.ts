import { z } from "zod";
import { SECTOR_KEY_REGEX } from "@/helpers/tenant-sectors.helper";
import { OriginType, ItemStockType } from "@/utils/enums";

export const medicineFormSchema = z
  .object({
    id: z.number({ required_error: "Selecione um medicamento" }),
    quantity: z
      .number({
        required_error: "Quantidade é obrigatória",
        invalid_type_error: "Quantidade deve ser um número",
      })
      .int("Quantidade deve ser um número inteiro")
      .min(1, "Quantidade deve ser maior que zero")
      .max(999999, "Quantidade não pode ser maior que 999.999"),
    stockType: z.nativeEnum(ItemStockType, {
      required_error: "Tipo de estoque é obrigatório",
    }),
    expirationDate: z.date().nullable().optional(),
    casela: z.number().nullable().optional(),
    cabinetId: z.number().nullable().optional(),
    drawerId: z.number().nullable().optional(),
    origin: z.nativeEnum(OriginType).nullable().optional(),
    sector: z
      .string({ required_error: "Setor é obrigatório" })
      .regex(SECTOR_KEY_REGEX, "Setor inválido"),
    lot: z
      .string()
      .max(50, "Lote não pode ter mais de 50 caracteres")
      .optional()
      .nullable(),
    observacao: z
      .string()
      .max(500, "Observação não pode ter mais de 500 caracteres")
      .optional()
      .nullable(),
    preco: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === "") return true;
          const num = Number(val);
          return !isNaN(num) && num >= 0 && num <= 999999.99;
        },
        {
          message: "Preço deve ser um número entre 0 e 999999.99",
        },
      )
      .transform((val) => (val === "" ? undefined : val)),
  })
  .refine(
    (data) =>
      ![ItemStockType.CARRINHO, ItemStockType.CARRINHO_PSICOTROPICOS].includes(
        data.stockType,
      ) || data.drawerId !== null,
    {
      message: "Carrinho requer uma gaveta",
      path: ["drawerId"],
    },
  )
  .refine(
    (data) =>
      [ItemStockType.CARRINHO, ItemStockType.CARRINHO_PSICOTROPICOS].includes(
        data.stockType,
      ) || data.cabinetId !== null,
    {
      message: "Selecione um armário",
      path: ["cabinetId"],
    },
  )
  .refine(
    (data) => !(data.stockType === ItemStockType.GERAL && data.casela !== null),
    {
      message: "Estoque geral não pode ter casela",
      path: ["casela"],
    },
  )
  .refine((data) => !(data.cabinetId !== null && data.drawerId !== null), {
    message: "Não é possível selecionar armário e gaveta ao mesmo tempo",
    path: ["drawerId"],
  });

export type MedicineFormData = z.infer<typeof medicineFormSchema>;
