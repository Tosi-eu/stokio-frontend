import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  getAdminConfig,
  updateAdminConfig,
  getAdminHealth,
} from "@/api/requests";
import type { AdminHealthResponse } from "@/api/requests";

export const CONFIG_KEYS = {
  expiring_days: "Dias para considerar “próximo ao vencimento”",
  estoque_minimo_padrao: "Estoque mínimo padrão (novos itens)",
} as const;

const DEFAULT_VALUES: Record<string, string> = {
  expiring_days: "45",
  estoque_minimo_padrao: "0",
};

export function useAdminConfig(isAdmin: boolean, enabled = true) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<AdminHealthResponse | null>(null);

  async function load() {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await getAdminConfig();
      const next = { ...DEFAULT_VALUES, ...data };
      setConfig(next);
      setForm(next);
    } catch {
      toast({ title: "Erro ao carregar configurações", variant: "error" });
      setConfig(DEFAULT_VALUES);
      setForm({ ...DEFAULT_VALUES });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin && enabled) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable
  }, [isAdmin, enabled]);

  async function refetchHealth() {
    if (!isAdmin) return;
    try {
      const h = await getAdminHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    }
  }

  useEffect(() => {
    if (!isAdmin || !enabled) return;
    refetchHealth();
  }, [isAdmin, enabled]);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateAdminConfig(form);
      setConfig(updated);
      setForm(updated);
      toast({ title: "Configurações salvas", variant: "success" });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro ao salvar",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return {
    config,
    form,
    setForm,
    loading,
    saving,
    health,
    load,
    save,
    refetchHealth,
  };
}
