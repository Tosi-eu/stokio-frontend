import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import {
  fetchLoginTenantsForEmail,
  joinByInviteToken,
  registerUser,
  type LoginTenantSummary,
} from "@/api/requests";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateTextInput,
} from "@/helpers/validation.helper";
import { prefetchTenantBrandLogoBeforeInicioNavigation } from "@/helpers/tenant-brand-logo-prefetch.helper";
import { Package, ShieldCheck, Sparkles } from "lucide-react";

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginLinkedTenants, setLoginLinkedTenants] = useState<
    LoginTenantSummary[] | null
  >(null);
  const [loginLinkedTenantsLoading, setLoginLinkedTenantsLoading] =
    useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);
  const [passwordValidation, setPasswordValidation] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  const [signupFlow, setSignupFlow] = useState<"user" | "join-token">("user");
  const [userContractCode, setUserContractCode] = useState("");
  const [viewModeConfirmOpen, setViewModeConfirmOpen] = useState(false);
  const [pendingUserSignup, setPendingUserSignup] = useState<{
    login: string;
    password: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  const authHeaderLogoSrc = "/default_logo.png";

  useEffect(() => {
    const invite = (searchParams.get("invite") ?? "").trim();
    const email = (searchParams.get("email") ?? "").trim();
    if (invite) {
      setIsLogin(false);
      setSignupFlow("join-token");
      setInviteToken(invite);
      if (email) setLogin(email);
    }
  }, [searchParams]);

  useEffect(() => {
    setPasswordStrength(null);
    setPasswordValidation(null);
    setRememberMe(false);
    setLoading(false);
    setLoginLinkedTenants(null);
    setLoginLinkedTenantsLoading(false);
    if (isLogin) {
      setFirstName("");
      setLastName("");
      setInviteToken("");
      setUserContractCode("");
    } else {
      setSignupFlow("user");
    }
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin) {
      setLoginLinkedTenants(null);
      setLoginLinkedTenantsLoading(false);
      return;
    }

    const sanitized = sanitizeInput(login).trim();
    const emailValidation = validateEmail(sanitized);
    if (!emailValidation.valid) {
      setLoginLinkedTenants(null);
      setLoginLinkedTenantsLoading(false);
      setTenantSlug("");
      return;
    }

    let cancelled = false;
    setLoginLinkedTenants(null);
    setLoginLinkedTenantsLoading(true);
    const debounceId = window.setTimeout(async () => {
      try {
        const tenants = await fetchLoginTenantsForEmail(sanitized);
        if (cancelled) return;
        setLoginLinkedTenants(tenants);
        if (tenants.length === 1) {
          setTenantSlug(tenants[0]!.slug);
        } else if (tenants.length > 1) {
          setTenantSlug((prev) =>
            tenants.some((x) => x.slug === prev) ? prev : "",
          );
        } else {
          setTenantSlug("");
        }
      } catch {
        if (!cancelled) {
          setLoginLinkedTenants([]);
          setTenantSlug("");
        }
      } finally {
        if (!cancelled) setLoginLinkedTenantsLoading(false);
      }
    }, 420);

    return () => {
      cancelled = true;
      window.clearTimeout(debounceId);
    };
  }, [isLogin, login]);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handlePasswordChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    setPassword(sanitized);
    if (!isLogin && sanitized.length > 0) {
      const validation = validatePassword(sanitized);
      setPasswordStrength(validation.strength || null);
      setPasswordValidation({
        valid: validation.valid,
        error: validation.error,
      });
    } else {
      setPasswordStrength(null);
      setPasswordValidation(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let skipLoadingResetAfterSuccess = false;

    try {
      const emailValidation = validateEmail(login);
      if (!emailValidation.valid) {
        toast({
          title: "E-mail inválido",
          description:
            emailValidation.error || "Por favor, insira um e-mail válido.",
          variant: "error",
          duration: 3000,
        });
        setLoading(false);
        return;
      }

      const sanitizedLogin = sanitizeInput(login);
      const sanitizedPassword = sanitizeInput(password);

      if (!isLogin) {
        const passwordValidationResult = validatePassword(password);
        if (!passwordValidationResult.valid) {
          toast({
            title: "Senha inválida",
            description:
              passwordValidationResult.error ||
              "A senha não atende aos requisitos.",
            variant: "error",
            duration: 3000,
          });
          setLoading(false);
          return;
        }

        const firstNameValidation = validateTextInput(firstName, {
          required: true,
          minLength: 2,
          maxLength: 100,
          fieldName: "Nome",
        });

        if (!firstNameValidation.valid) {
          toast({
            title: "Nome inválido",
            description: firstNameValidation.error,
            variant: "error",
            duration: 3000,
          });
          setLoading(false);
          return;
        }

        const lastNameValidation = validateTextInput(lastName, {
          required: true,
          minLength: 2,
          maxLength: 100,
          fieldName: "Sobrenome",
        });

        if (!lastNameValidation.valid) {
          toast({
            title: "Sobrenome inválido",
            description: lastNameValidation.error,
            variant: "error",
            duration: 3000,
          });
          setLoading(false);
          return;
        }

        const performUserSignup = async (params: {
          login: string;
          password: string;
          firstName: string;
          lastName: string;
          notifyViewMode?: boolean;
        }) => {
          const created = await registerUser(
            params.login,
            params.password,
            params.firstName,
            params.lastName,
            userContractCode.trim()
              ? { contract_code: userContractCode.trim() }
              : undefined,
          );
          await authLogin(params.login, params.password, created.tenant.slug);
          void prefetchTenantBrandLogoBeforeInicioNavigation();
          toast({
            title: "Conta criada",
            description: params.notifyViewMode
              ? "Entrando em modo de visualização. Você pode configurar o abrigo depois."
              : "Você já pode navegar.",
            variant: "success",
            duration: 4500,
          });
          skipLoadingResetAfterSuccess = true;
          router.push("/loading");
        };

        if (signupFlow === "user") {
          const cc = userContractCode.trim();
          if (!cc) {
            setPendingUserSignup({
              login: sanitizedLogin,
              password: sanitizedPassword,
              firstName,
              lastName,
            });
            setViewModeConfirmOpen(true);
            setLoading(false);
            return;
          }
          await performUserSignup({
            login: sanitizedLogin,
            password: sanitizedPassword,
            firstName,
            lastName,
            notifyViewMode: false,
          });
          return;
        }

        const token = inviteToken.trim();
        if (!token) {
          toast({
            title: "Token obrigatório",
            description:
              "Cole o token de entrada que o administrador do abrigo lhe enviou.",
            variant: "error",
            duration: 4000,
          });
          setLoading(false);
          return;
        }

        const joined = await joinByInviteToken({
          token,
          login: sanitizedLogin,
          password: sanitizedPassword,
          first_name: firstName,
          last_name: lastName,
        });
        await authLogin(sanitizedLogin, sanitizedPassword, joined.tenant.slug);
        void prefetchTenantBrandLogoBeforeInicioNavigation();
        toast({
          title: "Bem-vindo ao abrigo!",
          variant: "success",
          duration: 3000,
        });
        skipLoadingResetAfterSuccess = true;
        router.push("/loading");
        return;
      }

      if (loginLinkedTenantsLoading) {
        toast({
          title: "Aguarde um momento",
          description:
            "Estamos a carregar os abrigos associados a este e-mail.",
          variant: "error",
          duration: 3500,
        });
        setLoading(false);
        return;
      }

      let tenants = loginLinkedTenants;
      if (tenants === null) {
        tenants = await fetchLoginTenantsForEmail(sanitizedLogin);
        setLoginLinkedTenants(tenants);
      }

      if (!tenants.length) {
        toast({
          title: "E-mail não encontrado",
          description:
            "Não encontramos este e-mail. Verifique o endereço ou cadastre-se (utilizador, novo abrigo ou token de entrada).",
          variant: "error",
          duration: 4000,
        });
        setLoading(false);
        return;
      }

      let slug: string;
      if (tenants.length === 1) {
        slug = tenants[0]!.slug;
      } else {
        slug = tenantSlug.trim();
        if (!slug || !tenants.some((t) => t.slug === slug)) {
          toast({
            title: "Selecione o abrigo",
            description:
              "Este e-mail existe em mais de um abrigo — escolha qual deseja acessar.",
            variant: "error",
            duration: 4000,
          });
          setLoading(false);
          return;
        }
      }

      await authLogin(sanitizedLogin, sanitizedPassword, slug);
      void prefetchTenantBrandLogoBeforeInicioNavigation();
      toast({
        title: "Login realizado!",
        variant: "success",
        duration: 3000,
      });
      skipLoadingResetAfterSuccess = true;
      router.push("/loading");
    } catch (err: unknown) {
      const rawMessage = (
        err instanceof Error ? err.message : String(err)
      ).toLowerCase();

      let errorTitle: string;
      let errorDescription: string;
      if (isLogin) {
        if (rawMessage.includes("abrigo não encontrado")) {
          errorTitle = "Abrigo não encontrado";
          errorDescription =
            "Escolha um abrigo válido na lista ou contate o suporte.";
        } else if (rawMessage.includes("credenciais")) {
          errorTitle = "Login ou senha incorretos";
          errorDescription =
            "Verifique seu e-mail e senha. Se esqueceu sua senha, use a opção 'Esqueci minha senha'.";
        } else if (
          rawMessage.includes("login e senha obrigatórios") ||
          rawMessage.includes("e-mail e senha obrigatórios") ||
          rawMessage.includes("obrigatóri")
        ) {
          errorTitle = "Campos obrigatórios";
          errorDescription = "Por favor, preencha o e-mail e a senha.";
        } else if (
          rawMessage.includes("sessão expirada") ||
          rawMessage.includes("token expirado") ||
          rawMessage.includes("sessão inválida")
        ) {
          errorTitle = "Sessão expirada";
          errorDescription =
            "Sua sessão expirou. Por favor, faça login novamente.";
        } else if (
          rawMessage.includes("too many") ||
          rawMessage.includes("muitas tentativas") ||
          rawMessage.includes("rate limit")
        ) {
          errorTitle = "Muitas tentativas";
          errorDescription =
            "Aguarde alguns minutos e tente novamente. Se o problema continuar, atualize a página.";
        } else {
          errorTitle = "Erro ao fazer login";
          errorDescription =
            (err instanceof Error ? err.message : null) ||
            "Não foi possível fazer login. Verifique suas credenciais e tente novamente.";
        }
      } else {
        if (
          rawMessage.includes("token") &&
          (rawMessage.includes("inválido") ||
            rawMessage.includes("invalid") ||
            rawMessage.includes("expirado"))
        ) {
          errorTitle = "Token de entrada";
          errorDescription =
            err instanceof Error
              ? err.message
              : "Token inválido ou expirado. Peça um novo convite ao administrador.";
        } else if (rawMessage.includes("abrigo não encontrado")) {
          errorTitle = "Abrigo não encontrado";
          errorDescription =
            "Escolha um abrigo válido na lista ou contate o suporte.";
        } else if (
          rawMessage.includes("login já cadastrado") ||
          rawMessage.includes("duplicate") ||
          rawMessage.includes("já existe") ||
          rawMessage.includes("já está em uso")
        ) {
          errorTitle = "E-mail já cadastrado";
          errorDescription =
            "Este e-mail já está em uso. Tente fazer login ou use outro e-mail.";
        } else if (
          rawMessage.includes("login e senha obrigatórios") ||
          rawMessage.includes("e-mail e senha obrigatórios") ||
          rawMessage.includes("obrigatóri")
        ) {
          errorTitle = "Campos obrigatórios";
          errorDescription = "Por favor, preencha o e-mail e a senha.";
        } else if (
          rawMessage.includes("senha inválida") ||
          rawMessage.includes("senha não atende")
        ) {
          errorTitle = "Senha inválida";
          errorDescription =
            "A senha não atende aos requisitos de segurança. Verifique as regras de senha.";
        } else {
          errorTitle = "Erro ao cadastrar";
          errorDescription =
            (err instanceof Error ? err.message : null) ||
            "Não foi possível criar a conta. Verifique os dados e tente novamente.";
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "error",
        duration: 3000,
      });
    } finally {
      if (!skipLoadingResetAfterSuccess) {
        setLoading(false);
      }
    }
  };

  const loginEmailTrim = sanitizeInput(login).trim();
  const loginEmailValid = validateEmail(loginEmailTrim).valid;

  const [authHeaderImgSrc, setAuthHeaderImgSrc] = useState(authHeaderLogoSrc);
  useEffect(() => {
    setAuthHeaderImgSrc(authHeaderLogoSrc);
  }, [authHeaderLogoSrc]);

  const inputFieldClass =
    "h-11 rounded-xl border-border/70 bg-background/95 shadow-sm transition-shadow focus-visible:ring-primary/30";

  return (
    <div
      className="min-h-screen flex flex-col bg-brand-mesh lg:flex-row"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.6s ease-in",
      }}
    >
      <AlertDialog
        open={viewModeConfirmOpen}
        onOpenChange={(open) => {
          setViewModeConfirmOpen(open);
          if (!open) setPendingUserSignup(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Entrar em modo de visualização?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              Você não informou o código do contrato. Vamos criar a conta e
              entrar em modo de visualização. Depois, você pode configurar o
              abrigo no banner do topo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const p = pendingUserSignup;
                if (!p) return;
                setViewModeConfirmOpen(false);
                setPendingUserSignup(null);
                setLoading(true);
                try {
                  const created = await registerUser(
                    p.login,
                    p.password,
                    p.firstName,
                    p.lastName,
                  );
                  await authLogin(p.login, p.password, created.tenant.slug);
                  void prefetchTenantBrandLogoBeforeInicioNavigation();
                  toast({
                    title: "Conta criada",
                    description:
                      "Entrando em modo de visualização. Configure o abrigo quando quiser.",
                    variant: "success",
                    duration: 4500,
                  });
                  router.push("/loading");
                } catch (err) {
                  toast({
                    title: "Não foi possível criar a conta",
                    description:
                      err instanceof Error
                        ? err.message
                        : "Tente novamente em instantes.",
                    variant: "error",
                    duration: 3500,
                  });
                } finally {
                  setLoading(false);
                }
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Painel de marca — desktop */}
      <aside className="relative hidden shrink-0 overflow-hidden lg:flex lg:min-h-screen lg:w-[min(42%,480px)] lg:flex-col lg:justify-between bg-brand-strip px-10 py-12 text-primary-foreground xl:px-14">
        <div
          className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 space-y-8">
          <div className="flex w-full justify-center px-2">
            <div className="inline-flex max-w-full items-center justify-center rounded-2xl bg-white/12 p-4 ring-1 ring-white/25 backdrop-blur-sm xl:p-5">
              <img
                key={`aside-${authHeaderImgSrc}`}
                src={authHeaderImgSrc}
                alt=""
                className="mx-auto block h-44 w-auto max-w-[min(100%,460px)] object-contain object-center xl:h-52 xl:max-w-[min(100%,500px)] 2xl:h-56"
                referrerPolicy="no-referrer"
                onError={() => {
                  setAuthHeaderImgSrc((current) =>
                    current === "/default_logo.png" ? current : "/default_logo.png",
                  );
                }}
              />
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-display text-2xl font-semibold leading-tight tracking-tight xl:text-3xl">
              Medicamentos e estoque organizados — do jeito que o abrigo
              precisa.
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/85">
              Cadastre itens, registre entradas e saídas e acompanhe tudo em um
              só lugar. Menos planilhas, menos falhas: mais tempo para quem
              importa.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-primary-foreground/90">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Package className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="font-medium text-white">
                  Vários abrigos, uma conta
                </span>
                <span className="mt-0.5 block text-xs text-primary-foreground/75">
                  Trabalha em mais de um lugar? Alterna entre eles sem misturar
                  dados nem estoque.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="font-medium text-white">
                  Só quem deve ver, vê
                </span>
                <span className="mt-0.5 block text-xs text-primary-foreground/75">
                  Convites e permissões por função: sua equipe acessa só o que
                  precisa para trabalhar.
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="font-medium text-white">
                  Números prontos para mostrar
                </span>
                <span className="mt-0.5 block text-xs text-primary-foreground/75">
                  Indicadores e relatórios para reuniões, diretoria ou
                  parceiros — sem montar tudo na mão.
                </span>
              </span>
            </li>
          </ul>
        </div>
        <p className="relative z-10 mx-auto w-full max-w-sm shrink-0 px-2 text-center text-xs leading-snug text-primary-foreground/65">
          © {new Date().getFullYear()} {APP_PUBLIC_NAME}
        </p>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-md lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-5 sm:px-6 lg:max-w-none lg:justify-end lg:px-10 lg:py-8">
            <img
              key={authHeaderImgSrc}
              src={authHeaderImgSrc}
              alt={APP_PUBLIC_NAME}
              className="h-10 w-auto max-w-[200px] object-contain object-left drop-shadow-sm lg:hidden"
              referrerPolicy="no-referrer"
              onError={() => {
                setAuthHeaderImgSrc((current) =>
                  current === "/default_logo.png" ? current : "/default_logo.png",
                );
              }}
            />
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="font-display truncate text-base font-semibold text-foreground">
                {APP_PUBLIC_NAME}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                Medicamentos e estoque organizados para o seu abrigo.
              </p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-2 sm:px-6 lg:items-center lg:px-10 lg:pb-20 lg:pt-0">
          <div className="w-full max-w-md">
            <Card className="border-border/70 bg-card/95 shadow-elevated backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="font-display text-2xl">
                  {isLogin ? "Entrar" : "Nova conta"}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Entre com o e-mail e a senha da sua organização."
                    : "Crie sua conta em poucos passos ou use o convite que você recebeu."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                <div
                  className="grid grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1 ring-1 ring-border/60"
                  role="tablist"
                  aria-label="Modo de acesso"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isLogin}
                    onClick={() => setIsLogin(true)}
                    className={cn(
                      "rounded-lg py-2.5 text-sm font-semibold transition-all",
                      isLogin
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isLogin}
                    onClick={() => setIsLogin(false)}
                    className={cn(
                      "rounded-lg py-2.5 text-sm font-semibold transition-all",
                      !isLogin
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Cadastrar
                  </button>
                </div>

                <Separator className="bg-border/70" />

                <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <span className="block text-sm font-medium leading-none text-foreground">
                      Tipo
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSignupFlow("user");
                          setInviteToken("");
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                          signupFlow === "user"
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                            : "border-border bg-background hover:bg-muted/50 text-muted-foreground",
                        )}
                      >
                        <span className="font-medium text-foreground">
                          Utilizador
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Criar conta para navegar.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignupFlow("join-token");
                          setUserContractCode("");
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                          signupFlow === "join-token"
                            ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                            : "border-border bg-background hover:bg-muted/50 text-muted-foreground",
                        )}
                      >
                        <span className="font-medium text-foreground">
                          Convite
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Token recebido por e-mail.
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {!isLogin && signupFlow === "join-token" && (
                  <div className="space-y-2">
                    <Label htmlFor="invite-token">Token de entrada</Label>
                    <Input
                      id="invite-token"
                      type="text"
                      autoComplete="off"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      required
                      className={cn(inputFieldClass, "font-mono text-xs")}
                      placeholder="Cole o token enviado pelo administrador"
                    />
                    <p className="text-xs text-muted-foreground">
                      Não precisa de código de contrato — só do token único.
                    </p>
                  </div>
                )}

                {isLogin && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Depois de um e-mail válido, mostramos em que abrigos ele
                    está registado. Se houver mais do que um, escolha onde quer
                    entrar.
                  </p>
                )}
                {!isLogin && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">Nome</Label>
                      <Input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(sanitizeInput(e.target.value))
                        }
                        maxLength={100}
                        className={inputFieldClass}
                        placeholder="Fulano"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last-name">Sobrenome</Label>
                      <Input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          setLastName(sanitizeInput(e.target.value))
                        }
                        maxLength={100}
                        className={inputFieldClass}
                        placeholder="Silva"
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email">E-mail</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={login}
                    onChange={(e) => setLogin(sanitizeInput(e.target.value))}
                    maxLength={255}
                    className={inputFieldClass}
                    placeholder="fulana@gmail.com"
                    autoComplete="email"
                    required
                  />
                </div>

                {!isLogin && signupFlow === "user" ? (
                  <div className="space-y-2">
                    <Label htmlFor="contract-code">
                      Código do contrato{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="contract-code"
                      type="text"
                      autoComplete="off"
                      value={userContractCode}
                      onChange={(e) =>
                        setUserContractCode(sanitizeInput(e.target.value))
                      }
                      maxLength={256}
                      className={inputFieldClass}
                      placeholder="Se já tiver, associa o abrigo ao contrato"
                    />
                    <p className="text-xs text-muted-foreground">
                      Em branco: modo visualização até completar o onboarding.
                    </p>
                  </div>
                ) : null}

                {isLogin && loginEmailValid ? (
                  <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-3 dark:bg-primary/10">
                    {loginLinkedTenantsLoading ? (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary/40 border-t-primary animate-spin"
                          aria-hidden
                        />
                        A procurar abrigos para este e-mail…
                      </p>
                    ) : loginLinkedTenants ===
                      null ? null : loginLinkedTenants.length === 0 ? (
                      <p className="text-xs text-amber-800 dark:text-amber-200/90">
                        Nenhum abrigo encontrado para este e-mail. Em Cadastro,
                        pode criar utilizador (visualização), abrir um novo
                        abrigo ou usar um token de entrada.
                      </p>
                    ) : loginLinkedTenants.length === 1 ? (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Abrigo:
                        </span>{" "}
                        {loginLinkedTenants[0]!.label}{" "}
                        <span className="text-muted-foreground/80">
                          ({loginLinkedTenants[0]!.slug})
                        </span>
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="tenant-slug"
                          className="text-xs font-medium"
                        >
                          Onde quer entrar?
                        </Label>
                        <select
                          id="tenant-slug"
                          value={tenantSlug}
                          onChange={(e) => setTenantSlug(e.target.value)}
                          required
                          className={cn(
                            inputFieldClass,
                            "bg-background",
                          )}
                        >
                          <option value="">Selecione o abrigo</option>
                          {loginLinkedTenants.map((t) => (
                            <option key={t.slug} value={t.slug}>
                              {t.label} ({t.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="auth-password">Senha</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    maxLength={128}
                    className={cn(
                      inputFieldClass,
                      !isLogin &&
                        passwordValidation &&
                        !passwordValidation.valid
                        ? "border-destructive/80 focus-visible:ring-destructive/30"
                        : "",
                    )}
                    placeholder="••••••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                  />
                  {!isLogin && passwordValidation && (
                    <div className="mt-1 text-xs">
                      {passwordValidation.valid ? (
                        <span
                          className={
                            passwordStrength === "strong"
                              ? "text-primary"
                              : passwordStrength === "medium"
                                ? "text-yellow-600"
                                : "text-orange-600"
                          }
                        >
                          ✓ Senha válida - Força:{" "}
                          {passwordStrength === "strong"
                            ? "Forte"
                            : passwordStrength === "medium"
                              ? "Média"
                              : "Aceitável"}
                        </span>
                      ) : (
                        <span className="text-red-600">
                          ✗ {passwordValidation.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isLogin && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(v) => setRememberMe(v === true)}
                      />
                      <Label
                        htmlFor="remember-me"
                        className="cursor-pointer text-sm font-normal text-foreground"
                      >
                        Lembrar de mim
                      </Label>
                    </div>

                    <Link
                      href="/user/forgot-password"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    loading ||
                    (!isLogin &&
                      passwordValidation !== null &&
                      !passwordValidation.valid)
                  }
                  className={cn(
                    "h-12 w-full rounded-xl text-base font-semibold shadow-brand-glow",
                    loading && "cursor-wait opacity-100",
                  )}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="h-6 w-6 shrink-0 rounded-full border-2 border-primary-foreground/35 border-t-primary-foreground animate-spin"
                        aria-hidden
                      />
                      <span className="sr-only">
                        {isLogin ? "A entrar" : "A cadastrar"}
                      </span>
                    </>
                  ) : isLogin ? (
                    "Entrar"
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
                {!isLogin &&
                  passwordValidation !== null &&
                  !passwordValidation.valid && (
                    <p className="text-center text-xs text-destructive">
                      Corrija a senha antes de continuar
                    </p>
                  )}
              </form>
              </CardContent>
            </Card>

            <p className="mt-8 text-center text-xs text-muted-foreground/80 lg:hidden">
              © {new Date().getFullYear()} {APP_PUBLIC_NAME}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
