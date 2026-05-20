import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONFIG_KEYS, CONFIG_SELECT_KEYS } from "../hooks/useAdminConfig";
import {
  createTenantSetor,
  getTenantSetorStockTypes,
  listTenantSetores,
  updateTenantBranding,
  updateTenantConfig,
  updateTenantSetorStockTypes,
  forceTenantPriceBackfill,
  getTenantPriceBackfillStatus,
  uploadTenantLogoWithProgress,
  type TenantSetorRow,
} from "@/api/requests";
import {
  getEnabledSectors,
  tenantEnabledKeysForConfigPatch,
} from "@/helpers/tenant-sectors.helper";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { Loader2, Plus, Upload, Warehouse } from "lucide-react";
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
import { ItemStockType, StockTypeLabels } from "@/utils/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminTabConfigProps } from "./admin-tab-config/admin-tab-config.types";

export function AdminTabConfig({
  form,
  setForm,
  loading,
  saving,
  onSave,
  isSuperAdmin: _isSuperAdmin,
  scheduledBackup: _scheduledBackup,
  setScheduledBackup: _setScheduledBackup,
}: AdminTabConfigProps) {
  const { modules, tenant, refetch: refetchTenant } = useTenant();
  const [activeSubtab, setActiveSubtab] = useState<
    "geral" | "automacoes" | "sistema"
  >("geral");
  const [savingTenantFeatures, setSavingTenantFeatures] = useState(false);
  const [autoPriceSearch, setAutoPriceSearch] = useState(true);
  const [autoReposicaoNotifications, setAutoReposicaoNotifications] =
    useState(true);
  const [enabledSectors, setEnabledSectors] = useState<Set<string>>(
    () => new Set(["farmacia", "enfermagem"]),
  );
  const [sectorCatalog, setSectorCatalog] = useState<TenantSetorRow[]>([]);
  const [newSectorNome, setNewSectorNome] = useState("");
  const [newSectorProfile] = useState<"farmacia" | "enfermagem">("farmacia");
  const [creatingSector, setCreatingSector] = useState(false);
  const [sectorStockTypes, setSectorStockTypes] = useState<
    Record<number, Array<ItemStockType>>
  >({});
  const [loadingSectorStockTypes, setLoadingSectorStockTypes] = useState(false);
  const [savingSectorStockTypes, setSavingSectorStockTypes] = useState<
    Record<number, boolean>
  >({});
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

  const loadSectorStockTypes = useCallback(async () => {
    setLoadingSectorStockTypes(true);
    try {
      const list = sectorCatalog.filter((s) => Number(s.id) > 0);
      const results = await Promise.all(
        list.map(async (s) => {
          try {
            const res = await getTenantSetorStockTypes(s.id);
            return [s.id, res.stockTypes] as const;
          } catch {
            return [s.id, []] as const;
          }
        }),
      );
      const next: Record<number, Array<ItemStockType>> = {};
      for (const [id, types] of results) {
        next[id] = (types ?? []) as Array<ItemStockType>;
      }
      setSectorStockTypes(next);
    } finally {
      setLoadingSectorStockTypes(false);
    }
  }, [sectorCatalog]);

  useEffect(() => {
    void loadSectorCatalog();
  }, [loadSectorCatalog]);

  useEffect(() => {
    if (sectorCatalog.length > 0) void loadSectorStockTypes();
  }, [sectorCatalog, loadSectorStockTypes]);

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
        void 0;
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
        void 0;
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

  const enabledKeysForConfigPatch = useMemo(
    () => tenantEnabledKeysForConfigPatch(modules?.enabled),
    [modules?.enabled],
  );

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

      const merged = new Set(getEnabledSectors(modules ?? null));
      merged.add(key);

      setEnabledSectors(merged);
      await updateTenantConfig({
        enabled: enabledKeysForConfigPatch,
        automatic_price_search: autoPriceSearch,
        automatic_reposicao_notifications: autoReposicaoNotifications,
        enabled_sectors: Array.from(merged),
      });
      await refetchTenant();
      toast({
        title: "Setor criado",
        description:
          "O setor já está disponível nos filtros, formulários e relatórios.",
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

  const stockTypeOptions = useMemo(
    () =>
      Object.values(ItemStockType).map((value) => ({
        value,
        label: StockTypeLabels[value],
      })),
    [],
  );

  const toggleSectorStockType = useCallback(
    (setorId: number, stockType: ItemStockType) => {
      setSectorStockTypes((prev) => {
        const current = new Set(prev[setorId] ?? []);
        if (current.has(stockType)) current.delete(stockType);
        else current.add(stockType);
        return { ...prev, [setorId]: Array.from(current) };
      });
    },
    [],
  );

  const saveSectorStockTypes = useCallback(
    async (setorId: number) => {
      const types = sectorStockTypes[setorId] ?? [];
      if (types.length === 0) {
        toast({
          title: "Selecione ao menos um tipo",
          description:
            "O setor precisa ter pelo menos 1 tipo de estoque permitido.",
          variant: "error",
        });
        return;
      }
      setSavingSectorStockTypes((p) => ({ ...p, [setorId]: true }));
      try {
        const res = await updateTenantSetorStockTypes(setorId, types);
        setSectorStockTypes((p) => ({
          ...p,
          [setorId]: (res.stockTypes ?? []) as Array<ItemStockType>,
        }));
        toast({
          title: "Tipos atualizados",
          variant: "success",
        });
      } catch (err: unknown) {
        toast({
          title: "Não foi possível salvar",
          description: getErrorMessage(
            err,
            USER_FACING_RETRY_SHORT,
            "AdminTabConfig:setorStockTypes",
          ),
          variant: "error",
        });
      } finally {
        setSavingSectorStockTypes((p) => ({ ...p, [setorId]: false }));
      }
    },
    [sectorStockTypes],
  );

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

  const saveTenantFeatures = async () => {
    if (enabledSectors.size === 0) {
      toast({
        title: "Selecione ao menos um setor",
        description: "Marque ao menos um setor do catálogo!",
        variant: "error",
      });
      return;
    }
    setSavingTenantFeatures(true);
    try {
      await updateTenantConfig({
        enabled: enabledKeysForConfigPatch,
        automatic_price_search: autoPriceSearch,
        automatic_reposicao_notifications: autoReposicaoNotifications,
        enabled_sectors: Array.from(enabledSectors),
      });
      await refetchTenant();
      toast({
        title: "Configuração atualizada",
        description:
          "Setores e automações foram guardados. O menu do abrigo continua definido no Admin Desktop.",
        variant: "success",
      });
    } catch (err: unknown) {
      await refetchTenant();
      toast({
        title: "Não foi possível salvar",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "AdminTabConfig:saveTenantFeatures",
        ),
        variant: "error",
      });
    } finally {
      setSavingTenantFeatures(false);
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
      await uploadTenantLogoWithProgress(file, bnForUpload);
      const brandingRes = await updateTenantBranding({
        brandName: brandVisualName.trim() || null,
      });
      const rev = brandingRes.tenant?.brandingUpdatedAt;
      const slug = tenant?.slug?.trim();
      const proxy = slug ? buildTenantLogoProxyUrl(slug) : "";
      const persistedLogo = brandingRes.tenant?.logoUrl?.trim() || "";
      if (proxy) {
        setLogoPreviewUrl(
          rev ? appendLogoRevision(proxy, rev) : appendLogoCacheBust(proxy),
        );
      } else if (persistedLogo) {
        setLogoPreviewUrl(
          rev
            ? appendLogoRevision(persistedLogo, rev)
            : appendLogoCacheBust(persistedLogo),
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
      <Tabs
        value={activeSubtab}
        onValueChange={(v) =>
          setActiveSubtab(v as "geral" | "automacoes" | "sistema")
        }
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-2">
                <Warehouse className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <CardTitle>Setores de estoque e catálogo</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal mt-1">
                    Quais entradas aparecem no menu do abrigo são definidas na
                    aplicação{" "}
                    <span className="font-medium text-foreground">
                      Admin Desktop
                    </span>{" "}
                    (chave de API). Aqui você mantém os setores ativos, cria
                    setores adicionais e ajusta os tipos de estoque por setor.{" "}
                    <span className="font-medium text-foreground">
                      Use «Salvar setores e automações» (ou o separador
                      Automações)
                    </span>{" "}
                    para gravar alterações desta área.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/15">
                <p className="text-sm font-medium text-foreground">
                  Setores de estoque
                </p>
                <p className="text-xs text-muted-foreground">
                  O catálogo vem do servidor (farmácia e enfermagem por
                  defeito). Pode criar setores adicionais; o painel mostra
                  proporção só para os marcados (mantenha pelo menos um).
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
                          enabledSectors.has(row.key) &&
                          enabledSectors.size === 1
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

                <div className="rounded-md border p-3 space-y-3 bg-background">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Tipos de estoque por setor
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Controla quais opções aparecem em “Tipo de estoque” ao
                        dar entrada/editar itens para cada setor.
                      </p>
                    </div>
                    {loadingSectorStockTypes ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {[...sectorCatalog]
                      .filter((s) => Number(s.id) > 0)
                      .sort(
                        (a, b) => a.sort_order - b.sort_order || a.id - b.id,
                      )
                      .map((s) => {
                        const current = new Set(sectorStockTypes[s.id] ?? []);
                        const saving = Boolean(savingSectorStockTypes[s.id]);
                        return (
                          <div
                            key={`setor-stock-types-${s.id}`}
                            className="rounded-md border p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {s.nome}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">
                                  {s.key} · {s.proportion_profile}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={saving}
                                onClick={() => void saveSectorStockTypes(s.id)}
                              >
                                {saving ? "Salvando…" : "Salvar tipos"}
                              </Button>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                              {stockTypeOptions.map((opt) => (
                                <label
                                  key={`${s.id}-${opt.value}`}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm",
                                    current.has(opt.value)
                                      ? "border-primary/40 bg-primary/5"
                                      : "border-border",
                                  )}
                                >
                                  <Checkbox
                                    checked={current.has(opt.value)}
                                    onCheckedChange={() =>
                                      toggleSectorStockType(s.id, opt.value)
                                    }
                                    aria-label={`Tipo ${opt.label}`}
                                  />
                                  <span className="leading-tight">
                                    {opt.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void saveTenantFeatures()}
                disabled={savingTenantFeatures}
                variant="secondary"
              >
                {savingTenantFeatures
                  ? "Salvando…"
                  : "Salvar setores e automações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo e nome da marca</CardTitle>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Altere o que aparece no menu, no login e nas telas de
                carregamento. Ao enviar um ficheiro novo, as versões antigas do
                logo deixam de ser usadas automaticamente — não precisa de
                apagar manualmente.
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
        </TabsContent>

        <TabsContent value="automacoes" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automações do abrigo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ajuste tarefas automáticas (preço, reposição) e execute ações
                sob demanda.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    ambiente. Entre uma execução e outra há um tempo de espera
                    por abrigo para não sobrecarregar o sistema.
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
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />A
                      iniciar…
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
                  {priceBackfillRunning ? "Em execução" : "Aguardando execução"}{" "}
                  • {priceBackfillQueueLength} na fila
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
              <Button
                type="button"
                onClick={() => void saveTenantFeatures()}
                disabled={savingTenantFeatures}
                variant="secondary"
              >
                {savingTenantFeatures ? "Salvando…" : "Salvar automações"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="mt-6 space-y-6">
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
                      CONFIG_SELECT_KEYS[
                        key as keyof typeof CONFIG_SELECT_KEYS
                      ];
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
                          type={key === "expiring_days" ? "number" : "text"}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
