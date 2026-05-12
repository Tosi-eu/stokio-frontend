import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(128, "Senha deve ter no máximo 128 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
    "Senha deve conter: letra maiúscula, letra minúscula, número e caractere especial",
  );

export const profileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Nome é obrigatório")
      .max(45, "Nome deve ter no máximo 45 caracteres"),

    lastName: z
      .string()
      .min(1, "Apelido é obrigatório")
      .max(45, "Apelido deve ter no máximo 45 caracteres"),

    currentLogin: z.string().optional(),

    /** Obrigatória em qualquer guardar — o backend exige para PUT /login. */
    currentPassword: z
      .string()
      .min(1, "Informe a senha atual para guardar as alterações"),

    login: z.union([
      z.literal(""),
      z
        .string()
        .email("Novo e-mail deve ser válido")
        .max(255, "E-mail demasiado longo"),
    ]),

    password: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .pipe(strongPasswordSchema.optional()),

    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const wantsToChangeLogin =
      !!data.login &&
      data.login.trim() !== "" &&
      data.login.trim().toLowerCase() !==
        (data.currentLogin ?? "").trim().toLowerCase();
    const wantsToChangePassword =
      !!data.password && data.password.trim() !== "";

    if (wantsToChangeLogin) {
      if (!data.currentLogin) {
        ctx.addIssue({
          path: ["currentLogin"],
          message: "Informe o e-mail atual para alterar o e-mail",
          code: z.ZodIssueCode.custom,
        });
      }

      if (
        (data.currentLogin ?? "").trim().toLowerCase() ===
        data.login.trim().toLowerCase()
      ) {
        ctx.addIssue({
          path: ["login"],
          message: "O novo e-mail deve ser diferente do atual",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    if (wantsToChangePassword) {
      const c = (data.confirmPassword ?? "").trim();
      if (!c) {
        ctx.addIssue({
          path: ["confirmPassword"],
          message: "Confirme a nova senha",
          code: z.ZodIssueCode.custom,
        });
      } else if (c !== data.password) {
        ctx.addIssue({
          path: ["confirmPassword"],
          message: "As senhas não coincidem",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
