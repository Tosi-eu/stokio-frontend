import { FC } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
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
          flex max-h-[90vh] max-w-lg flex-col gap-4 overflow-hidden rounded-2xl p-6
          [&>button.absolute.right-4.top-4]:hidden
        "
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <BellRing className="w-5 h-5 text-primary" />
            Notificações pendentes para hoje
          </DialogTitle>
        </DialogHeader>

        <p className="shrink-0 text-slate-600">
          Existem receitas que precisam ser emitidas hoje:
        </p>

        <div className="min-h-0 max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain pr-2 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-3 pb-1">
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
        </div>

        <DialogFooter className="shrink-0">
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationReminderModal;
