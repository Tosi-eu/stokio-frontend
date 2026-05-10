import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast.hook";
import { resetPassword } from "@/api/requests";
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { usePublicDefaultLogoUrl } from "@/hooks/use-public-default-logo.hook";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/password.schema";
import { getErrorMessage } from "@/helpers/validation.helper";

export default function ForgotPassword() {
  const router = useRouter();
  const { toast } = useToast();
  const publicLogoUrl = usePublicDefaultLogoUrl();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      login: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form watch()
  const watchedPassword = watch("newPassword");

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await resetPassword(data.login.trim(), data.newPassword);

      toast({
        title: "Sucesso!",
        description: "Senha redefinida. Faça login com a nova senha.",
        variant: "success",
        duration: 3000,
      });

      router.push("/user/login");
    } catch (err: unknown) {
      const rawMessage = (
        err instanceof Error ? err.message : String(err)
      ).toLowerCase();
      let errorTitle: string;
      let errorDescription: string;
      if (
        rawMessage.includes("login não encontrado") ||
        rawMessage.includes("não encontrado")
      ) {
        errorTitle = "Login não encontrado";
        errorDescription =
          "O login informado não existe no sistema. Verifique o login e tente novamente.";
      } else {
        errorTitle = "Não foi possível redefinir a senha";
        errorDescription = getErrorMessage(
          err,
          "Verifique os dados e tente novamente.",
          "ForgotPassword:submit",
        );
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-mesh">
      <header className="shrink-0 border-b border-border/70 bg-brand-hero/90 backdrop-blur-sm">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <img
            src={publicLogoUrl}
            alt={APP_PUBLIC_NAME}
            className="h-20 w-auto max-w-[200px] object-contain drop-shadow-sm"
          />
          <h1 className="font-display text-xl font-semibold text-foreground tracking-tight hidden sm:block">
            {APP_PUBLIC_NAME}
          </h1>
        </div>
      </header>

      <main className="flex-1 bg-transparent">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="max-w-md mx-auto">
            <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-2xl shadow-elevated p-8 md:p-9">
              <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-6">
                Redefinir Senha
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label
                    htmlFor="login"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Login
                  </label>
                  <input
                    id="login"
                    type="email"
                    {...register("login")}
                    maxLength={255}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      errors.login
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-input focus:ring-ring/30 focus:border-primary"
                    }`}
                    placeholder="Seu login"
                    disabled={isSubmitting}
                    aria-invalid={errors.login ? "true" : "false"}
                  />
                  {errors.login && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.login.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Nova senha
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    {...register("newPassword")}
                    maxLength={128}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      errors.newPassword
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-input focus:ring-ring/30 focus:border-primary"
                    }`}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    aria-invalid={errors.newPassword ? "true" : "false"}
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.newPassword.message}
                    </p>
                  )}
                  {watchedPassword &&
                    !errors.newPassword &&
                    watchedPassword.length >= 8 && (
                      <p className="text-xs text-primary mt-1">
                        ✓ Senha válida
                      </p>
                    )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    maxLength={128}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-input focus:ring-ring/30 focus:border-primary"
                    }`}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-brand-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processando..." : "Redefinir Senha"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/user/login")}
                  className="w-full h-11 border border-input bg-background hover:bg-muted/60 text-foreground rounded-xl text-sm font-semibold transition"
                >
                  Voltar
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/contact"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Contact
                  </Link>
                </p>
              </form>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {APP_PUBLIC_NAME}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
