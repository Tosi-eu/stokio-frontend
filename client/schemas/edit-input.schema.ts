import { formatEntityDisplayName } from "@/helpers/text-name.helper";
import { z } from "zod";

export const editInputSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim()
    .transform(formatEntityDisplayName),
  descricao: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .trim()
    .optional()
    .transform((val) => (val ? formatEntityDisplayName(val) : "")),
  estoque_minimo: z
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
    .transform((val) => (val === "" ? "0" : val || "0")),
});

export type EditInputFormData = z.infer<typeof editInputSchema>;
