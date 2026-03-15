import { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import type { NotificationListItem } from "@/api/types";

interface NotificationReminderModalProps {
  open: boolean;
  events: NotificationListItem[];
  onClose: () => void;
}

const NotificationReminderModal: FC<NotificationReminderModalProps> = ({
  open,
  events,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          max-w-lg rounded-2xl p-6 space-y-4
          [&>button.absolute.right-4.top-4]:hidden
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <BellRing className="w-5 h-5 text-sky-600" />
            Notificações pendentes para hoje
          </DialogTitle>
        </DialogHeader>

        <p className="text-slate-600">
          Existem receitas que precisam ser emitidas hoje:
        </p>

        <ScrollArea className="max-h-80 pr-2">
          <div className="space-y-3">
            {events.map((ev) => (
              <Card
                key={ev.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-shadow rounded-xl"
              >
                <CardContent className="p-4 space-y-2">
                  <span className="font-semibold text-base text-slate-900">
                    {ev.residente_nome}
                  </span>

                  <div className="text-sm text-slate-700">
                    <span className="font-semibold">Medicamento: </span>
                    {ev.medicamento_nome}
                  </div>

                  <div className="text-sm text-slate-700">
                    <span className="font-semibold">Destino: </span>
                    {ev.destino}
                  </div>

                  <div className="text-sm text-slate-700">
                    <span className="font-semibold">Data prevista: </span>
                    {formatDateToPtBr(ev.data_prevista)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationReminderModal;
