import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONFIG_KEYS } from "../hooks/useAdminConfig";
import type { AdminHealthResponse } from "@/api/requests";

interface AdminTabConfigProps {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loading: boolean;
  saving: boolean;
  health: AdminHealthResponse | null;
  onSave: () => void;
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
}: AdminTabConfigProps) {
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
                    type={key === "expiring_days" || key === "estoque_minimo_padrao" ? "number" : "text"}
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
          <CardTitle>Saúde do sistema</CardTitle>
          <p className="text-sm text-muted-foreground">
            Status do banco, Redis e último backup (atualizado pelo job de backup).
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
                    {health.database === "connected" ? "Conectado" : health.database}
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
            <p className="text-muted-foreground">Não foi possível carregar o status.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
