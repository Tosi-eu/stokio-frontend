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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateTenantBranding, updateTenantConfig } from "@/api/requests";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { cn } from "@/lib/utils";
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
  const { modules, tenant, loading } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManageModules =
    user?.role === "admin" || Boolean(user?.isSuperAdmin);

  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [brandName, setBrandName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    setEnabled(new Set(modules?.enabled ?? []));
    setBrandName(tenant?.brandName ?? tenant?.name ?? "");
    setLogoDataUrl(tenant?.logoDataUrl ?? null);
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400_000) {
      toast({
        title: "Imagem muito grande",
        description: "Use uma imagem menor (até ~400 KB).",
        variant: "error",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const v = typeof reader.result === "string" ? reader.result : null;
      setLogoDataUrl(v);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resetForm = () => {
    setEnabled(new Set(modules?.enabled ?? []));
    setBrandName(tenant?.brandName ?? tenant?.name ?? "");
    setLogoDataUrl(tenant?.logoDataUrl ?? null);
  };

  const save = async () => {
    if (canManageModules && enabled.size === 0) {
      toast({
        title: "Selecione ao menos um módulo",
        variant: "error",
      });
      return;
    }
    if (!brandName.trim() && !logoDataUrl) {
      toast({
        title: "Informe o nome da marca ou envie um logo",
        variant: "error",
      });
      return;
    }
    setSaving(true);
    try {
      await updateTenantBranding({
        brandName: brandName.trim() || null,
        logoDataUrl,
      });
      if (canManageModules) {
        await updateTenantConfig({ enabled: Array.from(enabled) });
      }
      toast({
        title: "Configuração salva",
        description:
          "Faça login novamente: escolha seu abrigo e entre com e-mail e senha.",
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
        <Alert className="border-sky-200/80 bg-gradient-to-r from-sky-50/90 to-background shadow-sm">
          <Sparkles className="h-4 w-4 text-sky-600" />
          <AlertTitle className="text-sky-950">
            Bem-vindo — configure seu abrigo
          </AlertTitle>
          <AlertDescription className="text-slate-600 leading-relaxed">
            {canManageModules
              ? "Defina como o sistema aparece para sua equipe (nome e logo) e quais áreas ficam disponíveis no menu. Você pode alterar isso depois no painel administrativo."
              : "Defina o nome e o logo do abrigo. Quais módulos aparecem no menu são definidos pelo administrador do painel — não é possível alterar aqui."}
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-slate-200/80 shadow-lg shadow-slate-200/40">
          <CardHeader className="space-y-2 border-b bg-gradient-to-br from-slate-50 via-white to-sky-50/30 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/25">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-2xl tracking-tight">
                  Configuração inicial
                </CardTitle>
                <CardDescription className="text-base text-slate-600">
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
                  "grid w-full gap-1 rounded-xl bg-slate-100/90 p-1.5 h-auto",
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
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-28 w-28 rounded-2xl border-2 border-dashed border-slate-200 bg-white shadow-inner">
                      {logoDataUrl ? (
                        <AvatarImage
                          src={logoDataUrl}
                          alt="Logo do abrigo"
                          className="object-contain p-2"
                        />
                      ) : null}
                      <AvatarFallback className="rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
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
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Enviar imagem
                    </Button>
                    <p className="max-w-[12rem] text-center text-xs text-muted-foreground">
                      PNG ou JPG, até ~400 KB. Aparece no menu e no login.
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

                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ImagePlus className="h-4 w-4 text-sky-600" />
                        Dica
                      </div>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
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
                              "hover:border-sky-300/80 hover:bg-sky-50/40",
                              "focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2",
                              isOn
                                ? "border-sky-400/70 bg-sky-50/50 shadow-sm ring-1 ring-sky-200/60"
                                : "border-slate-200 bg-card",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                                isOn
                                  ? "bg-sky-600 text-white"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
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
                                    className="shrink-0 data-[state=checked]:border-sky-600 data-[state=checked]:bg-sky-600"
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
                              hasLogo: Boolean(logoDataUrl),
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
                  className="min-w-[160px] gap-2 bg-sky-600 hover:bg-sky-700"
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
