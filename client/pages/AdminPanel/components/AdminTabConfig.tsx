import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { CONFIG_KEYS, CONFIG_SELECT_KEYS } from "../hooks/useAdminConfig";
import {
  createTenantSetor,
  listTenantSetores,
  updateTenantBranding,
  updateTenantConfig,
  forceTenantPriceBackfill,
  getTenantPriceBackfillStatus,
  uploadTenantLogoWithProgress,
  type TenantSetorRow,
} from "@/api/requests";
import { getEnabledSectors } from "@/helpers/tenant-sectors.helper";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { Blocks, Loader2, Plus, Upload } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeInAvatarImage } from "@/components/FadeInAvatarImage";
import { cn } from "@/lib/utils";
import {
  appendLogoCacheBust,
  appendLogoRevision,
  buildTenantLogoProxyUrl,
} from "@/helpers/tenant-r2-logo-url.helper";
import { inferSetorKeyFromNome } from "@/helpers/setor-key.helper";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODULE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "residents", label: "Residentes" },
  { key: "medicines", label: "Medicamentos" },
  { key: "inputs", label: "Insumos" },
  { key: "stock", label: "Estoque" },
  { key: "cabinets", label: "Armários" },
  { key: "drawers", label: "Gavetas" },
  { key: "reports", label: "Relatórios" },
  { key: "notifications", label: "Notificações" },
  { key: "profile", label: "Perfil (conta e senha)" },
  { key: "admin", label: "Painel administrativo" },
];

interface AdminTabConfigProps {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  saving: boolean;
  onSave: () => void;
}

export function AdminTabConfig({
  form,
  setForm,
  loading,
  saving,
  onSave,
}: AdminTabConfigProps) {
  const { modules, tenant, refetch: refetchTenant } = useTenant();
  const [moduleEnabled, setModuleEnabled] = useState<Set<string>>(
    () => new Set(),
  );
  const [savingModules, setSavingModules] = useState(false);
  const [autoPriceSearch, setAutoPriceSearch] = useState(true);
  const [autoReposicaoNotifications, setAutoReposicaoNotifications] =
    useState(true);
  const [enabledSectors, setEnabledSectors] = useState<Set<string>>(
    () => new Set(["farmacia", "enfermagem"]),
  );
  const [sectorCatalog, setSectorCatalog] = useState<TenantSetorRow[]>([]);
  const [newSectorNome, setNewSectorNome] = useState("");
  const [newSectorProfile, setNewSectorProfile] = useState<
    "farmacia" | "enfermagem"
  >("farmacia");
  const [creatingSector, setCreatingSector] = useState(false);
  const [forcePriceBackfillLoading, setForcePriceBackfillLoading] =
    useState(false);
  const [priceBackfillRunning, setPriceBackfillRunning] = useState(false);
  const [priceBackfillQueueLength, setPriceBackfillQueueLength] = useState(0);
  const priceBackfillPollRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const previewSectorKey = useMemo(
    () => inferSetorKeyFromNome(newSectorNome),
    [newSectorNome],
  );

  const loadSectorCatalog = useCallback(async () => {
    try {
      const res = await listTenantSetores();
      setSectorCatalog(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSectorCatalog([]);
    }
  }, []);

  useEffect(() => {
    void loadSectorCatalog();
  }, [loadSectorCatalog]);

  const stopPriceBackfillPolling = useCallback(() => {
    if (priceBackfillPollRef.current) {
      clearInterval(priceBackfillPollRef.current);
      priceBackfillPollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPriceBackfillPolling();
    };
  }, [stopPriceBackfillPolling]);

  useEffect(() => {
    void (async () => {
      try {
        const s = await getTenantPriceBackfillStatus();
        setPriceBackfillRunning(s.running);
        setPriceBackfillQueueLength(Number(s.queueLength ?? 0));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const pollPriceBackfillOnce = useCallback(
    async (acceptedAtMs: number): Promise<boolean> => {
      try {
        const s = await getTenantPriceBackfillStatus();
        setPriceBackfillRunning(s.running);
        setPriceBackfillQueueLength(Number(s.queueLength ?? 0));
        const last = s.last;
        if (!s.running && last && last.finishedAtMs >= acceptedAtMs) {
          stopPriceBackfillPolling();
          setPriceBackfillRunning(false);
          const n = last.processed ?? 0;
          if (last.ok) {
            toast({
              title: "Busca de preços concluída",
              description:
                n > 0
                  ? `Foram analisados ${n} item(ns) sem preço nesta rodada (até o limite do servidor).`
                  : "Nada para processar nesta rodada ou limite já atingido.",
              variant: "success",
              duration: 7000,
            });
          } else {
            toast({
              title: "Busca de preços terminou com erro",
              description:
                last.error ??
                "Não foi possível concluir. Pode tentar novamente após o período de espera.",
              variant: "error",
              duration: 8000,
            });
          }
          return true;
        }
      } catch {
        /* polling falhou — tenta no próximo intervalo */
      }
      return false;
    },
    [stopPriceBackfillPolling],
  );

  const startPriceBackfillPolling = useCallback(
    (acceptedAtMs: number) => {
      stopPriceBackfillPolling();
      void pollPriceBackfillOnce(acceptedAtMs);
      priceBackfillPollRef.current = setInterval(() => {
        void pollPriceBackfillOnce(acceptedAtMs);
      }, 3000);
    },
    [stopPriceBackfillPolling, pollPriceBackfillOnce],
  );

  useEffect(() => {
    setModuleEnabled(new Set(modules?.enabled ?? []));
  }, [modules]);

  useEffect(() => {
    setEnabledSectors(new Set(getEnabledSectors(modules ?? null)));
  }, [modules]);

  useEffect(() => {
    setAutoPriceSearch(modules?.automatic_price_search !== false);
    setAutoReposicaoNotifications(
      modules?.automatic_reposicao_notifications !== false,
    );
  }, [modules]);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [brandVisualName, setBrandVisualName] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    setBrandVisualName(String(tenant?.brandName ?? tenant?.name ?? "").trim());
  }, [tenant?.brandName, tenant?.name]);

  useEffect(() => {
    const serverLogo = tenant?.logoUrl?.trim() || null;
    const slug = tenant?.slug?.trim();
    const rev = tenant?.brandingUpdatedAt;
    if (!serverLogo) {
      setLogoPreviewUrl(null);
      return;
    }
    const proxy = slug ? buildTenantLogoProxyUrl(slug) : "";
    if (proxy) {
      setLogoPreviewUrl(
        rev ? appendLogoRevision(proxy, rev) : appendLogoCacheBust(proxy),
      );
    } else {
      setLogoPreviewUrl(
        rev
          ? appendLogoRevision(serverLogo, rev)
          : appendLogoCacheBust(serverLogo),
      );
    }
  }, [tenant?.logoUrl, tenant?.slug, tenant?.brandingUpdatedAt]);

  const toggleModule = useCallback((key: string) => {
    setModuleEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSector = useCallback((key: string) => {
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
  }, []);

  const handleCreateSector = async () => {
    const nome = newSectorNome.trim();
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do setor (ex.: Psicologia).",
        variant: "error",
      });
      return;
    }
    const key = inferSetorKeyFromNome(nome);
    setCreatingSector(true);
    try {
      await createTenantSetor({
        nome,
        proportionProfile: newSectorProfile,
      });
      setNewSectorNome("");
      await loadSectorCatalog();
      setEnabledSectors((prev) => new Set(prev).add(key));
      toast({
        title: "Setor criado",
        description: "Pode habilitá-lo abaixo e guardar os módulos.",
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Não foi possível criar o setor",
        description: getErrorMessage(
          err,
          "Tente outro nome ou contacte o suporte.",
          "AdminTabConfig:createSector",
        ),
        variant: "error",
      });
    } finally {
      setCreatingSector(false);
    }
  };

  const handleForcePriceBackfill = async () => {
    setForcePriceBackfillLoading(true);
    try {
      const res = await forceTenantPriceBackfill();
      if (res?.accepted && typeof res.acceptedAtMs === "number") {
        toast({
          title: "Busca adicionada à fila",
          description:
            res.message ??
            "Pedido colocado na fila. Pode continuar a usar o sistema — avisamos aqui quando terminar.",
          variant: "success",
          duration: 7000,
        });
        setPriceBackfillRunning(true);
        startPriceBackfillPolling(res.acceptedAtMs);
      }
    } catch (err: unknown) {
      toast({
        title: "Não foi possível iniciar",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "AdminTabConfig:priceBackfill",
        ),
        variant: "error",
        duration: 6000,
      });
    } finally {
      setForcePriceBackfillLoading(false);
    }
  };

  const saveModules = async () => {
    if (moduleEnabled.size === 0) {
      toast({
        title: "Selecione ao menos um módulo",
        variant: "error",
      });
      return;
    }
    if (enabledSectors.size === 0) {
      toast({
        title: "Selecione ao menos um setor",
        description: "Marque ao menos um setor do catálogo!",
        variant: "error",
      });
      return;
    }
    setSavingModules(true);
    try {
      await updateTenantConfig({
        enabled: Array.from(moduleEnabled),
        automatic_price_search: autoPriceSearch,
        automatic_reposicao_notifications: autoReposicaoNotifications,
        enabled_sectors: Array.from(enabledSectors),
      });
      await refetchTenant();
      toast({
        title: "Módulos atualizados",
        description: "O menu e os atalhos já refletem as áreas ativadas.",
        variant: "success",
      });
    } catch (err: unknown) {
      await refetchTenant();
      toast({
        title: "Não foi possível salvar os módulos",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "AdminTabConfig:saveModules",
        ),
        variant: "error",
      });
    } finally {
      setSavingModules(false);
    }
  };

  const brandingInitials = (() => {
    const n =
      brandVisualName.trim() || String(tenant?.name ?? "").trim() || "A";
    return n
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  })();

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadingLogo(true);
    try {
      const bnForUpload =
        brandVisualName.trim() ||
        String(tenant?.brandName ?? "").trim() ||
        String(tenant?.name ?? "").trim() ||
        "logo";
      const { logoUrl } = await uploadTenantLogoWithProgress(file, bnForUpload);
      const brandingRes = await updateTenantBranding({
        brandName: brandVisualName.trim() || null,
        logoUrl,
      });
      const rev = brandingRes.tenant?.brandingUpdatedAt;
      const slug = tenant?.slug?.trim();
      const proxy = slug ? buildTenantLogoProxyUrl(slug) : "";
      if (proxy) {
        setLogoPreviewUrl(
          rev ? appendLogoRevision(proxy, rev) : appendLogoCacheBust(proxy),
        );
      } else {
        setLogoPreviewUrl(
          rev ? appendLogoRevision(logoUrl, rev) : appendLogoCacheBust(logoUrl),
        );
      }
      await refetchTenant();
      toast({
        title: "Logo atualizado",
        description: "O novo logo foi guardado e já aparece para a sua equipe.",
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Não foi possível enviar o logo",
        description: getErrorMessage(
          err,
          "Verifique a sua ligação à internet e tente novamente. Se o problema continuar, contacte o suporte.",
          "AdminTabConfig:logoUpload",
        ),
        variant: "error",
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const saveBrandingNameOnly = async () => {
    setSavingBranding(true);
    try {
      await updateTenantBranding({
        brandName: brandVisualName.trim() || null,
      });
      await refetchTenant();
      toast({
        title: "Nome da marca atualizado",
        description: "O nome exibido para a equipe foi salvo.",
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Não foi possível salvar",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "AdminTabConfig:brandingName",
        ),
        variant: "error",
      });
    } finally {
      setSavingBranding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start gap-2">
            <Blocks className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <CardTitle>Módulos do sistema</CardTitle>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Define quais áreas aparecem no menu para os usuários deste
                abrigo. Quem faz cadastro como usuário comum não altera esta
                lista — apenas administradores do painel. O menu{" "}
                <span className="font-medium text-foreground">
                  só atualiza após Salvar módulos
                </span>
                .
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULE_OPTIONS.map((m) => {
              const on = moduleEnabled.has(m.key);
              return (
                <label
                  key={m.key}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                    on ? "border-primary/40 bg-primary/5" : "hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={on}
                    onCheckedChange={() => toggleModule(m.key)}
                    aria-label={m.label}
                  />
                  <span className="text-sm font-medium leading-tight">
                    {m.label}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="rounded-lg border p-4 space-y-3 bg-muted/15">
            <p className="text-sm font-medium text-foreground">
              Setores de estoque
            </p>
            <p className="text-xs text-muted-foreground">
              O catálogo vem do servidor (farmácia e enfermagem por defeito).
              Pode criar setores adicionais; o painel mostra proporção só para
              os marcados (mantenha pelo menos um).
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(sectorCatalog.length
                ? [...sectorCatalog].sort(
                    (a, b) => a.sort_order - b.sort_order || a.id - b.id,
                  )
                : [
                    {
                      id: 0,
                      tenant_id: 0,
                      key: "farmacia",
                      nome: "Farmácia",
                      proportion_profile: "farmacia",
                      sort_order: 0,
                      active: true,
                    },
                    {
                      id: 0,
                      tenant_id: 0,
                      key: "enfermagem",
                      nome: "Enfermagem",
                      proportion_profile: "enfermagem",
                      sort_order: 1,
                      active: true,
                    },
                  ]
              ).map((row) => (
                <label
                  key={`${row.key}-${row.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm",
                    enabledSectors.has(row.key)
                      ? "border-primary/40 bg-primary/5"
                      : "border-border",
                  )}
                >
                  <Checkbox
                    checked={enabledSectors.has(row.key)}
                    disabled={
                      enabledSectors.has(row.key) && enabledSectors.size === 1
                    }
                    onCheckedChange={() => toggleSector(row.key)}
                    aria-label={`Setor ${row.nome}`}
                  />
                  <span className="leading-tight">
                    {row.nome}
                    <span className="block text-[10px] text-muted-foreground font-normal">
                      {row.key} · {row.proportion_profile}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="rounded-md border border-dashed p-3 space-y-2 bg-background/50">
              <p className="text-xs font-medium text-foreground">
                Novo setor (só o nome)
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                A chave técnica é gerada automaticamente: minúsculas,
                snake_case, sem acentos (ex.: «Farmácia» →{" "}
                <span className="font-mono">farmacia</span>; «Carrinho de
                emergência» →{" "}
                <span className="font-mono">carrinho_de_emergencia</span>).
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={newSectorNome}
                    onChange={(e) => setNewSectorNome(e.target.value)}
                    placeholder="Ex.: Psicologia ou Carrinho de emergência"
                    className="h-9"
                  />
                  {newSectorNome.trim() ? (
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Chave: {previewSectorKey}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1 w-full sm:w-40">
                  <Label className="text-xs">Perfil gráficos</Label>
                  <Select
                    value={newSectorProfile}
                    onValueChange={(v) =>
                      setNewSectorProfile(v as "farmacia" | "enfermagem")
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmacia">Farmácia</SelectItem>
                      <SelectItem value="enfermagem">Enfermagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  disabled={creatingSector || !newSectorNome.trim()}
                  onClick={() => void handleCreateSector()}
                >
                  {creatingSector ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="ml-1">Criar</span>
                </Button>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
            <p className="text-sm font-medium text-foreground">
              Automações do abrigo
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 flex-1">
                <Label htmlFor="auto-price-search" className="text-sm">
                  Busca automática de preços
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ao cadastrar medicamento ou insumo, o sistema pode consultar
                  preço de referência em segundo plano.
                </p>
              </div>
              <Switch
                id="auto-price-search"
                checked={autoPriceSearch}
                onCheckedChange={setAutoPriceSearch}
                aria-label="Busca automática de preços"
              />
            </div>
            <div className="rounded-md border border-dashed border-border/80 bg-background/50 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Forçar busca retroativa agora
                </p>
                <p className="text-xs text-muted-foreground">
                  Procura medicamentos e insumos sem preço e tenta preencher a
                  referência em segundo plano (como a busca automática). Só
                  funciona se o serviço de preços estiver ativo para o seu
                  ambiente. Entre uma execução e outra há um tempo de espera por
                  abrigo para não sobrecarregar o sistema.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={forcePriceBackfillLoading}
                onClick={() => void handleForcePriceBackfill()}
              >
                {forcePriceBackfillLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />A iniciar…
                  </>
                ) : priceBackfillRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Em fila/execução…
                  </>
                ) : (
                  "Forçar busca de preços"
                )}
              </Button>
            </div>
            {priceBackfillRunning || priceBackfillQueueLength > 0 ? (
              <p className="text-xs text-muted-foreground">
                {priceBackfillRunning ? "Em execução" : "Aguardando execução"} •{" "}
                {priceBackfillQueueLength} na fila
              </p>
            ) : null}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 flex-1">
                <Label htmlFor="auto-reposicao" className="text-sm">
                  Notificações automáticas de reposição
                </Label>
                <p className="text-xs text-muted-foreground">
                  O agendamento cria avisos de reposição com base no estoque e
                  nos dias para repor.
                </p>
              </div>
              <Switch
                id="auto-reposicao"
                checked={autoReposicaoNotifications}
                onCheckedChange={setAutoReposicaoNotifications}
                aria-label="Notificações automáticas de reposição"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={saveModules}
            disabled={savingModules}
            variant="secondary"
          >
            {savingModules ? "Salvando módulos..." : "Salvar módulos"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo e nome da marca</CardTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">
            Altere o que aparece no menu, no login e nas telas de carregamento.
            Ao enviar um ficheiro novo, as versões antigas do logo deixam de ser
            usadas automaticamente — não precisa de apagar manualmente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Avatar className="h-24 w-24 rounded-xl border border-border bg-muted/40">
                {logoPreviewUrl ? (
                  <FadeInAvatarImage
                    src={logoPreviewUrl}
                    alt="Logo do abrigo"
                    className="object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback className="rounded-xl text-sm font-semibold">
                  {brandingInitials}
                </AvatarFallback>
              </Avatar>
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingLogo}
                onClick={() => logoFileInputRef.current?.click()}
              >
                {uploadingLogo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploadingLogo ? "Enviando…" : "Enviar novo logo"}
              </Button>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="grid gap-2 max-w-md">
                <Label htmlFor="admin-brand-visual-name">
                  Nome exibido (marca)
                </Label>
                <Input
                  id="admin-brand-visual-name"
                  value={brandVisualName}
                  onChange={(e) => setBrandVisualName(e.target.value)}
                  placeholder="Ex.: Abrigo São José"
                  maxLength={160}
                  autoComplete="organization"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={
                    savingBranding ||
                    String(tenant?.brandName ?? "").trim() ===
                      brandVisualName.trim()
                  }
                  onClick={saveBrandingNameOnly}
                >
                  {savingBranding ? "Salvando…" : "Salvar só o nome"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg">
                PNG, JPEG, WebP ou GIF até 2 MB. Depois do envio, use{" "}
                <span className="font-medium text-foreground">
                  Salvar só o nome
                </span>{" "}
                se alterou apenas o texto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do sistema</CardTitle>
          <p className="text-sm text-muted-foreground">
            Parâmetros editáveis pelo administrador. Alguns são usados no
            dashboard e relatórios (ex.: dias para próximo ao vencimento).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : (
            <>
              {Object.entries(CONFIG_KEYS).map(([key, label]) => {
                const selectOptions =
                  CONFIG_SELECT_KEYS[key as keyof typeof CONFIG_SELECT_KEYS];
                if (selectOptions) {
                  return (
                    <div key={key} className="grid gap-2 max-w-md">
                      <Label htmlFor={key}>{label}</Label>
                      <Select
                        value={form[key] ?? selectOptions[0]?.value ?? ""}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, [key]: v }))
                        }
                      >
                        <SelectTrigger id={key} className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return (
                  <div key={key} className="grid gap-2 max-w-sm">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type={
                        key === "expiring_days" ||
                        key === "estoque_minimo_padrao"
                          ? "number"
                          : "text"
                      }
                      min={key === "expiring_days" ? 1 : undefined}
                      max={key === "expiring_days" ? 365 : undefined}
                      value={form[key] ?? ""}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [key]: e.target.value }))
                      }
                    />
                  </div>
                );
              })}
              <Button onClick={onSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar configurações"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
