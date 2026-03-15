import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONFIG_KEYS } from "../hooks/useAdminConfig";
import type { AdminHealthResponse } from "@/api/requests";
import { restoreBackup } from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { Upload } from "lucide-react";

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
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-6">
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
              {Object.entries(CONFIG_KEYS).map(([key, label]) => (
                <div key={key} className="grid gap-2 max-w-sm">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type={
                      key === "expiring_days" || key === "estoque_minimo_padrao"
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
              ))}
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
    </div>
  );
}
