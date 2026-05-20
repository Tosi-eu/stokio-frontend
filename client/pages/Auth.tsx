import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { setSkipTenantOnboarding } from "@/context/tenant-context";
import {
  fetchLoginTenantsForEmail,
  joinByInviteToken,
  registerUser,
  verifySignupContractCode,
  type LoginTenantSummary,
} from "@/api/requests";
import {
  clearSignupContractVerified,
  readSignupContractVerified,
  writeSignupContractVerified,
  type SignupContractVerifiedPayload,
} from "@/helpers/signup-contract-session.helper";
import { ManageCookiesLink } from "@/components/legal/ManageCookiesLink";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import { loginTenantDisplayLabel } from "@/helpers/tenant-display.helper";
import type { AuthProps } from "@/components/auth/auth.types";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  APP_PUBLIC_NAME,
  BRAND_LOGO_LOCAL_FALLBACK_PATH,
} from "@/constants/app-branding";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateTextInput,
} from "@/helpers/validation.helper";
import { prefetchTenantBrandLogoBeforeInicioNavigation } from "@/helpers/tenant-brand-logo-prefetch.helper";
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react";
import { ContactFormSection } from "@/components/ContactFormSection";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";
import { AuthMarketingAside } from "@/components/auth/AuthMarketingAside";
import { AuthLandingHero } from "@/components/auth/AuthLandingHero";
import { AuthContactIntro } from "@/components/auth/AuthContactIntro";
import { AuthMobileHeader } from "@/components/auth/AuthMobileHeader";
import { AuthMobileAnchorBar } from "@/components/auth/AuthMobileAnchorBar";
import { AuthSkipLinks } from "@/components/auth/AuthSkipLinks";
import { AuthLandingSection } from "@/components/auth/AuthLandingSection";
import { AuthLandingPanel } from "@/components/auth/AuthLandingPanel";
import { AuthSectionFooterLinks } from "@/components/auth/AuthSectionFooterLinks";
import { scrollAuthLandingSectionIntoView } from "@/components/auth/auth-landing.utils";
import { useAuthLandingActiveSection } from "@/components/auth/useAuthLandingActiveSection";
import { PageLabel } from "@/components/page/PageLabel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function Auth({ scrollToSection = "auth" }: AuthProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false);
  const [tenantPickerQuery, setTenantPickerQuery] = useState("");
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

  const contractVerifyBackgroundErrorAtRef = useRef(0);
  const authEmailRef = useRef<HTMLInputElement>(null);
  const [viewModeConfirmOpen, setViewModeConfirmOpen] = useState(false);
  const [pendingUserSignup, setPendingUserSignup] = useState<{
    login: string;
    password: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  const activeLandingSection = useAuthLandingActiveSection();

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

  useLayoutEffect(() => {
    if (scrollToSection === "auth") return;
    const sectionId =
      scrollToSection === "contact"
        ? "contact"
        : scrollToSection === "privacy"
          ? "privacy"
          : null;
    if (!sectionId) return;

    const scrollSectionIntoView = () => {
      scrollAuthLandingSectionIntoView(sectionId);
    };
    scrollSectionIntoView();
    requestAnimationFrame(scrollSectionIntoView);
  }, [scrollToSection]);

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
    if (isLogin) return;
    if (signupFlow !== "user") return;
    const cc = userContractCode.trim();
    const signupEmail = sanitizeInput(login).trim();
    const emailCheck = validateEmail(signupEmail);

    const stored = readSignupContractVerified();
    if (stored && (stored.code !== cc || stored.email !== signupEmail)) {
      clearSignupContractVerified();
    }

    if (!cc || !emailCheck.valid) {
      return;
    }

    let cancelled = false;
    const id = window.setTimeout(async () => {
      try {
        const res = await verifySignupContractCode(cc, signupEmail);
        if (cancelled) return;
        if (res.valid) {
          const payload: SignupContractVerifiedPayload = {
            code: cc,
            email: signupEmail,
            verifiedAt: Date.now(),
          };
          writeSignupContractVerified(payload);
        } else {
          clearSignupContractVerified();
        }
      } catch {
        if (cancelled) return;
        clearSignupContractVerified();
        const now = Date.now();
        if (now - contractVerifyBackgroundErrorAtRef.current > 60_000) {
          contractVerifyBackgroundErrorAtRef.current = now;
          toast({
            title: "Não foi possível verificar agora",
            description: "Ocorreu um problema. Tente mais tarde.",
            variant: "error",
            duration: 4500,
          });
        }
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [isLogin, signupFlow, userContractCode, login, toast]);

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const focusPrimaryAuthField = () => {
    requestAnimationFrame(() => authEmailRef.current?.focus());
  };

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

          if (userContractCode.trim()) {
            try {
              setSkipTenantOnboarding(created.tenant.id, false);
            } catch {
              void 0;
            }
            toast({
              title: "Vamos configurar seu abrigo",
              description:
                "Escolha módulos e personalize o abrigo. Você pode pular e fazer isso depois.",
              variant: "success",
              duration: 5000,
            });
            skipLoadingResetAfterSuccess = true;
            router.push("/tenant/onboarding");
            return;
          }

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
            "Confira seu e-mail e senha. Se precisar, use “Esqueci minha senha”.";
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
          errorDescription = "Por segurança, entre novamente para continuar.";
        } else if (
          rawMessage.includes("too many") ||
          rawMessage.includes("muitas tentativas") ||
          rawMessage.includes("rate limit")
        ) {
          errorTitle = "Muitas tentativas";
          errorDescription = "Aguarde um pouco e tente de novo.";
        } else {
          errorTitle = "Não foi possível entrar";
          errorDescription = getErrorMessage(
            err,
            USER_FACING_RETRY_SHORT,
            "Auth:loginGeneric",
          );
        }
      } else {
        if (
          rawMessage.includes("token") &&
          (rawMessage.includes("inválido") ||
            rawMessage.includes("invalid") ||
            rawMessage.includes("expirado"))
        ) {
          errorTitle = "Convite inválido";
          errorDescription = getErrorMessage(
            err,
            "Esse convite não é mais válido. Peça um novo ao responsável.",
            "Auth:inviteInvalid",
          );
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
            "Esse e-mail já tem conta. Faça login ou use outro e-mail.";
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
            "A senha não atende aos requisitos. Ajuste e tente de novo.";
        } else {
          errorTitle = "Não foi possível criar a conta";
          errorDescription = getErrorMessage(
            err,
            USER_FACING_RETRY_SHORT,
            "Auth:signupGeneric",
          );
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

  const sortedLoginTenants = useMemo(() => {
    if (!loginLinkedTenants?.length) return [];
    return [...loginLinkedTenants].sort((a, b) =>
      loginTenantDisplayLabel(a).localeCompare(
        loginTenantDisplayLabel(b),
        undefined,
        { sensitivity: "base" },
      ),
    );
  }, [loginLinkedTenants]);

  const filteredLoginTenants = useMemo(() => {
    const q = tenantPickerQuery.trim().toLowerCase();
    if (!q) return sortedLoginTenants;
    return sortedLoginTenants.filter((t) =>
      loginTenantDisplayLabel(t).toLowerCase().includes(q),
    );
  }, [sortedLoginTenants, tenantPickerQuery]);

  const selectedLoginTenant = loginLinkedTenants?.find(
    (t) => t.slug === tenantSlug,
  );
  const loginTenantTriggerLabel = selectedLoginTenant
    ? loginTenantDisplayLabel(selectedLoginTenant)
    : "Selecione o abrigo";

  const inputFieldClass =
    "h-11 rounded-xl border-border/70 bg-background/95 shadow-sm transition-shadow focus-visible:ring-primary/30";

  return (
    <div
      className={cn(
        "flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-brand-mesh lg:flex-row",
        "transition-opacity duration-700 ease-in motion-reduce:transition-none",
        !isVisible ? "opacity-0 motion-reduce:opacity-100" : "opacity-100",
      )}
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
                } catch (err: unknown) {
                  toast({
                    title: "Não foi possível criar a conta",
                    description: getErrorMessage(
                      err,
                      USER_FACING_RETRY_SHORT,
                      "Auth:signupPreviewMode",
                    ),
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

      <AuthMarketingAside
        logoSrc={BRAND_LOGO_LOCAL_FALLBACK_PATH}
        onLogoFallback={() => {}}
        activeSection={activeLandingSection}
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AuthSkipLinks />
        <div className="auth-landing-scroll flex min-h-0 flex-1 snap-y snap-proximity flex-col overflow-y-auto scroll-smooth overscroll-y-contain motion-reduce:snap-none pb-[5.25rem] lg:pb-0">
          <AuthMobileHeader
            logoSrc={BRAND_LOGO_LOCAL_FALLBACK_PATH}
            onLogoFallback={() => {}}
          />

          <main id="auth-page-main">
            <h1 className="sr-only">
              Iniciar sessão, contacto e privacidade · {APP_PUBLIC_NAME}
            </h1>

            <AuthLandingSection
              id="auth"
              ariaLabel="Entrar ou cadastrar"
              tone="default"
              align="start"
              className="border-t-0 pb-20 pt-4 sm:pt-5 lg:pb-24 lg:pt-8"
            >
              <AuthLandingPanel className="space-y-5 sm:space-y-6">
                <header className="space-y-3">
                  <PageLabel>Acesso</PageLabel>
                  <AuthLandingHero />
                </header>

                <Card
                  id="auth-main"
                  className={cn(
                    pageSurfaceCardClass,
                    "border-border/60 bg-background/75 shadow-sm ring-0 backdrop-blur-sm",
                  )}
                >
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="font-display text-2xl">
                      {isLogin ? "Entrar" : "Nova conta"}
                    </CardTitle>
                    <CardDescription>
                      {isLogin
                        ? "Acesse com seu e-mail e senha."
                        : "Crie sua conta rápido ou use um convite."}
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
                        onClick={() => {
                          setIsLogin(true);
                          focusPrimaryAuthField();
                        }}
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
                        onClick={() => {
                          setIsLogin(false);
                          focusPrimaryAuthField();
                        }}
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
                            Não precisa de código de contrato — só do token
                            único.
                          </p>
                        </div>
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
                          ref={authEmailRef}
                          id="auth-email"
                          type="email"
                          value={login}
                          onChange={(e) =>
                            setLogin(sanitizeInput(e.target.value))
                          }
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
                            placeholder="Se você já tem, cole aqui"
                          />
                          <p className="text-xs text-muted-foreground">
                            Opcional.
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
                              A procurar abrigos com este e-mail registado…
                            </p>
                          ) : loginLinkedTenants ===
                            null ? null : loginLinkedTenants.length === 0 ? (
                            <p className="text-xs text-amber-800 dark:text-amber-200/90">
                              Nenhum abrigo encontrado para este e-mail.
                            </p>
                          ) : loginLinkedTenants.length === 1 ? (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Abrigo:
                              </span>{" "}
                              {loginTenantDisplayLabel(loginLinkedTenants[0]!)}
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">
                                Onde quer entrar?
                              </Label>
                              <Popover
                                open={tenantPickerOpen}
                                onOpenChange={(open) => {
                                  setTenantPickerOpen(open);
                                  if (!open) setTenantPickerQuery("");
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={tenantPickerOpen}
                                    id="tenant-login-picker"
                                    className={cn(
                                      inputFieldClass,
                                      "w-full justify-between font-normal px-3",
                                    )}
                                  >
                                    <span className="truncate text-left">
                                      {loginTenantTriggerLabel}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] max-w-[min(24rem,calc(100vw-2rem))] p-0"
                                  align="start"
                                >
                                  <Command shouldFilter={false}>
                                    <CommandInput
                                      placeholder="Pesquisar por nome…"
                                      value={tenantPickerQuery}
                                      onValueChange={setTenantPickerQuery}
                                    />
                                    <CommandList className="max-h-[260px]">
                                      <CommandEmpty>
                                        Nenhum abrigo encontrado.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {filteredLoginTenants.map((t) => {
                                          const label =
                                            loginTenantDisplayLabel(t);
                                          const selected =
                                            t.slug === tenantSlug;
                                          return (
                                            <CommandItem
                                              key={t.slug}
                                              value={`${t.slug}\t${label}`}
                                              onSelect={() => {
                                                setTenantSlug(t.slug);
                                                setTenantPickerOpen(false);
                                                setTenantPickerQuery("");
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4 shrink-0",
                                                  selected
                                                    ? "opacity-100"
                                                    : "opacity-0",
                                                )}
                                              />
                                              <span className="truncate">
                                                {label}
                                              </span>
                                            </CommandItem>
                                          );
                                        })}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {!tenantSlug.trim() ? (
                                <p className="text-xs text-muted-foreground">
                                  Escolha o abrigo em que deseja entrar.
                                </p>
                              ) : null}
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
                          autoComplete={
                            isLogin ? "current-password" : "new-password"
                          }
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
                      <div className="flex justify-center pt-2">
                        <a
                          href="#contact"
                          className="group inline-flex items-center gap-2 rounded-xl border border-border/70 bg-muted/50 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/35 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <span>Ir para contato</span>
                          <ChevronDown
                            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-y-0.5"
                            aria-hidden
                          />
                        </a>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground/80 lg:hidden space-y-1">
                  <span className="block">
                    © {new Date().getFullYear()} {APP_PUBLIC_NAME}
                  </span>
                  <ManageCookiesLink className="text-muted-foreground/80" />
                </p>
              </AuthLandingPanel>
            </AuthLandingSection>

            <AuthLandingSection id="contact" ariaLabel="Contacto" tone="muted">
              <AuthLandingPanel className="space-y-6">
                <PageLabel>Contato</PageLabel>
                <AuthContactIntro />
                <ContactFormSection variant="embedded-panel" />
                <AuthSectionFooterLinks
                  primaryHref="#privacy"
                  primaryLabel="Privacidade e cookies"
                />
              </AuthLandingPanel>
            </AuthLandingSection>

            <AuthLandingSection
              id="privacy"
              ariaLabel="Privacidade e cookies"
              tone="subtle"
            >
              <AuthLandingPanel className="space-y-6">
                <PageLabel>Privacidade</PageLabel>
                <div className="rounded-xl border border-border/50 bg-muted/25 p-4 sm:p-5">
                  <PrivacyPolicyContent />
                </div>
                <AuthSectionFooterLinks
                  primaryHref="#contact"
                  primaryLabel="Contacto"
                />
              </AuthLandingPanel>
            </AuthLandingSection>
          </main>
        </div>
        <AuthMobileAnchorBar activeSection={activeLandingSection} />
      </div>
    </div>
  );
}
