import { z } from "zod";

export const forgotPasswordRequestSchema = z.object({
  login: z
    .string()
    .min(1, "Login é obrigatório")
    .email("Login deve ser um e-mail válido"),
});

export type ForgotPasswordRequestFormData = z.infer<
  typeof forgotPasswordRequestSchema
>;

export const forgotPasswordConfirmSchema = z
  .object({
    login: z
      .string()
      .min(1, "Login é obrigatório")
      .email("Login deve ser um e-mail válido"),
    token: z
      .string()
      .min(1, "Código é obrigatório")
      .max(128, "Código inválido"),
    newPassword: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .max(128, "Senha deve ter no máximo 128 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        "Senha deve conter: letra maiúscula, letra minúscula, número e caractere especial",
      ),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type ForgotPasswordConfirmFormData = z.infer<
  typeof forgotPasswordConfirmSchema
>;
