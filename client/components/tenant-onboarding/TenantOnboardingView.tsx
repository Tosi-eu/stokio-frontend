"use client";

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
import { tenantImportTotalForKey } from "@/api/requests";
import { cn } from "@/lib/utils";
import { sanitizeUserFacingMessage } from "@/helpers/user-facing-error.helper";
import { TENANT_ONBOARDING_MODULES } from "@/components/tenant-onboarding/tenant-onboarding.constants";
import type { TenantOnboardingPageVm } from "@/hooks/useTenantOnboardingPage";
import {
  Check,
  ImagePlus,
  ListChecks,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { TenantOnboardingAside } from "@/components/tenant-onboarding/TenantOnboardingAside";
import { PageLabel } from "@/components/page/PageLabel";

export function TenantOnboardingView({ vm }: { vm: TenantOnboardingPageVm }) {
  const {
    canManageModules,
    confirmSkipOnboarding,
    completePreviewConfiguration,
    previewMode,
    tenantId,
    tenant,
    selectedCount,
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
    toggle,
    enabled,
    sectorUiRows,
    toggleSector,
    enabledSectors,
    jsonPreview,
    resetForm,
    save,
    logoUrl,
  } = vm;

  return (
    <Layout minimal>
      <div className="relative mx-auto max-w-6xl space-y-8 px-2 sm:px-4">
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <TenantOnboardingAside
            className="order-2 lg:order-1"
            canManageModules={canManageModules}
          />

          <div className="order-1 min-w-0 space-y-6 lg:order-2 lg:max-w-3xl lg:justify-self-end xl:max-w-[40rem]">
            <PageLabel>Configuração inicial</PageLabel>
        <Alert className="border-primary/25 bg-gradient-to-r from-primary/5 to-background shadow-sm">
          <ListChecks className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">
            Bem-vindo — configure seu abrigo
          </AlertTitle>
          <AlertDescription className="text-muted-foreground leading-relaxed">
            {canManageModules
              ? "Defina como o sistema aparece para sua equipe (nome e logo) e quais áreas ficam disponíveis no menu. Você pode alterar isso depois no painel administrativo."
              : "Defina o nome e o logo do abrigo. Quais módulos aparecem no menu são definidos pelo administrador do painel — não é possível alterar aqui."}
          </AlertDescription>
        </Alert>

        {previewMode ? (
          <Alert className="border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTitle>Modo demonstração</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="leading-relaxed">
                Enquanto estiver em modo demonstração, o logo não é enviado.
                Para escolher imagem, validar o contrato e guardar o logo,
                conclua a configuração por completo.
              </span>
              {tenantId != null ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onClick={completePreviewConfiguration}
                >
                  Concluir configuração
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden border-border shadow-lg shadow-elevated">
          <CardHeader className="space-y-2 border-b bg-gradient-to-br from-muted/50 via-background to-primary/5 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <ListChecks className="h-5 w-5" aria-hidden />
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
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="contract_code">
                      Código do contrato (para enviar o logo)
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <Input
                        id="contract_code"
                        value={contractCode}
                        onChange={(e) => {
                          setContractCode(e.target.value);
                          if (contractValidated) setContractValidated(false);
                          if (pendingLogoFile || localPreviewUrl) {
                            clearPendingLogo();
                          }
                        }}
                        placeholder="Cole o código fornecido pela Stokio"
                        autoComplete="off"
                        disabled={
                          previewMode || contractValidated || validatingContract
                        }
                        className="sm:max-w-md"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="default"
                        className="shrink-0"
                        disabled={
                          previewMode ||
                          validatingContract ||
                          !contractCode.trim() ||
                          !tenant?.slug?.trim()
                        }
                        onClick={() => void handleVerifyContract()}
                      >
                        {validatingContract ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Validando…
                          </>
                        ) : contractValidated ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Validado — pode escolher o logo
                          </>
                        ) : (
                          "Validar código"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {previewMode
                        ? "Saia do modo demonstração para validar o código e enviar o logo."
                        : "A escolha da imagem só é liberada após o código ser aceito. O envio da imagem só é feito quando você guardar esta página."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-28 w-28 rounded-2xl border-2 border-dashed border-border bg-card shadow-inner">
                      {avatarDisplaySrc ? (
                        <FadeInAvatarImage
                          src={avatarDisplaySrc}
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
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={
                          uploadingLogo ||
                          saving ||
                          previewMode ||
                          !contractValidated ||
                          validatingContract
                        }
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploadingLogo
                          ? logoUploadPhase === "storing"
                            ? "A guardar o logo…"
                            : "A enviar…"
                          : "Escolher imagem"}
                      </Button>
                      {pendingLogoFile ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground h-auto py-1"
                          disabled={saving || uploadingLogo}
                          onClick={clearPendingLogo}
                        >
                          Remover imagem escolhida
                        </Button>
                      ) : null}
                    </div>
                    {uploadingLogo ? (
                      <div
                        className="w-full max-w-[14rem] space-y-2 rounded-xl border border-border/80 bg-muted/50 px-3 py-2.5 text-left shadow-inner"
                        role="status"
                        aria-live="polite"
                      >
                        <p className="text-xs font-medium text-foreground leading-snug">
                          {logoUploadPhase === "storing"
                            ? "A finalizar o envio do logo…"
                            : logoUploadPercent != null
                              ? `A enviar o logo… ${logoUploadPercent}%`
                              : "A enviar o logo…"}
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
                    <p className="max-w-[14rem] text-center text-xs text-muted-foreground">
                      PNG, JPG, WebP ou GIF, até 2 MB. A pré-visualização é só
                      no seu dispositivo; o logo só é enviado quando guardar a
                      configuração.
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
                <Card className="border-border/70">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-primary" />
                      Importar dados por planilha
                    </CardTitle>
                    <CardDescription>
                      Se você já tem uma lista de itens, dá para trazer tudo de
                      uma vez. Linhas com erro não travam o restante.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={previewMode || importingXlsx}
                        onClick={() => void handleDownloadImportTemplate()}
                      >
                        Baixar template
                      </Button>
                      <input
                        ref={importFileInputRef}
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="sr-only"
                        onChange={handleImportXlsx}
                      />
                      <Button
                        type="button"
                        className="gap-2"
                        disabled={previewMode || importingXlsx || saving}
                        onClick={() => importFileInputRef.current?.click()}
                      >
                        {importingXlsx ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {importingXlsx ? "Importando…" : "Enviar planilha"}
                      </Button>
                    </div>

                    {previewMode ? (
                      <p className="text-xs text-muted-foreground">
                        No modo demonstração, a importação fica desabilitada.
                      </p>
                    ) : null}

                    {importResult ? (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                        <div className="flex flex-wrap gap-3">
                          <span>
                            <span className="font-medium">Criados:</span>{" "}
                            {tenantImportTotalForKey(
                              importResult.summary,
                              "created",
                            )}
                          </span>
                          <span>
                            <span className="font-medium">Atualizados:</span>{" "}
                            {tenantImportTotalForKey(
                              importResult.summary,
                              "updated",
                            )}
                          </span>
                          <span>
                            <span className="font-medium">Erros:</span>{" "}
                            {importResult.errors.length}
                          </span>
                        </div>
                        {importResult.errors.length > 0 ? (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {importResult.errors.slice(0, 5).map((e, idx) => (
                              <div key={`${e.sheet}:${e.row}:${idx}`}>
                                {e.sheet} — linha {e.row}
                                {e.field ? ` (${e.field})` : ""}:{" "}
                                {sanitizeUserFacingMessage(e.message)}
                              </div>
                            ))}
                            {importResult.errors.length > 5 ? (
                              <div>
                                … e mais {importResult.errors.length - 5}.
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <p className="text-sm text-muted-foreground">
                  Marque apenas o que for usar agora — os demais podem ser
                  ativados depois em{" "}
                  <span className="font-medium text-foreground">
                    Painel administrativo → Config
                  </span>
                  .
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TENANT_ONBOARDING_MODULES.map((m) => {
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

                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Setores de estoque
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Informe em quais setores o abrigo trabalha. Isso define
                      gráficos de proporção no painel e combina com as opções de
                      estoque. É necessário manter{" "}
                      <span className="font-medium text-foreground">
                        pelo menos um setor
                      </span>
                      .
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {sectorUiRows.map((s) => {
                      const Icon = s.icon;
                      const isOn = enabledSectors.has(s.key);
                      return (
                        <label
                          key={s.key}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                            isOn
                              ? "border-primary/40 bg-primary/5"
                              : "hover:bg-muted/40",
                          )}
                        >
                          <Checkbox
                            checked={isOn}
                            disabled={
                              isOn &&
                              enabledSectors.size === 1 &&
                              enabledSectors.has(s.key)
                            }
                            onCheckedChange={() => toggleSector(s.key)}
                            aria-label={s.label}
                          />
                          <Icon
                            className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5"
                            aria-hidden
                          />
                          <span className="text-sm">
                            <span className="font-medium block">{s.label}</span>
                            <span className="text-xs text-muted-foreground leading-snug">
                              {s.hint}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
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
                  Prévia técnica (JSON — suporte)
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="max-h-48 overflow-auto rounded-lg border bg-background p-3 text-xs leading-relaxed">
                    {canManageModules
                      ? jsonPreview
                      : JSON.stringify(
                          {
                            branding: {
                              brandName: brandName.trim() || null,
                              hasLogo:
                                Boolean(pendingLogoFile) || Boolean(logoUrl),
                              logoPendingUpload: Boolean(pendingLogoFile),
                            },
                          },
                          null,
                          2,
                        )}
                  </pre>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Informativo para suporte; ao guardar, o sistema aplica a
                    validação definitiva automaticamente.
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
                  variant="ghost"
                  disabled={saving}
                  className="text-muted-foreground"
                  onClick={() => confirmSkipOnboarding()}
                >
                  Cadastrar depois
                </Button>
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
        </div>
      </div>
    </Layout>
  );
}
