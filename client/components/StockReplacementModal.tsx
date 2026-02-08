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
import { Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Tipagem alinhada 100% ao payload da API
 */
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
  const navigate = useNavigate();

  const handleGoToStock = () => {
    onClose();
    navigate("/stock");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="
          max-w-lg rounded-2xl p-6 space-y-4
          [&>button.absolute.right-4.top-4]:hidden
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
            <Package className="w-5 h-5 text-sky-600" />
            Reposição de estoque amanhã
          </DialogTitle>
        </DialogHeader>

        <p className="text-slate-600">
          Os seguintes itens possuem reposição programada para amanhã:
        </p>

        <ScrollArea className="max-h-80 pr-2">
          <div className="space-y-3">
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
                    {item.data_prevista}
                  </div>

                  <div className="text-sm text-slate-600">
                    Ciclo de reposição: a cada {item.dias_para_repor}{" "}
                    {item.dias_para_repor === 1 ? "dia" : "dias"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleGoToStock}
            variant="outline"
            className="rounded-lg"
          >
            Ir para estoque
          </Button>

          <Button
            onClick={onClose}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockReplacementModal;
