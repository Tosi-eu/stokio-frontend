import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { MedicineForm } from "@/components/MedicineForm";
import { InputForm } from "@/components/InputForm";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { stockInSchema } from "@/schemas/stock-in.schema";
import {
  Input,
  Medicine,
  Patient,
  Cabinet,
  Drawer,
} from "@/interfaces/interfaces";
import type { RawStockInput, RawStockMedicine } from "@/interfaces/interfaces";

import {
  createStockIn,
  getCabinets,
  getDrawers,
  getInputs,
  getMedicines,
  getResidents,
} from "@/api/requests";
import { useNavigate } from "react-router-dom";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { OperationType } from "@/utils/enums";

export default function StockIn() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormWithZod(stockInSchema, {
    defaultValues: {
      operationType: undefined,
    },
  });

  const operationType = watch("operationType");
  const [medicines, setMedicines] = useState<RawStockMedicine[]>([]);
  const [inputs, setInputs] = useState<RawStockInput[]>([]);
  const [caselas, setCaselas] = useState<Patient[]>([]);
  const [drawers, setDrawers] = useState<Drawer[]>([]);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [medicinesRes, inputsRes, residents, cabinets, drawers] =
          await Promise.all([
            fetchAllPaginated(getMedicines),
            fetchAllPaginated(getInputs),
            fetchAllPaginated(getResidents),
            fetchAllPaginated(getCabinets),
            fetchAllPaginated(getDrawers),
          ]);

        setMedicines(medicinesRes);
        setInputs(inputsRes);
        setCaselas(residents);
        setCabinets(cabinets);
        setDrawers(drawers);
      } catch (err: unknown) {
        toast({
          title: "Erro ao carregar dados",
          description: getErrorMessage(
            err,
            "Não foi possível carregar os dados.",
          ),
          variant: "error",
          duration: 3000,
        });
        setMedicines([]);
        setInputs([]);
        setCaselas([]);
        setCabinets([]);
      }
    };

    fetchAll();
  }, []);

  const handleMedicineSubmit = async (data) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tipo: data.stockType,
        medicamento_id: data.id,
        quantidade: data.quantity,
        armario_id: data.cabinetId ?? null,
        gaveta_id: data.drawerId ?? null,
        casela_id: data.casela ?? null,
        validade: data.expirationDate ?? null,
        origem: data.origin ?? null,
        setor: data.sector,
        lote: data.lot ?? null,
        observacao: data.observacao ?? null,
      };

      await createStockIn(payload);

      toast({
        title: "Entrada registrada com sucesso!",
        description: "Medicamento adicionado ao estoque.",
        variant: "success",
        duration: 3000,
      });

      navigate("/stock");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(
        err,
        "Não foi possível registrar a entrada.",
      );
      if (errorMessage) {
        toast({
          title: "Erro ao registrar",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputSubmit = async (data) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tipo: data.stockType,
        insumo_id: data.inputId,
        quantidade: data.quantity,
        armario_id: data.cabinetId ?? null,
        gaveta_id: data.drawerId ?? null,
        casela_id: data.casela ?? null,
        validade: data.validity,
        setor: data.sector,
        lote: data.lot ?? null,
      };

      await createStockIn(payload);

      toast({
        title: "Entrada registrada!",
        description: "Insumo adicionado ao estoque.",
        variant: "success",
        duration: 3000,
      });

      navigate("/stock");
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(
        err,
        "Não foi possível registrar a entrada.",
      );
      if (errorMessage) {
        toast({
          title: "Erro ao registrar entrada",
          description: errorMessage,
          variant: "error",
          duration: 3000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canonicalMedicines: Medicine[] = medicines.map((m) => ({
    id: m.id ?? 0,
    name: m.nome,
    dosage: m.dosagem,
    measurementUnit: m.unidade_medida,
    substance: m.principio_ativo,
    minimumStock: Number(m.estoque_minimo) || 0,
  }));

  const canonicalInputs: Input[] = inputs.map((i) => ({
    id: i.id ?? 0,
    name: i.nome,
    description: i.descricao,
    minimumStock: i.estoque_minimo,
  }));

  return (
    <Layout title="Entrada de Estoque">
      <div className="max-w-lg mx-auto mt-10 bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Registrar Entrada
        </h2>

        <div className="space-y-1">
          <Label htmlFor="operationType">Tipo de entrada</Label>
          <Controller
            name="operationType"
            control={control}
            render={({ field }) => (
              <>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white" id="operationType">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OperationType.MEDICINE}>
                      {OperationType.MEDICINE}
                    </SelectItem>
                    <SelectItem value={OperationType.INPUT}>
                      {OperationType.INPUT}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.operationType && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.operationType.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {operationType === OperationType.MEDICINE && (
          <MedicineForm
            medicines={canonicalMedicines}
            caselas={caselas}
            cabinets={cabinets}
            drawers={drawers}
            onSubmit={handleMedicineSubmit}
            isLoading={isSubmitting}
          />
        )}

        {operationType === OperationType.INPUT && (
          <InputForm
            inputs={canonicalInputs}
            caselas={caselas}
            cabinets={cabinets}
            drawers={drawers}
            onSubmit={handleInputSubmit}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </Layout>
  );
}
