import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import {
  fetchPublicTenantBrandingIfExists,
  listPublicTenants,
  register,
  type PublicTenantBranding,
  type PublicTenantListItem,
} from "@/api/requests";
import {
  APP_PUBLIC_LOGO_URL,
  APP_PUBLIC_NAME,
  getR2PublicOriginForPreconnect,
} from "@/constants/app-branding";
import {
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateTextInput,
} from "@/helpers/validation.helper";

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

  useEffect(() => {
    setPasswordStrength(null);
    setPasswordValidation(null);
    setRememberMe(false);
    setLoading(false);
    if (isLogin) {
      setFirstName("");
      setLastName("");
      setContractCode("");
    }
  }, [isLogin]);

  useEffect(() => {
    let cancelled = false;
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
  }, []);

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

    try {
      const slug = (tenantSlug || "").trim();
      if (!slug) {
        toast({
          title: "Abrigo obrigatório",
          description: "Selecione/informe qual abrigo você quer acessar.",
          variant: "error",
          duration: 3000,
        });
        setLoading(false);
        return;
      }

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

      if (!isLogin) {
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
      }

      const sanitizedLogin = sanitizeInput(login);
      const sanitizedPassword = sanitizeInput(password);

      if (isLogin) {
        await authLogin(sanitizedLogin, sanitizedPassword, slug);
        toast({
          title: "Login realizado!",
          variant: "success",
          duration: 3000,
        });
      } else {
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
        if (!needContractCode && tenantBranding === null && slug) {
          const b = await fetchPublicTenantBrandingIfExists(slug);
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
          slug,
          contractCode.trim() || undefined,
        );
        await authLogin(sanitizedLogin, sanitizedPassword, slug);
        toast({
          title: "Cadastro realizado!",
          variant: "success",
          duration: 3000,
        });
      }

      navigate("/dashboard");
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
      setLoading(false);
    }
  };

  const slugTrim = tenantSlug.trim();
  const defaultLogoSrc = APP_PUBLIC_LOGO_URL;

  const headerTitle =
    tenantBranding && slugTrim && !tenantBrandingLoading
      ? tenantBranding.brandName || tenantBranding.name
      : APP_PUBLIC_NAME;

  const headerLogoSrc = (() => {
    if (!slugTrim) return defaultLogoSrc;
    if (tenantBrandingLoading || !tenantBranding) return defaultLogoSrc;
    return (
      tenantBranding.logoUrl || tenantBranding.logoDataUrl || defaultLogoSrc
    );
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
                      O acesso é sempre no contexto do abrigo escolhido (e-mail
                      e senha valem para aquele abrigo).
                    </p>
                  )}
                </div>
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
                  className="w-full h-11 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 shadow-brand-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLogin ? "Entrar" : "Cadastrar"}
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
