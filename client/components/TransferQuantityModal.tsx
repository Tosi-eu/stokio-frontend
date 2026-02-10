import { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronDown } from "lucide-react";

interface TransferQuantityModalProps {
  open: boolean;
  item: {
    name: string;
    quantity: number;
    sector: string;
    itemType?: "medicamento" | "insumo";
    isGeneralMedicine?: boolean;
    casela?: number | null;
  } | null;
  residents?: Array<{ casela: number; name: string }>;
  onConfirm: (
    quantity: number,
    casela?: number | null,
    destino?: string | null,
    details?: string | null,
    options?: {
      bypassCasela: boolean;
      dias_para_repor: number | null;
    },
  ) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TransferQuantityModal: FC<TransferQuantityModalProps> = ({
  open,
  item,
  residents = [],
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [quantity, setQuantity] = useState("");
  const [selectedCasela, setSelectedCasela] = useState("");
  const [caselaOpen, setCaselaOpen] = useState(false);
  const [caselaSearch, setCaselaSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [details, setDetails] = useState("");
  const [isGeneralUse, setIsGeneralUse] = useState(false);
  const [daysToReplacement, setDaysToReplacement] = useState("");

  const isInput = item?.itemType === "insumo";
  const isGeneralMedicine = item?.isGeneralMedicine === true;

  useEffect(() => {
    if (open) {
      setQuantity("");
      setSelectedCasela("");
      setDestination("");
      setDetails("");
      setCaselaSearch("");
      setIsGeneralUse(false);
      setDaysToReplacement("");
    }
  }, [open]);

  const maxQuantity = item?.quantity || 0;
  const quantityNum = parseInt(quantity, 10);
  const isValidQuantity = quantityNum > 0 && quantityNum <= maxQuantity;
  const isIndividualStock = item?.casela != null;
  const isInsumo = item?.itemType === "insumo";
  const isMedicamento = item?.itemType === "medicamento";
  const isIndividual = item?.casela != null;
  const isMedicamentoGeral = isMedicamento && item?.isGeneralMedicine === true;
  const isInsumoGeral = isInsumo && !isIndividual;
  const hasCaselaSelected = selectedCasela.length > 0;
  const hasDestination = destination.trim().length > 0;

  const canConfirm =
    isValidQuantity &&
    (isIndividual ||
      (isMedicamentoGeral && (isGeneralUse || hasCaselaSelected)) ||
      (isInsumoGeral && (hasCaselaSelected || hasDestination)));

  const handleConfirm = () => {
    if (!canConfirm) return;

    const casela = isIndividualStock
      ? item.casela
      : isGeneralUse
        ? null
        : selectedCasela
          ? Number(selectedCasela)
          : null;

    const destino =
      (isIndividualStock || isInput) && hasDestination
        ? destination.trim()
        : null;

    onConfirm(quantityNum, casela, destino, details.trim() || null, {
      bypassCasela: isGeneralUse,
      dias_para_repor:
        !isGeneralUse && daysToReplacement !== ""
          ? Number(daysToReplacement)
          : null,
    });
  };

  const filteredResidents = residents.filter((r) => {
    if (!caselaSearch) return true;
    if (/^\d+$/.test(caselaSearch)) {
      return r.casela === Number(caselaSearch);
    }
    return r.name.toLowerCase().includes(caselaSearch.toLowerCase());
  });

  const nextSector = item?.sector === "farmacia" ? "enfermagem" : "farmacia";

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>
            Transferir para{" "}
            {nextSector === "farmacia" ? "Farmácia" : "Enfermaria"}
          </DialogTitle>
          <DialogDescription>
            Quantas unidades deseja transferir?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Quantidade disponível:{" "}
              <span className="font-semibold">{maxQuantity}</span>
            </Label>

            <Input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading}
            />
          </div>

          {isInput && !isIndividualStock && !isGeneralUse && (
            <div className="space-y-2">
              <Label>Destino</Label>
              <Input
                placeholder="Digite o destino (opcional)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {!isGeneralUse && isMedicamento && (
            <div className="space-y-2">
              <Label>Dias para repor</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 7"
                value={daysToReplacement}
                onChange={(e) => setDaysToReplacement(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observação</Label>
            <Input
              placeholder="Digite uma observação (opcional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={loading || isGeneralUse}
            />
          </div>

          {isGeneralMedicine && (
            <div className="space-y-3">
              <Label>Casela</Label>

              <Popover open={caselaOpen} onOpenChange={setCaselaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={loading || isGeneralUse}
                    className="w-full justify-between"
                  >
                    {selectedCasela
                      ? `Casela ${selectedCasela} - ${
                          residents.find(
                            (r) => r.casela === Number(selectedCasela),
                          )?.name
                        }`
                      : "Selecione uma casela..."}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por casela ou nome"
                      value={caselaSearch}
                      onValueChange={setCaselaSearch}
                    />
                    <CommandEmpty>Nenhuma casela encontrada.</CommandEmpty>
                    <CommandGroup>
                      {filteredResidents.map((resident) => (
                        <CommandItem
                          key={resident.casela}
                          onSelect={() => {
                            setSelectedCasela(resident.casela.toString());
                            setCaselaOpen(false);
                            setCaselaSearch("");
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedCasela === resident.casela.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          Casela {resident.casela} – {resident.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {isGeneralMedicine && !isInput && (
                <div
                  className={`flex items-start gap-2 rounded-md border p-3 ${
                    isGeneralUse ? "border-red-400 bg-red-50" : "border-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    id="general-use"
                    checked={isGeneralUse}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsGeneralUse(checked);

                      if (checked) {
                        setSelectedCasela("");
                        setDetails("");
                        setDaysToReplacement("");
                      }
                    }}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="general-use"
                    className="text-sm leading-snug cursor-pointer"
                  >
                    Este medicamento é para <strong>uso geral</strong>.
                  </Label>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !canConfirm}>
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferQuantityModal;
