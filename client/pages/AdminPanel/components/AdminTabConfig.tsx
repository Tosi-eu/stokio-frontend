import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CONFIG_KEYS, CONFIG_SELECT_KEYS } from "../hooks/useAdminConfig";
import type { AdminHealthResponse } from "@/api/requests";
import {
  getAdminBackupStatus,
  restoreBackup,
  runAdminBackupNow,
  updateTenantBranding,
  updateTenantConfig,
  uploadTenantLogoWithProgress,
} from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";
import { LayoutGrid, Loader2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
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
  { key: "movements", label: "Movimentações" },
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
  health: AdminHealthResponse | null;
  onSave: () => void;
  refetchHealth?: () => Promise<void>;
}

function formatBackupDate(s: string | null): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

export function AdminTabConfig({
  form,
  setForm,
  loading,
  saving,
  health,
  onSave,
  refetchHealth,
}: AdminTabConfigProps) {
  const { modules, tenant, refetch: refetchTenant } = useTenant();
  const [moduleEnabled, setModuleEnabled] = useState<Set<string>>(
    () => new Set(),
  );
  const [savingModules, setSavingModules] = useState(false);

  useEffect(() => {
    setModuleEnabled(new Set(modules?.enabled ?? []));
  }, [modules]);

  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [brandVisualName, setBrandVisualName] = useState("");
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    setBrandVisualName(String(tenant?.brandName ?? tenant?.name ?? "").trim());
    setLogoPreviewUrl(tenant?.logoUrl ?? null);
  }, [tenant?.brandName, tenant?.name, tenant?.logoUrl]);
  const [backupStatusLoading, setBackupStatusLoading] = useState(false);
  const [backupRunLoading, setBackupRunLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{
    lastBackupAt: string | null;
    lastBackupStatus: string | null;
    lastBackupDurationMs: number | null;
    lastBackupSizeBytes: number | null;
    lastBackupError: string | null;
    retentionCount: number | null;
  } | null>(null);

  const refetchBackupStatus = async () => {
    setBackupStatusLoading(true);
    try {
      const res = await getAdminBackupStatus();
      setBackupStatus(res);
    } catch {
      setBackupStatus(null);
    } finally {
      setBackupStatusLoading(false);
    }
  };

  const handleRestoreBackup = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".sql") && !name.endsWith(".sql.gz")) {
      toast({
        title: "Arquivo inválido",
        description: "Use o dump gerado pelo backup (arquivo .sql ou .sql.gz).",
        variant: "error",
      });
      e.target.value = "";
      return;
    }
    setRestoreLoading(true);
    try {
      await restoreBackup(file);
      toast({
        title: "Backup restaurado",
        description: "O banco foi alimentado com o dump enviado.",
        variant: "success",
        duration: 5000,
      });
      await refetchHealth?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao restaurar backup.";
      toast({
        title: "Erro ao restaurar backup",
        description: message,
        variant: "error",
        duration: 5000,
      });
    } finally {
      setRestoreLoading(false);
      e.target.value = "";
    }
  };

  const toggleModule = useCallback((key: string) => {
    setModuleEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const saveModules = async () => {
    if (moduleEnabled.size === 0) {
      toast({
        title: "Selecione ao menos um módulo",
        variant: "error",
      });
      return;
    }
    setSavingModules(true);
    try {
      await updateTenantConfig({ enabled: Array.from(moduleEnabled) });
      await refetchTenant();
      toast({
        title: "Módulos atualizados",
        description: "O menu e os atalhos já refletem as áreas ativadas.",
        variant: "success",
      });
    } catch (err) {
      await refetchTenant();
      toast({
        title: "Não foi possível salvar os módulos",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
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
      await updateTenantBranding({
        brandName: brandVisualName.trim() || null,
        logoUrl,
      });
      setLogoPreviewUrl(logoUrl);
      await refetchTenant();
      toast({
        title: "Logo atualizado",
        description:
          "Arquivo substituído no armazenamento (R2) e vinculado a este abrigo.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Não foi possível atualizar o logo",
        description:
          err instanceof Error
            ? err.message
            : "Confira se o R2 está configurado no servidor.",
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
    } catch (err) {
      toast({
        title: "Não foi possível salvar",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
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
            <LayoutGrid className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
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
            Ao enviar um arquivo novo, o servidor{" "}
            <span className="font-medium text-foreground">
              remove as versões anteriores no R2
            </span>{" "}
            (mesmo nome de arquivo ou outra extensão) e grava o novo objeto —
            não é necessário apagar manualmente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Avatar className="h-24 w-24 rounded-xl border border-border bg-muted/40">
                {logoPreviewUrl ? (
                  <AvatarImage
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

      <Card>
        <CardHeader>
          <CardTitle>Restaurar backup (dump)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Envie o arquivo de dump gerado pelo job de backup (
            <code className="text-xs bg-muted px-1 rounded">
              backup_*.sql.gz
            </code>
            ou <code className="text-xs bg-muted px-1 rounded">.sql</code>). O
            banco será restaurado com o conteúdo do dump.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql,.sql.gz,application/gzip"
            className="hidden"
            onChange={handleRestoreBackup}
          />
          <Button
            variant="outline"
            disabled={restoreLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {restoreLoading ? "Restaurando..." : "Selecionar dump e restaurar"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saúde do sistema</CardTitle>
          <p className="text-sm text-muted-foreground">
            Status do banco, Redis e último backup (atualizado pelo job de
            backup ou após importação).
          </p>
        </CardHeader>
        <CardContent>
          {health ? (
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Banco de dados</dt>
                <dd>
                  <span
                    className={
                      health.database === "connected"
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {health.database === "connected"
                      ? "Conectado"
                      : health.database}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Redis</dt>
                <dd>
                  <span
                    className={
                      health.redis === "connected"
                        ? "text-green-600 font-medium"
                        : "text-amber-600 font-medium"
                    }
                  >
                    {health.redis === "connected" ? "Conectado" : health.redis}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Último backup</dt>
                <dd>{formatBackupDate(health.lastBackupAt)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground">
              Não foi possível carregar o status.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup (status e execução)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Veja o status do último backup e rode um backup manual (gera um dump
            e atualiza os metadados).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={refetchBackupStatus}
              disabled={backupStatusLoading}
            >
              {backupStatusLoading ? "Atualizando..." : "Atualizar status"}
            </Button>
            <Button
              onClick={async () => {
                setBackupRunLoading(true);
                try {
                  await runAdminBackupNow();
                  toast({
                    title: "Backup iniciado",
                    description: "Backup gerado com sucesso.",
                    variant: "success",
                  });
                  await refetchBackupStatus();
                  await refetchHealth?.();
                } catch (err) {
                  toast({
                    title: "Erro ao gerar backup",
                    description:
                      err instanceof Error ? err.message : "Falha inesperada.",
                    variant: "error",
                  });
                } finally {
                  setBackupRunLoading(false);
                }
              }}
              disabled={backupRunLoading}
            >
              {backupRunLoading ? "Gerando..." : "Rodar backup agora"}
            </Button>
          </div>

          {backupStatus ? (
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Último backup (at)</dt>
                <dd>{formatBackupDate(backupStatus.lastBackupAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd
                  className={
                    backupStatus.lastBackupStatus === "ok"
                      ? "text-green-600 font-medium"
                      : backupStatus.lastBackupStatus === "error"
                        ? "text-red-600 font-medium"
                        : "text-muted-foreground"
                  }
                >
                  {backupStatus.lastBackupStatus ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duração</dt>
                <dd>
                  {backupStatus.lastBackupDurationMs != null
                    ? `${backupStatus.lastBackupDurationMs}ms`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tamanho</dt>
                <dd>
                  {backupStatus.lastBackupSizeBytes != null
                    ? `${backupStatus.lastBackupSizeBytes} bytes`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Retenção (R2)</dt>
                <dd>{backupStatus.retentionCount ?? "—"}</dd>
              </div>
              {backupStatus.lastBackupError && (
                <div className="text-sm text-red-600">
                  {backupStatus.lastBackupError}
                </div>
              )}
            </dl>
          ) : (
            <p className="text-muted-foreground">
              Clique em “Atualizar status” para carregar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
