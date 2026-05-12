"use client";

import {
  updateTenantBranding,
  updateTenantConfig,
  uploadTenantLogoWithProgress,
  setTenantContractCode,
  claimTenantContractCode,
  verifyTenantContractCode,
  listTenantSetores,
  type TenantSetorRow,
  downloadTenantImportTemplate,
  importTenantXlsx,
  tenantImportTotalForKey,
  type TenantImportXlsxResponse,
  dismissTenantOnboarding,
} from "@/api/requests";
import {
  getEnabledSectors,
  tenantEnabledKeysForConfigPatch,
} from "@/helpers/tenant-sectors.helper";
import { setSkipTenantOnboarding } from "@/context/tenant-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import {
  appendLogoCacheBust,
  appendLogoRevision,
  buildTenantLogoProxyUrl,
} from "@/helpers/tenant-r2-logo-url.helper";
import { validateImageFileDecodes } from "@/helpers/validate-image-file.helper";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import { SIGNUP_CONTRACT_VERIFIED_SESSION_KEY } from "@/helpers/signup-contract-session.helper";
import { HeartPulse, Pill, Warehouse } from "lucide-react";
import { TENANT_ONBOARDING_SECTOR_OPTIONS } from "@/components/tenant-onboarding/tenant-onboarding.constants";

export function useTenantOnboardingPage() {
  const router = useRouter();
  const { user, logout, patchStoredUser } = useAuth();
  const { modules, tenant, loading, tenantId, previewMode, refetch } =
    useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManageModules =
    user?.role === "admin" || isSuperAdminUser(user ?? null);

  const [enabledSectors, setEnabledSectors] = useState<Set<string>>(
    () => new Set(["farmacia", "enfermagem"]),
  );
  const [sectorCatalog, setSectorCatalog] = useState<TenantSetorRow[]>([]);
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadPercent, setLogoUploadPercent] = useState<number | null>(
    null,
  );
  const [logoUploadPhase, setLogoUploadPhase] = useState<
    "idle" | "sending" | "storing"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [contractCode, setContractCode] = useState("");
  const [contractValidated, setContractValidated] = useState(false);
  const [validatingContract, setValidatingContract] = useState(false);

  const signupContractAutoVerifyStartedRef = useRef(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const lastTenantKeyRef = useRef<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [importingXlsx, setImportingXlsx] = useState(false);
  const [importResult, setImportResult] =
    useState<TenantImportXlsxResponse | null>(null);

  const confirmSkipOnboarding = async () => {
    if (tenantId == null) return;
    try {
      await dismissTenantOnboarding();
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Não foi possível concluir. Tente novamente.",
        "TenantOnboarding:dismiss",
      );
      toast({
        title: "Não foi possível pular",
        description: message,
        variant: "error",
        duration: 5000,
      });
      return;
    }
    setSkipTenantOnboarding(tenantId, true);
    router.replace("/loading");
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const blob = await downloadTenantImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template-importacao.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Não foi possível baixar o modelo.",
        "TenantOnboarding:templateDownload",
      );
      toast({
        title: "Não foi possível baixar",
        description: message,
        variant: "error",
        duration: 5000,
      });
    }
  };

  const handleImportXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx")) {
      toast({
        title: "Arquivo inválido",
        description: "Use uma planilha .xlsx no template do sistema.",
        variant: "error",
      });
      e.target.value = "";
      return;
    }
    setImportingXlsx(true);
    setImportResult(null);
    try {
      const res = await importTenantXlsx(file);
      setImportResult(res);
      const created = tenantImportTotalForKey(res.summary, "created");
      const updated = tenantImportTotalForKey(res.summary, "updated");
      toast({
        title: "Importação concluída",
        description:
          res.errors.length > 0
            ? `Importamos o que deu certo. Criados: ${created}, atualizados: ${updated}, erros: ${res.errors.length}.`
            : `Criados: ${created}, atualizados: ${updated}.`,
        variant: res.errors.length > 0 ? "warning" : "success",
        duration: 6000,
      });
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Não foi possível importar a planilha.",
        "TenantOnboarding:xlsxImport",
      );
      toast({
        title: "Erro na importação",
        description: message,
        variant: "error",
        duration: 6000,
      });
    } finally {
      setImportingXlsx(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (loading) return;
    const nextTenantKey =
      tenantId != null && tenant?.slug?.trim()
        ? `${tenantId}:${tenant.slug.trim()}`
        : null;
    const tenantChanged =
      lastTenantKeyRef.current != null &&
      nextTenantKey != null &&
      lastTenantKeyRef.current !== nextTenantKey;
    lastTenantKeyRef.current = nextTenantKey;

    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingLogoFile(null);

    if (tenantChanged) {
      signupContractAutoVerifyStartedRef.current = false;

      if (!contractValidated) {
        setContractCode("");
        setContractValidated(false);
      }
    }
    setEnabledSectors(new Set(getEnabledSectors(modules ?? null)));
    setBrandName(tenant?.brandName ?? tenant?.name ?? "");
    const serverLogo = tenant?.logoUrl?.trim() || null;
    const slug = tenant?.slug?.trim();
    const rev = tenant?.brandingUpdatedAt;
    if (serverLogo) {
      const proxy = slug ? buildTenantLogoProxyUrl(slug) : "";
      if (proxy) {
        setLogoUrl(
          rev ? appendLogoRevision(proxy, rev) : appendLogoCacheBust(proxy),
        );
      } else {
        setLogoUrl(
          rev
            ? appendLogoRevision(serverLogo, rev)
            : appendLogoCacheBust(serverLogo),
        );
      }
    }
  }, [loading, modules, tenant, tenantId, contractValidated]);

  useEffect(() => {
    if (previewMode || loading) return;
    void listTenantSetores()
      .then((r) => setSectorCatalog(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setSectorCatalog([]));
  }, [previewMode, loading, tenantId]);

  const sectorUiRows = useMemo(() => {
    if (sectorCatalog.length > 0) {
      return [...sectorCatalog]
        .filter((s) => s.active)
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
        .map((c) => ({
          key: c.key,
          label: c.nome,
          hint:
            c.proportion_profile === "enfermagem"
              ? "Perfil enfermagem: buckets de gráfico alinhados à enfermagem (carrinhos, etc.)."
              : "Perfil farmácia: buckets de gráfico alinhados à farmácia.",
          icon:
            c.key === "enfermagem"
              ? HeartPulse
              : c.key === "farmacia"
                ? Pill
                : Warehouse,
        }));
    }
    return TENANT_ONBOARDING_SECTOR_OPTIONS;
  }, [sectorCatalog]);

  const jsonPreview = useMemo(
    () =>
      JSON.stringify(
        {
          enabled_sectors: Array.from(enabledSectors),
        },
        null,
        2,
      ),
    [enabledSectors],
  );

  const initials = useMemo(() => {
    const n = brandName.trim() || tenant?.name?.trim() || "A";
    return n
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [brandName, tenant?.name]);

  const toggleSector = (key: string) => {
    setEnabledSectors((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return next;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const verifyContractCodeFlow = useCallback(
    async (rawCode: string, opts?: { silent?: boolean }): Promise<boolean> => {
      const silent = Boolean(opts?.silent);
      const slug = tenant?.slug?.trim();
      const code = rawCode.trim();
      const sessionLogin = user?.login?.trim();

      if (!slug) {
        if (!silent) {
          toast({
            title: "Abrigo sem identificador",
            description:
              "Não foi possível validar o código. Recarregue a página.",
            variant: "error",
          });
        }
        return false;
      }
      if (!code) {
        if (!silent) {
          toast({
            title: "Informe o código",
            description:
              "Digite o código do contrato fornecido pela equipe Stokio.",
            variant: "error",
          });
        }
        return false;
      }
      if (!sessionLogin) {
        if (!silent) {
          toast({
            title: "Sessão inválida",
            description:
              "Faça login de novo para associar o código ao seu e-mail.",
            variant: "error",
          });
        }
        return false;
      }

      setContractCode(code);
      setValidatingContract(true);
      try {
        if (slug.startsWith("u-")) {
          const claim = await claimTenantContractCode(code, sessionLogin);
          if (claim.migrated === true && claim.tenantId != null) {
            patchStoredUser({
              tenantId: claim.tenantId,
              role: "admin",
            });
            await refetch();
            setContractValidated(true);
            if (!silent) {
              toast({
                title: "Abrigo associado",
                description:
                  "Código confirmado. Você já pode escolher o logo e salvar.",
                variant: "success",
                duration: 7000,
              });
            }
            return true;
          }
          setContractValidated(false);
          if (!silent) {
            toast({
              title: "Não foi possível associar o código",
              description:
                "Não conseguimos ligar este código à sua conta neste momento. Confira o código ou fale com o suporte Stokio.",
              variant: "error",
            });
          }
          return false;
        }

        const res = await verifyTenantContractCode(slug, code);
        if (res.contractCodeRequired === false) {
          setContractValidated(false);
          if (!silent) {
            toast({
              title: "Não foi possível validar",
              description: "Confira o código do contrato e tente de novo.",
              variant: "error",
              duration: 6000,
            });
          }
          return false;
        }
        if (!res.valid) {
          setContractValidated(false);
          if (!silent) {
            toast({
              title: "Não foi possível validar",
              description: "Código não aceito. Verifique e tente de novo.",
              variant: "error",
            });
          }
          return false;
        }
        setContractValidated(true);
        if (!silent) {
          toast({
            title: "Código confirmado",
            description: "Você já pode escolher o logo e salvar.",
            variant: "success",
          });
        }
        return true;
      } catch (err: unknown) {
        setContractValidated(false);
        console.error(err);
        if (!silent) {
          toast({
            title: "Não foi possível validar",
            description: getErrorMessage(
              err,
              USER_FACING_RETRY_SHORT,
              "TenantOnboarding:verifyContract",
            ),
            variant: "error",
          });
        }
        return false;
      } finally {
        setValidatingContract(false);
      }
    },
    [tenant?.slug, user?.login, patchStoredUser, refetch],
  );

  const handleVerifyContract = async () => {
    await verifyContractCodeFlow(contractCode, { silent: false });
  };

  useEffect(() => {
    if (loading) return;
    const slug = tenant?.slug?.trim();
    const sessionLogin = user?.login?.trim();
    if (!slug || !sessionLogin) return;
    if (signupContractAutoVerifyStartedRef.current) return;

    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SIGNUP_CONTRACT_VERIFIED_SESSION_KEY);
    } catch {
      // ignore
    }
    if (!raw) return;

    let parsed: { code?: string; email?: string };
    try {
      parsed = JSON.parse(raw) as { code?: string; email?: string };
    } catch {
      sessionStorage.removeItem(SIGNUP_CONTRACT_VERIFIED_SESSION_KEY);
      return;
    }

    const pc = String(parsed.code ?? "").trim();
    const pe = String(parsed.email ?? "").trim();
    if (!pc || pe !== sessionLogin) {
      sessionStorage.removeItem(SIGNUP_CONTRACT_VERIFIED_SESSION_KEY);
      return;
    }

    signupContractAutoVerifyStartedRef.current = true;
    void (async () => {
      const ok = await verifyContractCodeFlow(pc, { silent: true });
      sessionStorage.removeItem(SIGNUP_CONTRACT_VERIFIED_SESSION_KEY);
      if (!ok) {
        signupContractAutoVerifyStartedRef.current = false;
      } else if (tenantId != null) {
        setSkipTenantOnboarding(tenantId, false);
      }
    })();
  }, [loading, tenantId, tenant?.slug, user?.login, verifyContractCodeFlow]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewMode) {
      toast({
        title: "Modo de visualização",
        description: "Saia do modo demonstração para escolher e enviar o logo.",
        variant: "warning",
        duration: 5000,
      });
      e.target.value = "";
      return;
    }
    if (!contractValidated) {
      toast({
        title: "Valide o código do contrato",
        description: "Use «Validar código» antes de escolher a imagem do logo.",
        variant: "warning",
      });
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Imagem muito grande",
        description: "Use uma imagem de até 2 MB.",
        variant: "error",
      });
      e.target.value = "";
      return;
    }
    const ok = await validateImageFileDecodes(file);
    if (!ok) {
      toast({
        title: "Arquivo inválido",
        description:
          "Escolha uma imagem PNG, JPG, WebP ou GIF que o navegador consiga abrir.",
        variant: "error",
      });
      e.target.value = "";
      return;
    }
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingLogoFile(file);
    toast({
      title: "Imagem selecionada",
      description: "Pré-visualização.",
      variant: "success",
    });
    e.target.value = "";
  };

  const clearPendingLogo = () => {
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPendingLogoFile(null);
  };

  const resetForm = () => {
    clearPendingLogo();
    setEnabledSectors(new Set(getEnabledSectors(modules ?? null)));
    setBrandName(tenant?.brandName ?? tenant?.name ?? "");
    setContractCode("");
    setContractValidated(false);
    const serverLogo = tenant?.logoUrl?.trim() || null;
    const slug = tenant?.slug?.trim();
    const rev = tenant?.brandingUpdatedAt;
    if (!serverLogo) {
      setLogoUrl(null);
      return;
    }
    const proxy = slug ? buildTenantLogoProxyUrl(slug) : "";
    if (proxy) {
      setLogoUrl(
        rev ? appendLogoRevision(proxy, rev) : appendLogoCacheBust(proxy),
      );
    } else {
      setLogoUrl(
        rev
          ? appendLogoRevision(serverLogo, rev)
          : appendLogoCacheBust(serverLogo),
      );
    }
  };

  const avatarDisplaySrc = localPreviewUrl || logoUrl;

  const save = async () => {
    if (previewMode) {
      toast({
        title: "Modo de visualização",
        description:
          "Use «Concluir configuração» no aviso acima para guardar nome e logo.",
        variant: "warning",
        duration: 6000,
      });
      return;
    }
    const hasLogo = pendingLogoFile != null || Boolean(logoUrl?.trim());
    if (!hasLogo) {
      toast({
        title: "Logo obrigatório",
        description:
          "Valide o código do contrato, escolha uma imagem e salve — ou mantenha um logo já existente neste abrigo.",
        variant: "error",
      });
      return;
    }
    if (pendingLogoFile != null && !contractValidated) {
      toast({
        title: "Valide o código do contrato",
        description:
          "O código precisa estar confirmado antes de enviar uma imagem nova.",
        variant: "error",
      });
      return;
    }
    setSaving(true);
    let finalLogoUrl = logoUrl?.trim() || null;
    try {
      if (tenantId != null) setSkipTenantOnboarding(tenantId, false);

      let contractRes: Awaited<
        ReturnType<typeof setTenantContractCode>
      > | null = null;
      if (contractCode.trim()) {
        const sessionLogin = user?.login?.trim();
        if (!sessionLogin) {
          toast({
            title: "Sessão inválida",
            description:
              "Não foi possível gravar o código de contrato sem o e-mail da sessão. Faça login de novo.",
            variant: "error",
          });
          return;
        }
        contractRes = await setTenantContractCode(
          contractCode.trim(),
          sessionLogin,
        );
        if (contractRes?.migrated === true && contractRes.tenantId != null) {
          patchStoredUser({ tenantId: contractRes.tenantId, role: "admin" });
          await refetch();
        }
      }

      const brandPayload = { brandName: brandName.trim() || null };
      if (pendingLogoFile) {
        setLogoUploadPercent(0);
        setLogoUploadPhase("sending");
        setUploadingLogo(true);
        try {
          const bn =
            brandName.trim() ||
            tenant?.name?.trim() ||
            tenant?.brandName?.trim() ||
            "logo";
          const { logoUrl: uploaded } = await uploadTenantLogoWithProgress(
            pendingLogoFile,
            bn,
            {
              onUploadProgress: (pct) => setLogoUploadPercent(pct),
              onPhase: (phase) => setLogoUploadPhase(phase),
            },
          );
          finalLogoUrl = appendLogoCacheBust(uploaded);
          setLogoUrl(finalLogoUrl);
          clearPendingLogo();
        } finally {
          setUploadingLogo(false);
          setLogoUploadPercent(null);
          setLogoUploadPhase("idle");
        }
      }
      if (!finalLogoUrl?.trim()) {
        toast({
          title: "Logo obrigatório",
          description: "Escolha uma imagem ou mantenha o logo atual do abrigo.",
          variant: "error",
        });
        return;
      }
      await updateTenantBranding({ ...brandPayload, logoUrl: finalLogoUrl });
      if (canManageModules) {
        await updateTenantConfig({
          enabled: tenantEnabledKeysForConfigPatch(modules?.enabled),
          enabled_sectors: Array.from(enabledSectors),
          automatic_price_search: modules?.automatic_price_search !== false,
          automatic_reposicao_notifications:
            modules?.automatic_reposicao_notifications !== false,
        });
      }
      toast({
        title: "Configuração salva",
        description:
          contractRes?.migrated === true
            ? "A sua conta foi associada ao abrigo definitivo. Faça login de novo com o mesmo e-mail; escolha o abrigo indicado se lhe pedir."
            : "Faça login novamente: escolha seu abrigo e entre com e-mail e senha.",
        variant: "success",
      });
      await logout();
      router.replace("/user/login");
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: getErrorMessage(
          err,
          "Não foi possível guardar a configuração. " + USER_FACING_RETRY_SHORT,
          "TenantOnboarding:save",
        ),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };
  const completePreviewConfiguration = () => {
    if (tenantId == null) return;
    setSkipTenantOnboarding(tenantId, false);
    toast({
      title: "Configuração completa",
      description:
        "Agora você pode validar o código, escolher o logo e salvar.",
      duration: 4000,
    });
  };

  return {
    canManageModules,
    confirmSkipOnboarding,
    completePreviewConfiguration,
    previewMode,
    tenantId,
    tenant,
    contractCode,
    setContractCode,
    contractValidated,
    setContractValidated,
    validatingContract,
    handleVerifyContract,
    clearPendingLogo,
    pendingLogoFile,
    localPreviewUrl,
    fileInputRef,
    handleFile,
    uploadingLogo,
    saving,
    logoUploadPhase,
    logoUploadPercent,
    avatarDisplaySrc,
    initials,
    brandName,
    setBrandName,
    handleDownloadImportTemplate,
    importFileInputRef,
    handleImportXlsx,
    importingXlsx,
    importResult,
    sectorUiRows,
    toggleSector,
    enabledSectors,
    jsonPreview,
    resetForm,
    save,
    logoUrl,
  };
}

export type TenantOnboardingPageVm = ReturnType<typeof useTenantOnboardingPage>;
