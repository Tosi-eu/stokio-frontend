import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { updateTenantBranding, updateTenantConfig } from "@/api/requests";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import { useTenant } from "@/hooks/use-tenant.hook";

const MODULES: Array<{ key: string; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "residents", label: "Residentes" },
  { key: "medicines", label: "Medicamentos" },
  { key: "inputs", label: "Insumos" },
  { key: "stock", label: "Estoque" },
  { key: "movements", label: "Movimentações" },
  { key: "reports", label: "Relatórios" },
  { key: "notifications", label: "Notificações" },
  { key: "admin", label: "Administração" },
];

export default function TenantOnboarding() {
  const { modules, tenant, refetch } = useTenant();
  const initialEnabled = useMemo(
    () => new Set(modules?.enabled ?? []),
    [modules],
  );
  const [enabled, setEnabled] = useState<Set<string>>(initialEnabled);
  const [brandName, setBrandName] = useState(tenant?.brandName ?? tenant?.name ?? "");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(tenant?.logoDataUrl ?? null);
  const [saving, setSaving] = useState(false);
  const jsonPreview = useMemo(
    () => JSON.stringify({ enabled: Array.from(enabled) }, null, 2),
    [enabled],
  );

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Layout title="Configurar abrigo">
      <Card className="max-w-3xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Dados do abrigo e módulos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina nome e logo do abrigo e selecione os módulos que vão aparecer no sistema.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Nome do abrigo</div>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ex.: Abrigo São José"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Logo</div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 400_000) {
                    toast({
                      title: "Imagem muito grande",
                      description: "Use uma imagem menor (até ~400KB).",
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
                }}
              />
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Prévia do logo"
                  className="h-16 w-auto rounded bg-white border"
                />
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className="flex items-center gap-3 border rounded-md p-3 cursor-pointer"
              >
                <Checkbox
                  checked={enabled.has(m.key)}
                  onCheckedChange={() => toggle(m.key)}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Prévia do JSON</div>
            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-64">
              {jsonPreview}
            </pre>
            <p className="text-xs text-muted-foreground">
              Esta prévia é informativa. A validação final acontece no backend.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEnabled(new Set(modules?.enabled ?? []));
                setBrandName(tenant?.brandName ?? tenant?.name ?? "");
                setLogoDataUrl(tenant?.logoDataUrl ?? null);
              }}
            >
              Desfazer
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setSaving(true);
                try {
                  await updateTenantBranding({
                    brandName: brandName.trim() || null,
                    logoDataUrl,
                  });
                  await updateTenantConfig({ enabled: Array.from(enabled) });
                  toast({ title: "Configuração salva" });
                  await refetch();
                } catch {
                  toast({ title: "Erro ao salvar configuração", variant: "error" });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}

