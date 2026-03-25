import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import {
  fetchLoginTenantsForEmail,
  fetchPublicTenantBrandingIfExists,
  listPublicTenants,
  register,
  type LoginTenantSummary,
  type PublicTenantBranding,
  type PublicTenantListItem,
} from "@/api/requests";
import {
  APP_PUBLIC_NAME,
  getR2PublicOriginForPreconnect,
} from "@/constants/app-branding";
import { usePublicDefaultLogoUrl } from "@/hooks/use-public-default-logo.hook";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateTextInput,
} from "@/helpers/validation.helper";
import { prefetchTenantBrandLogoBeforeInicioNavigation } from "@/helpers/tenant-brand-logo-prefetch.helper";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantOptions, setTenantOptions] = useState<PublicTenantListItem[]>(
    [],
  );
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantBranding, setTenantBranding] =
    useState<PublicTenantBranding | null>(null);
  const [tenantBrandingLoading, setTenantBrandingLoading] = useState(false);
  const brandingFetchSlugRef = useRef<string>("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  /** Após autenticação OK: prefetch do logo/config até o cache estar pronto; só então `navigate("/loading")`. */
  const [preparingInicioNavigation, setPreparingInicioNavigation] =
    useState(false);
  /** Abrigos onde o e-mail tem conta (modo login); null = ainda não pesquisado ou e-mail inválido. */
  const [loginLinkedTenants, setLoginLinkedTenants] = useState<
    LoginTenantSummary[] | null
  >(null);
  const [loginLinkedTenantsLoading, setLoginLinkedTenantsLoading] =
    useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | null
  >(null);
  const [passwordValidation, setPasswordValidation] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);
  const defaultLogoSrc = usePublicDefaultLogoUrl();

  useEffect(() => {
    setPasswordStrength(null);
    setPasswordValidation(null);
    setRememberMe(false);
    setLoading(false);
    setPreparingInicioNavigation(false);
    setLoginLinkedTenants(null);
    setLoginLinkedTenantsLoading(false);
    if (isLogin) {
      setFirstName("");
      setLastName("");
      setContractCode("");
    }
  }, [isLogin]);

  useEffect(() => {
    if (isLogin) {
      setTenantsLoading(false);
      return;
    }
    let cancelled = false;
    setTenantsLoading(true);
    (async () => {
      try {
        const res = await listPublicTenants({ limit: 200 });
        if (!cancelled) setTenantOptions(res.data ?? []);
      } catch {
        if (!cancelled) setTenantOptions([]);
      } finally {
        if (!cancelled) setTenantsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLogin]);

  useEffect(() => {
    const slug = tenantSlug.trim();
    if (!slug) {
      brandingFetchSlugRef.current = "";
      setTenantBranding(null);
      setTenantBrandingLoading(false);
      return;
    }

    brandingFetchSlugRef.current = slug;
    setTenantBranding(null);
    setTenantBrandingLoading(true);

    let cancelled = false;
    (async () => {
      try {
        const b = await fetchPublicTenantBrandingIfExists(slug);
        if (cancelled) return;
        if (brandingFetchSlugRef.current !== slug) return;
        setTenantBranding(b);
      } finally {
        if (!cancelled && brandingFetchSlugRef.current === slug) {
          setTenantBrandingLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

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
    const origin = getR2PublicOriginForPreconnect();
    if (!origin) return;
    const id = "preconnect-r2-assets";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preconnect";
    link.href = origin;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, []);

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
    setPreparingInicioNavigation(false);
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
        const slugReg = (tenantSlug || "").trim();
        if (!slugReg) {
          toast({
            title: "Abrigo obrigatório",
            description: "Selecione o abrigo em que deseja criar a conta.",
            variant: "error",
            duration: 3000,
          });
          setLoading(false);
          return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          toast({
            title: "Senha inválida",
            description:
              passwordValidation.error || "A senha não atende aos requisitos.",
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

        let needContractCode = tenantBranding?.contractCodeMandatory === true;
        if (!needContractCode && tenantBranding === null && slugReg) {
          const b = await fetchPublicTenantBrandingIfExists(slugReg);
          needContractCode = b?.contractCodeMandatory === true;
        }
        if (needContractCode && !contractCode.trim()) {
          toast({
            title: "Código de contrato obrigatório",
            description:
              "Informe o código fornecido na assinatura do contrato para este abrigo.",
            variant: "error",
            duration: 4000,
          });
          setLoading(false);
          return;
        }

        await register(
          sanitizedLogin,
          sanitizedPassword,
          firstName,
          lastName,
          slugReg,
          contractCode.trim() || undefined,
        );
        await authLogin(sanitizedLogin, sanitizedPassword, slugReg);
        setPreparingInicioNavigation(true);
        await prefetchTenantBrandLogoBeforeInicioNavigation();
        toast({
          title: "Cadastro realizado!",
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
            "Não encontramos este e-mail em nenhum abrigo. Verifique o endereço ou cadastre-se.",
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
      setPreparingInicioNavigation(true);
      await prefetchTenantBrandLogoBeforeInicioNavigation();
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
        if (rawMessage.includes("abrigo não encontrado")) {
          errorTitle = "Abrigo não encontrado";
          errorDescription =
            "Escolha um abrigo válido na lista ou contate o suporte.";
        } else if (
          rawMessage.includes("login já cadastrado") ||
          rawMessage.includes("duplicate") ||
          rawMessage.includes("já existe")
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
        setPreparingInicioNavigation(false);
      }
    }
  };

  const slugTrim = tenantSlug.trim();
  const loginEmailTrim = sanitizeInput(login).trim();
  const loginEmailValid = validateEmail(loginEmailTrim).valid;

  const headerTitle = (() => {
    if (tenantBranding && slugTrim && !tenantBrandingLoading) {
      const t = (tenantBranding.brandName || tenantBranding.name || "").trim();
      if (t) return t;
    }
    return APP_PUBLIC_NAME;
  })();

  const headerLogoSrc = (() => {
    if (!slugTrim) return defaultLogoSrc;
    if (tenantBrandingLoading || !tenantBranding) return defaultLogoSrc;
    return tenantBranding.logoUrl || defaultLogoSrc;
  })();

  return (
    <div
      className="min-h-screen flex flex-col bg-brand-mesh"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.6s ease-in",
      }}
    >
      <header className="shrink-0 border-b border-border/70 bg-brand-hero/90 backdrop-blur-sm">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <img
            key={`${slugTrim}:${headerLogoSrc}`}
            src={headerLogoSrc}
            alt={headerTitle}
            className="h-28 w-auto max-w-[360px] object-contain object-left drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
          <h1 className="font-display text-xl font-semibold text-foreground tracking-tight hidden sm:block">
            {headerTitle}
          </h1>
        </div>
      </header>

      <main className="flex-1 bg-transparent">
        <div className="max-w-[1651px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="max-w-md mx-auto">
            <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-2xl shadow-elevated p-8 md:p-9">
              <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight mb-6">
                {isLogin ? "Acesso ao Sistema" : "Cadastro de Usuário"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Abrigo
                    </label>
                    <select
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      required
                      disabled={tenantsLoading}
                      className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary bg-background disabled:opacity-60 disabled:cursor-wait transition-shadow"
                    >
                      <option value="">
                        {tenantsLoading
                          ? "Carregando abrigos…"
                          : "Selecione o abrigo"}
                      </option>
                      {tenantOptions.map((t) => (
                        <option key={t.id} value={t.slug}>
                          {t.brandName || t.name} ({t.slug})
                        </option>
                      ))}
                    </select>
                    {!tenantsLoading && tenantOptions.length === 0 ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Nenhum abrigo disponível no momento. Tente mais tarde ou
                        contate o suporte.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        O cadastro é feito no contexto do abrigo escolhido.
                      </p>
                    )}
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
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Código do contrato
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      value={contractCode}
                      onChange={(e) =>
                        setContractCode(sanitizeInput(e.target.value))
                      }
                      maxLength={256}
                      className="w-full px-3 py-2.5 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-shadow"
                      placeholder="Código informado na assinatura"
                      required={tenantBranding?.contractCodeMandatory === true}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mesmo código fornecido pela equipe ao formalizar o uso do
                      sistema.
                    </p>
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
                        Nenhum abrigo encontrado para este e-mail. Verifique o
                        endereço ou registe-se num abrigo.
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
                    tenantsLoading ||
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
                        {preparingInicioNavigation
                          ? "A preparar o seu espaço, a carregar identidade visual"
                          : isLogin
                            ? "A entrar"
                            : "A cadastrar"}
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
