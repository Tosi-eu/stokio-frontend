import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.hook";
import { resetPassword } from "@/api/requests";
import { APP_PUBLIC_LOGO_URL, APP_PUBLIC_NAME } from "@/constants/app-branding";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/password.schema";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

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

      navigate("/user/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "";
      const rawMessage = errorMessage.toLowerCase();
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
        errorTitle = "Erro";
        errorDescription =
          errorMessage ||
          "Erro ao redefinir senha. Verifique os dados e tente novamente.";
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
    <div className="min-h-screen bg-sky-100 flex flex-col">
      <header className="shrink-0 border-b border-sky-200 bg-sky-100">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <img
            src={APP_PUBLIC_LOGO_URL}
            alt={APP_PUBLIC_NAME}
            className="h-20 w-auto max-w-[200px] object-contain"
          />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">
            {APP_PUBLIC_NAME}
          </h1>
        </div>
      </header>

      <main className="flex-1 bg-slate-50">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 pt-28">
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-6">
                Redefinir Senha
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label
                    htmlFor="login"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                        : "border-slate-300 focus:ring-sky-200 focus:border-sky-400"
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
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                        : "border-slate-300 focus:ring-sky-200 focus:border-sky-400"
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
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Senha válida
                      </p>
                    )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-700 mb-2"
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
                        : "border-slate-300 focus:ring-sky-200 focus:border-sky-400"
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
                  className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Processando..." : "Redefinir Senha"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/user/login")}
                  className="w-full h-11 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition"
                >
                  Voltar
                </button>
              </form>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} {APP_PUBLIC_NAME}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
