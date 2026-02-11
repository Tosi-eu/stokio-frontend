import "react-datepicker/dist/react-datepicker.css";
import {
  createNotificationEvent,
  getMedicines,
  getResidents,
  patchNotificationEvent,
} from "@/api/requests";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import { useAuth } from "@/hooks/use-auth.hook";
import { useNotifications } from "@/hooks/use-notification.hook";
import { toast } from "@/hooks/use-toast.hook";
import { EventStatus, NotificationDestiny } from "@/utils/enums";
import { parseDateFromString } from "@/utils/utils";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandInput, CommandGroup, CommandItem } from "./ui/command";
import { ChevronDown } from "lucide-react";
import { CommandSelect } from "./CommandSelect";

interface CreateNotificationFormProps {
  editData?: any;
  onCreated?: () => void;
}

export default function CreateNotificationForm({
  editData,
  onCreated,
}: CreateNotificationFormProps) {
  const { reload } = useNotifications();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [medicamentos, setMedicamentos] = useState([]);
  const [residentes, setResidentes] = useState([]);

  const [form, setForm] = useState({
    medicamento_id: 0,
    residente_id: 0,
    destino: NotificationDestiny.SUS,
    data_prevista: null as Date | null,
    criado_por: user?.id,
    status: EventStatus.PENDENTE,
    id: undefined as number | undefined,
    tipo_evento: "",
  });

  const NotificationDestinyLabel: Record<NotificationDestiny, string> = {
    [NotificationDestiny.SUS]: "SUS",
    [NotificationDestiny.FAMILY]: "Família",
    [NotificationDestiny.PHARMACY]: "Farmácia",
  };

  useEffect(() => {
    if (editData) {
      setForm({
        medicamento_id: editData.medicamento_id,
        residente_id: editData.residente_id,
        destino: editData.destino,
        data_prevista: parseDateFromString(editData.data_prevista),
        criado_por: editData.criado_por,
        status: editData.status,
        id: editData.id,
        tipo_evento: "medicamento",
      });
    } else {
      setForm({
        medicamento_id: 0,
        residente_id: 0,
        destino: NotificationDestiny.SUS,
        data_prevista: null,
        criado_por: user?.id,
        status: EventStatus.PENDENTE,
        id: undefined,
        tipo_evento: "medicamento",
      });
    }
  }, [editData, user?.id]);

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      try {
        const meds = await getMedicines(1, 200);
        const res = await getResidents(1, 200);
        setMedicamentos(meds.data || meds);
        setResidentes(res.data || res);
      } catch (err) {
        toast({
          title: "Erro ao carregar opções",
          description: "Não foi possível carregar residentes ou medicamentos.",
          variant: "error",
          duration: 3000,
        });
      } finally {
        setLoadingOptions(false);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.medicamento_id || !form.residente_id || !form.data_prevista) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha medicamento, residente e data prevista.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await patchNotificationEvent(form.id, form);
        toast({ title: "Notificação atualizada", variant: "success", duration: 3000 });
      } else {
        await createNotificationEvent(form);
        toast({ title: "Notificação criada", variant: "success", duration: 3000 });
      }

      reload();
      onCreated?.();
    } catch (err) {
      toast({
        title: "Erro ao salvar notificação",
        description: "Ocorreu um erro ao tentar salvar a notificação.",
        variant: "error",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingOptions) {
    return <div className="text-slate-500 py-4">Carregando opções...</div>;
  }

  return (
    <form
      id="create-notification-form"
      onSubmit={handleSubmit}
      className="space-y-4 pb-20"
    >

    <CommandSelect
      label="Medicamento"
      value={medicamentos.find((m) => m.id === form.medicamento_id)}
      items={medicamentos}
      onSelect={(m) => setForm({ ...form, medicamento_id: m.id })}
      getLabel={(m) => m.nome}
    />

    <CommandSelect
      label="Residente"
      value={residentes.find((r) => r.casela === form.residente_id)}
      items={residentes}
      onSelect={(r) => setForm({ ...form, residente_id: r.casela })}
      getLabel={(r) => r.name}
    />

    <CommandSelect
      label="Destino"
      value={form.destino}
      items={Object.values(NotificationDestiny)}
      onSelect={(d) => setForm({ ...form, destino: d })}
      getLabel={(d) => NotificationDestinyLabel[d]}
    />
    
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium text-slate-700">Data Prevista</label>
        <DatePicker
          selected={form.data_prevista}
          onChange={(date: Date | null) => setForm({ ...form, data_prevista: date })}
          dateFormat="dd/MM/yyyy"
          locale={ptBR}
          placeholderText="Selecione a data"
          allowSameDay={true}
          strictParsing={true}
          showPopperArrow={false}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          calendarClassName="react-datepicker-calendar"
        />
        {form.data_prevista && (
          <div className="text-sm text-slate-500 mt-1">
            Selecionado: {formatDateToPtBr(form.data_prevista)}
          </div>
        )}
      </div>
    </form>
  );
}
