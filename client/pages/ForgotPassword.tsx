import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast.hook";
import { requestPasswordReset, confirmPasswordReset } from "@/api/requests";
import {
  APP_PUBLIC_NAME,
  getNextBrandLogoFallback,
} from "@/constants/app-branding";
import { AuthBrandLogoImage } from "@/components/auth/AuthBrandLogoImage";
import { usePublicDefaultLogoUrl } from "@/hooks/use-public-default-logo.hook";
import {
  forgotPasswordRequestSchema,
  forgotPasswordConfirmSchema,
  type ForgotPasswordRequestFormData,
  type ForgotPasswordConfirmFormData,
} from "@/schemas/password.schema";
import { getErrorMessage } from "@/helpers/validation.helper";

export default function ForgotPassword() {
  const router = useRouter();
  const { toast } = useToast();
  const publicBrandLogoUrl = usePublicDefaultLogoUrl();
  const [authHeaderImgSrc, setAuthHeaderImgSrc] = useState(publicBrandLogoUrl);
  useEffect(() => {
    setAuthHeaderImgSrc(publicBrandLogoUrl);
  }, [publicBrandLogoUrl]);
  const handleAuthLogoFallback = useCallback(() => {
    setAuthHeaderImgSrc((current) => {
      const next = getNextBrandLogoFallback(current);
      return next ?? current;
    });
  }, []);
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [savedLogin, setSavedLogin] = useState("");

  const requestForm = useForm<ForgotPasswordRequestFormData>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: { login: "" },
  });

  const confirmForm = useForm<ForgotPasswordConfirmFormData>({
    resolver: zodResolver(forgotPasswordConfirmSchema),
    defaultValues: {
      login: "",
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchedPassword = useWatch({
    control: confirmForm.control,
    name: "newPassword",
    defaultValue: "",
  });

  const onRequestSubmit = async (data: ForgotPasswordRequestFormData) => {
    try {
      await requestPasswordReset(data.login.trim());
      setSavedLogin(data.login.trim());
      confirmForm.reset({
        login: data.login.trim(),
        token: "",
        newPassword: "",
        confirmPassword: "",
      });
      setStep("confirm");
      toast({
        title: "Verifique o seu e-mail",
        description:
          "Se existir uma conta com este e-mail, enviámos um código para redefinir a senha.",
        variant: "success",
        duration: 6000,
      });
    } catch (err: unknown) {
      const raw = (
        err instanceof Error ? err.message : String(err)
      ).toLowerCase();
      const isSmtp =
        raw.includes("smtp") ||
        raw.includes("503") ||
        raw.includes("outgoing email") ||
        raw.includes("not configured");
      toast({
        title: isSmtp
          ? "Envio de e-mail indisponível"
          : "Não foi possível enviar o código",
        description: getErrorMessage(
          err,
          "Tente novamente dentro de instantes.",
          "ForgotPassword:request",
        ),
        variant: "error",
        duration: 4000,
      });
    }
  };

  const onConfirmSubmit = async (data: ForgotPasswordConfirmFormData) => {
    try {
      await confirmPasswordReset(
        data.login.trim(),
        data.token.trim(),
        data.newPassword,
      );

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
        rawMessage.includes("código inválido") ||
        rawMessage.includes("inválido") ||
        rawMessage.includes("expirado")
      ) {
        errorTitle = "Código inválido ou expirado";
        errorDescription =
          "Verifique o código no e-mail ou peça um novo código no passo anterior.";
      } else {
        errorTitle = "Não foi possível redefinir a senha";
        errorDescription = getErrorMessage(
          err,
          "Verifique os dados e tente novamente.",
          "ForgotPassword:confirm",
        );
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "error",
        duration: 4000,
      });
    }
  };

  const isRequesting = requestForm.formState.isSubmitting;
  const isConfirming = confirmForm.formState.isSubmitting;

  return (
    <div className="min-h-screen flex flex-col bg-brand-mesh">
      <header className="shrink-0 border-b border-border/70 bg-brand-hero/90 backdrop-blur-sm">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <AuthBrandLogoImage
            src={authHeaderImgSrc}
            alt={APP_PUBLIC_NAME}
            width={200}
            height={80}
            priority
            onFallback={handleAuthLogoFallback}
            className="h-20 w-auto max-w-[200px] object-contain object-left drop-shadow-sm"
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
              <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-2">
                Redefinir senha
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {step === "request"
                  ? "Indique o e-mail da sua conta para receber um código."
                  : `Código enviado para ${savedLogin}. Cole o código e escolha uma nova senha.`}
              </p>

              {step === "request" ? (
                <form
                  onSubmit={requestForm.handleSubmit(onRequestSubmit)}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="login"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      E-mail (login)
                    </label>
                    <input
                      id="login"
                      type="email"
                      {...requestForm.register("login")}
                      maxLength={255}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                        requestForm.formState.errors.login
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-input focus:ring-ring/30 focus:border-primary"
                      }`}
                      placeholder="seu@email.com"
                      disabled={isRequesting}
                      aria-invalid={
                        requestForm.formState.errors.login ? "true" : "false"
                      }
                    />
                    {requestForm.formState.errors.login && (
                      <p className="text-xs text-red-600 mt-1">
                        {requestForm.formState.errors.login.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isRequesting}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-brand-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRequesting ? "A enviar…" : "Enviar código"}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={confirmForm.handleSubmit(onConfirmSubmit)}
                  className="space-y-5"
                >
                  <input type="hidden" {...confirmForm.register("login")} />

                  <div>
                    <label
                      htmlFor="token"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Código do e-mail
                    </label>
                    <input
                      id="token"
                      type="text"
                      autoComplete="one-time-code"
                      {...confirmForm.register("token")}
                      maxLength={128}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm font-mono tracking-wide focus:outline-none focus:ring-2 ${
                        confirmForm.formState.errors.token
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-input focus:ring-ring/30 focus:border-primary"
                      }`}
                      placeholder="Cole o código aqui"
                      disabled={isConfirming}
                      aria-invalid={
                        confirmForm.formState.errors.token ? "true" : "false"
                      }
                    />
                    {confirmForm.formState.errors.token && (
                      <p className="text-xs text-red-600 mt-1">
                        {confirmForm.formState.errors.token.message}
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
                      {...confirmForm.register("newPassword")}
                      maxLength={128}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                        confirmForm.formState.errors.newPassword
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-input focus:ring-ring/30 focus:border-primary"
                      }`}
                      placeholder="••••••••"
                      disabled={isConfirming}
                      aria-invalid={
                        confirmForm.formState.errors.newPassword
                          ? "true"
                          : "false"
                      }
                    />
                    {confirmForm.formState.errors.newPassword && (
                      <p className="text-xs text-red-600 mt-1">
                        {confirmForm.formState.errors.newPassword.message}
                      </p>
                    )}
                    {watchedPassword &&
                      !confirmForm.formState.errors.newPassword &&
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
                      {...confirmForm.register("confirmPassword")}
                      maxLength={128}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                        confirmForm.formState.errors.confirmPassword
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-input focus:ring-ring/30 focus:border-primary"
                      }`}
                      placeholder="••••••••"
                      disabled={isConfirming}
                      aria-invalid={
                        confirmForm.formState.errors.confirmPassword
                          ? "true"
                          : "false"
                      }
                    />
                    {confirmForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">
                        {confirmForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isConfirming}
                    className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-brand-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfirming ? "A guardar…" : "Redefinir senha"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      requestForm.reset({ login: savedLogin });
                    }}
                    className="w-full h-11 border border-input bg-background hover:bg-muted/60 text-foreground rounded-xl text-sm font-semibold transition"
                  >
                    Pedir novo código
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => router.push("/user/login")}
                className="w-full h-11 mt-4 border border-input bg-background hover:bg-muted/60 text-foreground rounded-xl text-sm font-semibold transition"
              >
                Voltar ao login
              </button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                <Link
                  href="/contact"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Contacto
                </Link>
              </p>
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
