import Layout from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeInAvatarImage } from "@/components/FadeInAvatarImage";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  updateTenantBranding,
  updateTenantConfig,
  uploadTenantLogoWithProgress,
  setTenantContractCode,
} from "@/api/requests";
import { setSkipTenantOnboarding } from "@/context/tenant-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { cn } from "@/lib/utils";
import { isSuperAdminUser } from "@/helpers/auth-roles.helper";
import {
  appendLogoCacheBust,
  appendLogoRevision,
  buildTenantLogoProxyUrl,
} from "@/helpers/tenant-r2-logo-url.helper";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Archive,
  BarChart3,
  Bell,
  Check,
  Grid,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Package,
  Pill,
  RotateCcw,
  Shield,
  Sparkles,
  Upload,
  User,
  Users,
  Warehouse,
} from "lucide-react";

const MODULES: Array<{
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    hint: "Resumo e indicadores principais",
    icon: LayoutDashboard,
  },
  {
    key: "residents",
    label: "Residentes",
    hint: "Cadastro e gestão de residentes",
    icon: Users,
  },
  {
    key: "medicines",
    label: "Medicamentos",
    hint: "Medicamentos e estoque farmacêutico",
    icon: Pill,
  },
  {
    key: "inputs",
    label: "Insumos",
    hint: "Materiais e insumos diversos",
    icon: Package,
  },
  {
    key: "stock",
    label: "Estoque",
    hint: "Visão consolidada do estoque",
    icon: Warehouse,
  },
  {
    key: "cabinets",
    label: "Armários",
    hint: "Armários e categorias",
    icon: Archive,
  },
  {
    key: "drawers",
    label: "Gavetas",
    hint: "Gavetas e categorias",
    icon: Grid,
  },
  {
    key: "movements",
    label: "Movimentações",
    hint: "Entradas, saídas e transferências",
    icon: ArrowLeftRight,
  },
  {
    key: "reports",
    label: "Relatórios",
    hint: "Relatórios e exportações",
    icon: BarChart3,
  },
  {
    key: "notifications",
    label: "Notificações",
    hint: "Alertas e avisos do sistema",
    icon: Bell,
  },
  {
    key: "profile",
    label: "Perfil",
    hint: "Conta, e-mail e senha do usuário",
    icon: User,
  },
  {
    key: "admin",
    label: "Administração",
    hint: "Painel administrativo e configurações",
    icon: Shield,
  },
];

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { modules, tenant, loading, tenantId } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManageModules =
    user?.role === "admin" || isSuperAdminUser(user ?? null);

  const [enabled, setEnabled] = useState<Set<string>>(new Set());
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

  const confirmSkipOnboarding = () => {
    if (tenantId == null) return;
    setSkipTenantOnboarding(tenantId, true);
    toast({
      title: "Modo de visualização",
      description:
        "Complete a configuração do abrigo quando quiser, em Administração ou ao voltar a esta página.",
      duration: 5000,
    });
    navigate("/loading", { replace: true });
  };

  useEffect(() => {
    if (loading) return;
    setEnabled(new Set(modules?.enabled ?? []));
    setBrandName(tenant?.brandName ?? tenant?.name ?? "");
    setContractCode("");
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
  }, [loading, modules, tenant]);

  const jsonPreview = useMemo(
    () => JSON.stringify({ enabled: Array.from(enabled) }, null, 2),
    [enabled],
  );

  const selectedCount = enabled.size;
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

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Imagem muito grande",
        description: "Use uma imagem de até 2 MB.",
        variant: "error",
      });
      e.target.value = "";
      return;
    }
    setLogoUploadPercent(null);
    setLogoUploadPhase("sending");
    setUploadingLogo(true);
    try {
      const { logoUrl: url } = await uploadTenantLogoWithProgress(
        file,
        brandName,
        {
          onUploadProgress: (pct) => setLogoUploadPercent(pct),
          onPhase: (phase) => setLogoUploadPhase(phase),
        },
      );
      setLogoUrl(appendLogoCacheBust(url));
      toast({
        title: "Logo enviado",
        description: "Arquivo gravado no armazenamento e URL atualizada.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Não foi possível enviar o logo",
        description:
          err instanceof Error
            ? err.message
            : "Verifique se o armazenamento (R2) está configurado no servidor.",
        variant: "error",
      });
    } finally {
      setUploadingLogo(false);
      setLogoUploadPercent(null);
      setLogoUploadPhase("idle");
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setEnabled(new Set(modules?.enabled ?? []));
    setBrandName(tenant?.brandName ?? tenant?.name ?? "");
    setContractCode("");
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

  const save = async () => {
    if (canManageModules && enabled.size === 0) {
      toast({
        title: "Selecione ao menos um módulo",
        variant: "error",
      });
      return;
    }
    if (!logoUrl) {
      toast({
        title: "Logo obrigatório",
        description: "Envie um logo para concluir a configuração do abrigo.",
        variant: "error",
      });
      return;
    }
    setSaving(true);
    try {
      if (tenantId != null) setSkipTenantOnboarding(tenantId, false);
      const brandPayload = { brandName: brandName.trim() || null };
      await updateTenantBranding({ ...brandPayload, logoUrl });
      let contractRes: Awaited<
        ReturnType<typeof setTenantContractCode>
      > | null = null;
      if (contractCode.trim()) {
        contractRes = await setTenantContractCode(contractCode.trim());
      }
      if (contractRes?.migrated === true && contractRes.tenantId != null) {
        const raw = sessionStorage.getItem("user");
        if (raw && user?.id != null) {
          try {
            const parsed = JSON.parse(raw) as Record<string, unknown>;
            const next = { ...parsed, tenantId: contractRes.tenantId };
            sessionStorage.setItem("user", JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
      }
      if (canManageModules) {
        await updateTenantConfig({ enabled: Array.from(enabled) });
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
      navigate("/user/login", { replace: true });
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente em instantes.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout minimal>
      <div className="max-w-3xl mx-auto space-y-6">
        <Alert className="border-primary/25 bg-gradient-to-r from-primary/5 to-background shadow-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">
            Bem-vindo — configure seu abrigo
          </AlertTitle>
          <AlertDescription className="text-muted-foreground leading-relaxed">
            {canManageModules
              ? "Defina como o sistema aparece para sua equipe (nome e logo) e quais áreas ficam disponíveis no menu. Você pode alterar isso depois no painel administrativo."
              : "Defina o nome e o logo do abrigo. Quais módulos aparecem no menu são definidos pelo administrador do painel — não é possível alterar aqui."}
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-border shadow-lg shadow-elevated">
          <CardHeader className="space-y-2 border-b bg-gradient-to-br from-muted/50 via-background to-primary/5 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-2xl tracking-tight">
                  Configuração inicial
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {canManageModules
                    ? "Duas etapas rápidas: identidade visual e módulos ativos."
                    : "Identidade visual do abrigo (nome e logo)."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue="brand" className="w-full">
              <TabsList
                className={cn(
                  "grid w-full gap-1 rounded-xl bg-muted p-1.5 h-auto",
                  canManageModules ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                <TabsTrigger
                  value="brand"
                  className="rounded-lg py-2.5 data-[state=active]:shadow-sm"
                >
                  Marca & logo
                </TabsTrigger>
                {canManageModules ? (
                  <TabsTrigger
                    value="modules"
                    className="rounded-lg py-2.5 data-[state=active]:shadow-sm"
                  >
                    Módulos
                    {selectedCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 min-w-[1.25rem] px-1.5 tabular-nums"
                      >
                        {selectedCount}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent
                value="brand"
                className="mt-6 space-y-6 outline-none"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contract_code">
                      Código do contrato (opcional)
                    </Label>
                    <Input
                      id="contract_code"
                      value={contractCode}
                      onChange={(e) => setContractCode(e.target.value)}
                      placeholder="Se tiver, cole aqui"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      Se deixar vazio, você pode usar em modo de visualização.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-28 w-28 rounded-2xl border-2 border-dashed border-border bg-card shadow-inner">
                      {logoUrl ? (
                        <FadeInAvatarImage
                          src={logoUrl || ""}
                          alt="Logo do abrigo"
                          className="object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={uploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingLogo
                        ? logoUploadPhase === "storing"
                          ? "Gravando no R2…"
                          : "Enviando…"
                        : "Enviar imagem"}
                    </Button>
                    {uploadingLogo ? (
                      <div
                        className="w-full max-w-[14rem] space-y-2 rounded-xl border border-border/80 bg-muted/50 px-3 py-2.5 text-left shadow-inner"
                        role="status"
                        aria-live="polite"
                      >
                        <p className="text-xs font-medium text-foreground leading-snug">
                          {logoUploadPhase === "storing"
                            ? "Gravando no armazenamento (Cloudflare R2)…"
                            : logoUploadPercent != null
                              ? `Enviando para o servidor… ${logoUploadPercent}%`
                              : "Enviando para o servidor…"}
                        </p>
                        {logoUploadPhase === "sending" &&
                        logoUploadPercent != null ? (
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
                              style={{ width: `${logoUploadPercent}%` }}
                            />
                          </div>
                        ) : logoUploadPhase === "storing" ? (
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full w-full animate-pulse rounded-full bg-primary/55" />
                          </div>
                        ) : (
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/50" />
                          </div>
                        )}
                      </div>
                    ) : null}
                    <p className="max-w-[12rem] text-center text-xs text-muted-foreground">
                      PNG, JPG, WebP ou GIF, até 2 MB. Armazenado no R2 e
                      exibido no menu e no login.
                    </p>
                  </div>

                  <div className="w-full flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand-name">Nome do abrigo</Label>
                      <Input
                        id="brand-name"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Ex.: Abrigo São José"
                        className="h-11 text-base"
                        autoComplete="organization"
                      />
                      <p className="text-xs text-muted-foreground">
                        Este nome é exibido para sua equipe em telas internas.
                      </p>
                    </div>

                    <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ImagePlus className="h-4 w-4 text-primary" />
                        Dica
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        Use logo horizontal ou quadrado com bom contraste; evite
                        textos muito pequenos na imagem.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="modules"
                className="mt-6 space-y-4 outline-none"
              >
                <p className="text-sm text-muted-foreground">
                  Marque apenas o que for usar agora — os demais podem ser
                  ativados depois em{" "}
                  <span className="font-medium text-foreground">
                    Painel administrativo → Config
                  </span>
                  .
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {MODULES.map((m) => {
                    const Icon = m.icon;
                    const isOn = enabled.has(m.key);
                    return (
                      <Tooltip key={m.key}>
                        <TooltipTrigger asChild>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggle(m.key)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggle(m.key);
                              }
                            }}
                            className={cn(
                              "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-all outline-none",
                              "hover:border-primary/35 hover:bg-accent/50",
                              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              isOn
                                ? "border-primary/45 bg-accent/60 shadow-sm ring-1 ring-primary/20"
                                : "border-border bg-card",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                                isOn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                              )}
                            >
                              <Icon className="h-5 w-5" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium leading-tight">
                                  {m.label}
                                </span>
                                <span
                                  className="inline-flex"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={isOn}
                                    onCheckedChange={() => toggle(m.key)}
                                    className="shrink-0 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                    aria-label={`Ativar ${m.label}`}
                                  />
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                                {m.hint}
                              </p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          {m.hint}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-8" />

            <Accordion
              type="single"
              collapsible
              className="w-full rounded-lg border bg-muted/30"
            >
              <AccordionItem value="json" className="border-0 px-4">
                <AccordionTrigger className="text-sm font-medium text-muted-foreground hover:no-underline py-4">
                  Prévia técnica (JSON enviado ao servidor)
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-48 overflow-auto rounded-lg border bg-background p-3 text-xs leading-relaxed">
                    {canManageModules
                      ? jsonPreview
                      : JSON.stringify(
                          {
                            branding: {
                              brandName: brandName.trim() || null,
                              hasLogo: Boolean(logoUrl),
                            },
                          },
                          null,
                          2,
                        )}
                  </pre>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Informativo para suporte; a validação final é no backend.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {canManageModules ? (
                  <Badge variant="outline" className="font-normal">
                    {selectedCount} módulo{selectedCount === 1 ? "" : "s"} ativo
                    {selectedCount === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <span className="text-xs sm:text-sm">
                    Módulos do menu: definidos pelo administrador
                  </span>
                )}
                {brandName.trim() ? (
                  <span className="hidden sm:inline">
                    Nome:{" "}
                    <span className="font-medium text-foreground">
                      {brandName.trim()}
                    </span>
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={saving}
                      className="text-muted-foreground"
                    >
                      Cadastrar depois
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Continuar sem configurar o abrigo?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-left leading-relaxed">
                        Você pode continuar em{" "}
                        <strong>modo de visualização</strong> e concluir a
                        configuração mais tarde em Administração.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          confirmSkipOnboarding();
                        }}
                      >
                        Entendi, continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Desfazer
                </Button>
                <Button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="min-w-[160px] gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Salvar configuração
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
