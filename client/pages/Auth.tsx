import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateTextInput,
} from "@/helpers/validation.helper";
import { prefetchTenantBrandLogoBeforeInicioNavigation } from "@/helpers/tenant-brand-logo-prefetch.helper";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
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
    const qs = new URLSearchParams(location.search);
    const invite = (qs.get("invite") ?? "").trim();
    const email = (qs.get("email") ?? "").trim();
    if (invite) {
      setIsLogin(false);
      setSignupFlow("join-token");
      setInviteToken(invite);
      if (email) setLogin(email);
    }
  }, [location.search]);

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
          navigate("/loading");
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
        navigate("/loading");
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
      navigate("/loading");
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

  return (
    <div
      className="min-h-screen flex flex-col bg-brand-mesh"
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
                  navigate("/loading");
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

      <header className="shrink-0 border-b border-border/70 bg-brand-hero/90 backdrop-blur-sm">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <img
            key={authHeaderImgSrc}
            src={authHeaderImgSrc}
            alt={APP_PUBLIC_NAME}
            className="h-28 w-auto max-w-[360px] object-contain object-left drop-shadow-sm"
            referrerPolicy="no-referrer"
            onError={() => {
              setAuthHeaderImgSrc((current) =>
                current === "/default_logo.png" ? current : "/default_logo.png",
              );
            }}
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
                {isLogin ? "Acesso ao Sistema" : "Criar conta"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-foreground">
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Token de entrada
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-shadow font-mono text-xs"
                      placeholder="Cole o token enviado pelo administrador"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Não precisa de código de contrato — só do token único.
                    </p>
                  </div>
                )}

                {isLogin && (
                  <p className="text-sm text-muted-foreground -mt-1">
                    Depois de um e-mail válido, mostramos em que abrigos ele
                    está registado. Se houver mais do que um, escolha onde quer
                    entrar.
                  </p>
                )}
                {!isLogin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nome
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(sanitizeInput(e.target.value))
                        }
                        maxLength={100}
                        className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-shadow"
                        placeholder="Fulano"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Sobrenome
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          setLastName(sanitizeInput(e.target.value))
                        }
                        maxLength={100}
                        className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-shadow"
                        placeholder="Silva"
                        required
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={login}
                    onChange={(e) => setLogin(sanitizeInput(e.target.value))}
                    maxLength={255}
                    className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-shadow"
                    placeholder="fulana@gmail.com"
                    required
                  />
                </div>

                {!isLogin && signupFlow === "user" ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Código do contrato{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={userContractCode}
                      onChange={(e) =>
                        setUserContractCode(sanitizeInput(e.target.value))
                      }
                      maxLength={256}
                      className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-shadow"
                      placeholder="Se já tiver, associa o abrigo ao contrato"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Em branco: modo visualização até completar o onboarding.
                    </p>
                  </div>
                ) : null}

                {isLogin && loginEmailValid ? (
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
                    {loginLinkedTenantsLoading ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
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
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Onde quer entrar?
                        </label>
                        <select
                          value={tenantSlug}
                          onChange={(e) => setTenantSlug(e.target.value)}
                          required
                          className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary bg-background transition-shadow"
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    maxLength={128}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      !isLogin &&
                      passwordValidation &&
                      !passwordValidation.valid
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : "border-input focus:ring-ring/30 focus:border-primary"
                    }`}
                    placeholder="••••••••••••"
                    required
                  />
                  {!isLogin && passwordValidation && (
                    <div className="mt-1 text-xs">
                      {passwordValidation.valid ? (
                        <span
                          className={
                            passwordStrength === "strong"
                              ? "text-green-600"
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
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-primary border-input rounded"
                      />
                      <span className="text-sm text-foreground">
                        Lembrar de mim
                      </span>
                    </label>

                    <Link
                      to="/user/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    (!isLogin &&
                      passwordValidation !== null &&
                      !passwordValidation.valid)
                  }
                  className={cn(
                    "flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-brand-glow transition-all duration-200 disabled:cursor-wait",
                    loading
                      ? "opacity-100"
                      : "disabled:opacity-50 disabled:cursor-not-allowed",
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
                </button>
                {!isLogin &&
                  passwordValidation !== null &&
                  !passwordValidation.valid && (
                    <p className="text-xs text-red-600 text-center mt-1">
                      Corrija a senha antes de continuar
                    </p>
                  )}
              </form>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                {isLogin ? "Não tem conta?" : "Já possui conta?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? "Cadastre-se" : "Login"}
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} {APP_PUBLIC_NAME}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
