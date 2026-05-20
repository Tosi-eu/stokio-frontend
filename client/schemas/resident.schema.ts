import { formatEntityDisplayName } from "@/helpers/text-name.helper";
import { z } from "zod";
import { brPhonePayloadFromInput } from "@/helpers/br-phone-format.helper";

const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;

export const residentSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(60, "Nome deve ter no máximo 60 caracteres")
    .trim()
    .transform(formatEntityDisplayName),
  cpf: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val == null) return;
      const v = String(val).trim();
      if (!v) return;
      const digits = v.replace(/\D/g, "");
      if (digits.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF deve ter 11 dígitos",
        });
      }
    }),
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
  telefone_responsavel: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val == null) return;
      const v = String(val).trim();
      if (!v) return;
      const digits = brPhonePayloadFromInput(v);
      if (!digits) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telefone deve ter 10 ou 11 dígitos (DDD + número)",
        });
      }
    }),
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
