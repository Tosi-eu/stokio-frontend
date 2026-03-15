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
      .min(1, "Sobrenome é obrigatório")
      .max(45, "Sobrenome deve ter no máximo 45 caracteres"),

    currentLogin: z.string().optional(),

    currentPassword: z.string().optional(),

    login: z
      .string()
      .email("Login deve ser um e-mail válido")
      .max(255, "Login deve ter no máximo 255 caracteres")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .optional()
      .transform((val) => (val === "" ? undefined : val))
      .pipe(strongPasswordSchema.optional()),
  })
  .superRefine((data, ctx) => {
    const wantsToChangeLogin = !!data.login && data.login.trim() !== "";
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

      if (!data.currentPassword) {
        ctx.addIssue({
          path: ["currentPassword"],
          message: "Informe a senha atual para alterar o e-mail",
          code: z.ZodIssueCode.custom,
        });
      }

      if (data.currentLogin === data.login) {
        ctx.addIssue({
          path: ["login"],
          message: "O novo e-mail deve ser diferente do atual",
          code: z.ZodIssueCode.custom,
        });
      }
    }

    if (wantsToChangePassword && !data.currentPassword) {
      ctx.addIssue({
        path: ["currentPassword"],
        message: "Informe a senha atual para alterar a senha",
        code: z.ZodIssueCode.custom,
      });
    }
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
