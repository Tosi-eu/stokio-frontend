import { z } from "zod";

/**
 * @param {z.ZodError} err
 * @returns {string}
 */
function formatZodEnvError(err) {
  return err.errors
    .map((e) => {
      const key = e.path.length ? e.path.join(".") : "env";
      return `  - ${key}: ${e.message}`;
    })
    .join("\n");
}

/**
 * No `next build`, NODE_ENV é `production`. Exige URLs/chaves públicas usadas no bundle.
 * Em `next dev`, não bloqueia (fallbacks em código).
 */
export function assertFrontendEnvAtBuild() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const schema = z.object({
    NEXT_PUBLIC_API_BASE_URL: z
      .string({ required_error: "NEXT_PUBLIC_API_BASE_URL é obrigatório" })
      .min(1, "NEXT_PUBLIC_API_BASE_URL não pode ser vazio"),
    /** Opcional no build: usado só para rotas super-admin com header X-API-Key (pode ficar vazio). */
    NEXT_PUBLIC_X_API_KEY: z.string().optional(),
  });

  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(
      "[env] Build do frontend bloqueado — defina as variáveis abaixo (ex.: Docker build-args ou .env):\n" +
        formatZodEnvError(parsed.error),
    );
    process.exit(1);
  }
}
