import { MeasurementUnit } from "@/constants/measurement-units";
import { formatEntityDisplayName } from "@/helpers/text-name.helper";
import { z } from "zod";

export const editMedicineSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim()
    .transform(formatEntityDisplayName),
  principio_ativo: z
    .string()
    .min(1, "Princípio ativo é obrigatório")
    .max(255, "Princípio ativo deve ter no máximo 255 caracteres")
    .trim()
    .transform(formatEntityDisplayName),
  dosagem: z
    .string()
    .min(1, "Dosagem é obrigatória")
    .max(100, "Dosagem deve ter no máximo 100 caracteres")
    .trim(),
  unidade_medida: z
    .string()
    .min(1, "Unidade de medida é obrigatória")
    .max(50, "Unidade de medida deve ter no máximo 50 caracteres")
    .trim()
    .refine(
      (val) => Object.values(MeasurementUnit).includes(val as MeasurementUnit),
      {
        message: "Unidade de medida inválida",
      },
    ),
  estoque_minimo: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      },
      {
        message: "Estoque mínimo deve ser um número maior ou igual a zero",
      },
    )
    .transform((val) => (val === "" ? undefined : val)),
});

export type EditMedicineFormData = z.infer<typeof editMedicineSchema>;
