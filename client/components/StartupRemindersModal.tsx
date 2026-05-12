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
import { BellRing, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import type { NotificationListItem } from "@/api/types";
import type { StockReplacementItem } from "@/components/StockReplacementModal";

export interface StartupRemindersModalProps {
  open: boolean;
  medicineEvents: NotificationListItem[];
  replacementItems: StockReplacementItem[];
  onClose: () => void;
}

const StartupRemindersModal: FC<StartupRemindersModalProps> = ({
  open,
  medicineEvents,
  replacementItems,
  onClose,
}) => {
  const router = useRouter();
  const hasMedicine = medicineEvents.length > 0;
  const hasReplacement = replacementItems.length > 0;

  const handleGoToStock = () => {
    onClose();
    router.push("/stock");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="
          max-w-lg max-h-[90vh] flex flex-col rounded-2xl p-6 gap-4
          [&>button.absolute.right-4.top-4]:hidden
        "
      >
        <DialogHeader className="shrink-0 space-y-1">
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <BellRing className="w-5 h-5 text-primary" />
            Lembretes pendentes
          </DialogTitle>
        </DialogHeader>

        <p className="shrink-0 text-sm text-slate-600">
          Revise todos os itens abaixo. Ao confirmar, eles serão marcados como
          vistos.
        </p>

        <ScrollArea className="min-h-0 flex-1 max-h-[min(60vh,28rem)] pr-3">
          <div className="space-y-6 pb-2">
            {hasMedicine ? (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <BellRing className="w-4 h-4 text-primary shrink-0" />
                  Receitas para emitir hoje ({medicineEvents.length})
                </h3>
                <div className="space-y-3">
                  {medicineEvents.map((ev) => (
                    <Card
                      key={`med-${ev.id}`}
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
              </section>
            ) : null}

            {hasReplacement ? (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  Reposição de estoque prevista para amanhã (
                  {replacementItems.length})
                </h3>
                <div className="space-y-3">
                  {replacementItems.map((item) => (
                    <Card
                      key={`rep-${item.id}`}
                      className="rounded-xl border border-slate-300 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="text-base font-semibold text-slate-900">
                          {item.medicamento_nome}
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-semibold">Residente: </span>
                          {item.residente_nome || "-"}
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-semibold">Quantidade: </span>
                          {item.quantidade}
                        </div>
                        <div className="text-sm text-slate-700">
                          <span className="font-semibold">Data prevista: </span>
                          {formatDateToPtBr(item.data_prevista)}
                        </div>
                        <div className="text-sm text-slate-600">
                          Ciclo de reposição: a cada {item.dias_para_repor}{" "}
                          {item.dias_para_repor === 1 ? "dia" : "dias"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row">
          {hasReplacement ? (
            <Button
              type="button"
              onClick={handleGoToStock}
              variant="outline"
              className="w-full sm:w-auto rounded-lg order-2 sm:order-1"
            >
              Ir para estoque
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg order-1 sm:order-2"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartupRemindersModal;
