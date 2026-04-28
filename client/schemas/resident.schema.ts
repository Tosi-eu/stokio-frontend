import { z } from "zod";

const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;

export const residentSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(60, "Nome deve ter no máximo 60 caracteres")
    .trim(),
  casela: z
    .string()
    .min(1, "Casela é obrigatória")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 1 && num <= 200;
      },
      {
        message: "Casela deve ser um número entre 1 e 200",
      },
    ),
  data_nascimento: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val == null || String(val).trim() === "") return;
      const v = String(val).trim();
      if (!isoDateOnly.test(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use a data no formato aaaa-mm-dd",
        });
        return;
      }
      const [y, mo, d] = v.split("-").map(Number);
      const birth = new Date(Date.UTC(y, mo - 1, d));
      const today = new Date();
      const t0 = Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
      );
      const b0 = Date.UTC(
        birth.getUTCFullYear(),
        birth.getUTCMonth(),
        birth.getUTCDate(),
      );
      if (b0 > t0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data de nascimento não pode ser no futuro",
        });
      }
    }),
});

export type ResidentFormData = z.infer<typeof residentSchema>;
