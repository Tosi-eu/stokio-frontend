import { MeasurementUnit } from "@/pages/RegisterMedicine";
import { z } from "zod";

export const medicineSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim(),
  substance: z
    .string()
    .min(1, "Princípio ativo é obrigatório")
    .max(255, "Princípio ativo deve ter no máximo 255 caracteres")
    .trim(),
  dosageValue: z
    .string()
    .min(1, "Dosagem é obrigatória")
    .max(50, "Dosagem deve ter no máximo 50 caracteres")
    .trim(),
  measurementUnit: z
    .string()
    .min(1, "Unidade de medida é obrigatória")
    .refine(
      (val) => Object.values(MeasurementUnit).includes(val as MeasurementUnit),
      {
        message: "Unidade de medida inválida",
      },
    ),
  minimumStock: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0 && num <= 999999;
      },
      {
        message: "Estoque mínimo deve ser um número entre 0 e 999999",
      },
    )
    .transform((val) => (val === "" ? undefined : val)),
  price: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      {
        message: "Preço deve ser um número positivo",
      },
    )
    .transform((val) => (val === "" ? undefined : val)),
});

export type MedicineFormData = z.infer<typeof medicineSchema>;
