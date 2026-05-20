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
import { Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateToPtBr } from "@/helpers/dates.helper";

export interface StockReplacementItem {
  id: number;
  destino: string;
  data_prevista: string;
  status: string;
  criado_por: number;
  residente_nome: string | null;
  medicamento_nome: string;
  medicamento_id: number;
  residente_id: number | null;
  usuario: string;
  quantidade: number;
  visto: boolean;
  tipo_evento: string;
  dias_para_repor: number;
}

interface StockReplacementModalProps {
  open: boolean;
  items: StockReplacementItem[];
  onClose: () => void;
}

const StockReplacementModal: FC<StockReplacementModalProps> = ({
  open,
  items,
  onClose,
}) => {
  const router = useRouter();

  const handleGoToStock = () => {
    onClose();
    router.push("/stock");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="
          flex max-h-[90vh] max-w-lg flex-col gap-4 overflow-hidden rounded-2xl p-6
          [&>button.absolute.right-4.top-4]:hidden
        "
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <Package className="w-5 h-5 text-primary" />
            Reposição de estoque amanhã
          </DialogTitle>
        </DialogHeader>

        <p className="shrink-0 text-slate-600">
          Os seguintes itens possuem reposição programada para amanhã:
        </p>

        <div className="min-h-0 max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain pr-2 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-3 pb-1">
            {items.map((item) => (
              <Card
                key={item.id}
                className="
                  rounded-xl
                  border border-slate-300
                  shadow-sm
                  hover:shadow-md
                  transition-shadow
                "
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
        </div>

        <DialogFooter className="shrink-0">
          <Button
            onClick={handleGoToStock}
            variant="outline"
            className="rounded-lg"
          >
            Ir para estoque
          </Button>

          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockReplacementModal;
