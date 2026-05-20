import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  getAdminConfig,
  updateAdminConfig,
  type AdminScheduledBackupConfig,
  type AdminSystemConfig,
} from "@/api/requests";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";

export const CONFIG_KEYS = {
  expiring_days: "Dias para considerar “próximo ao vencimento”",
  display_casela: "Identificação de casela (estoque, movimentações, filtros)",
  display_gaveta: "Identificação de gaveta (estoque, movimentações)",
  display_default_report_format:
    "Formato padrão ao gerar relatórios (estoque e painel admin)",
} as const;

export const CONFIG_SELECT_KEYS = {
  display_casela: [
    { value: "nome_somente", label: "Nome do residente" },
    { value: "nome_casela", label: "Nome do residente (nº da casela)" },
    { value: "numero", label: "Número da casela" },
  ],
  display_gaveta: [
    { value: "categoria", label: "Categoria da gaveta" },
    { value: "numero", label: "Número da gaveta" },
  ],
  display_default_report_format: [
    { value: "pdf", label: "PDF" },
    { value: "xlsx", label: "Planilha (Excel)" },
  ],
} as const;

export const DISPLAY_CONFIG_KEYS = {
  display_casela: "Identificação de casela (listas e tabelas)",
  display_casela_setor:
    "Setores em que a identificação de casela (acima) se aplica",
  display_armario: "Identificação de armário (listas e tabelas)",
  display_gaveta: "Identificação de gaveta (listas e tabelas)",
} as const;

export const DISPLAY_SELECT_OPTIONS = {
  display_casela: [
    { value: "numero", label: "Número da casela" },
    { value: "nome_somente", label: "Nome do residente" },
    { value: "nome_casela", label: "Nome do residente (nº da casela)" },
  ],
  display_casela_setor: [
    { value: "farmacia", label: "Somente farmácia" },
    { value: "enfermagem", label: "Somente enfermagem" },
    { value: "todos", label: "Farmácia e enfermagem" },
  ],
  display_armario: [
    { value: "numero", label: "Número do armário" },
    { value: "categoria", label: "Categoria do armário" },
  ],
  display_gaveta: [
    { value: "numero", label: "Número da gaveta" },
    { value: "categoria", label: "Categoria da gaveta" },
  ],
} as const;

const DEFAULT_VALUES: AdminSystemConfig = {
  expiring_days: "45",
  display_casela: "nome_casela",
  display_gaveta: "numero",
  display_default_report_format: "pdf",
};

const DEFAULT_SCHEDULED_BACKUP: AdminScheduledBackupConfig = {
  enabled: true,
  cronExpression: "0 8-18/2 * * *",
  timezone: "America/Sao_Paulo",
};

export function useAdminConfig(
  isAdmin: boolean,
  enabled = true,
  isSuperAdmin = false,
) {
  const [config, setConfig] = useState<AdminSystemConfig>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AdminSystemConfig>({});
  const [scheduledBackup, setScheduledBackup] =
    useState<AdminScheduledBackupConfig>(DEFAULT_SCHEDULED_BACKUP);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await getAdminConfig();
      const display = data.display ?? {};
      const { ...displayRest } = display as AdminSystemConfig & {
        estoque_minimo_padrao?: string;
      };
      const next = { ...DEFAULT_VALUES, ...displayRest };
      setConfig(next);
      setForm(next);
      if (data.system?.scheduledBackup) {
        setScheduledBackup({
          ...DEFAULT_SCHEDULED_BACKUP,
          ...data.system.scheduledBackup,
        });
      } else {
        setScheduledBackup(DEFAULT_SCHEDULED_BACKUP);
      }
    } catch {
      toast({ title: "Erro ao carregar configurações", variant: "error" });
      setConfig(DEFAULT_VALUES);
      setForm({ ...DEFAULT_VALUES });
      setScheduledBackup(DEFAULT_SCHEDULED_BACKUP);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && enabled) load();
  }, [isAdmin, enabled, load]);

  async function save() {
    setSaving(true);
    try {
      const display: AdminSystemConfig = {};
      for (const key of Object.keys(CONFIG_KEYS)) {
        if (form[key] !== undefined) display[key] = form[key];
      }
      const body: Parameters<typeof updateAdminConfig>[0] = {
        display,
      };
      if (isSuperAdmin) {
        body.system = { scheduledBackup };
      }
      const updated = await updateAdminConfig(body);
      const savedDisplay = updated.display ?? {};
      const { ...displayRest } = savedDisplay as AdminSystemConfig & {
        estoque_minimo_padrao?: string;
      };
      const merged = { ...DEFAULT_VALUES, ...displayRest };
      setConfig(merged);
      setForm(merged);
      if (updated.system?.scheduledBackup) {
        setScheduledBackup({
          ...DEFAULT_SCHEDULED_BACKUP,
          ...updated.system.scheduledBackup,
        });
      }
      window.dispatchEvent(new Event("ui-display-updated"));
      toast({ title: "Configurações salvas", variant: "success" });
    } catch (e: unknown) {
      toast({
        title: "Não foi possível guardar as configurações",
        description: getErrorMessage(
          e,
          USER_FACING_RETRY_SHORT,
          "useAdminConfig:save",
        ),
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
    scheduledBackup,
    setScheduledBackup,
    loading,
    saving,
    load,
    save,
  };
}
