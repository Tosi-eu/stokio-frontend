import { useCallback, useEffect, useState } from "react";
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
  display_casela: "Identificação de casela (estoque, movimentações, filtros)",
  display_gaveta: "Identificação de gaveta (estoque, movimentações)",
} as const;

/** Chaves editadas com select (valores fixos), não campo numérico. */
export const CONFIG_SELECT_KEYS = {
  display_casela: [
    { value: "nome", label: "Nome do residente" },
    { value: "numero", label: "Número da casela" },
  ],
  display_gaveta: [
    { value: "categoria", label: "Categoria da gaveta" },
    { value: "numero", label: "Número da gaveta" },
  ],
} as const;

const DEFAULT_VALUES: Record<string, string> = {
  expiring_days: "45",
  estoque_minimo_padrao: "0",
  display_casela: "nome",
  display_gaveta: "numero",
};

export function useAdminConfig(isAdmin: boolean, enabled = true) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<AdminHealthResponse | null>(null);

  const load = useCallback(async () => {
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
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && enabled) load();
  }, [isAdmin, enabled, load]);

  const refetchHealth = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const h = await getAdminHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !enabled) return;
    refetchHealth();
  }, [isAdmin, enabled, refetchHealth]);

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
