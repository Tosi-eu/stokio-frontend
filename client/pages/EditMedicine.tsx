import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import Layout from "@/components/Layout";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { editMedicineSchema } from "@/schemas/edit-medicine.schema";
import { updateMedicine } from "@/api/requests";
import {
  MEASUREMENT_UNIT_LABEL,
  MeasurementUnit,
} from "@/pages/RegisterMedicine";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";

export default function EditMedicine() {
  const location = useLocation();
  const navigate = useNavigate();

  const [medicineId, setMedicineId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithZod(editMedicineSchema, {
    defaultValues: {
      nome: "",
      principio_ativo: "",
      dosagem: "",
      unidade_medida: "",
      estoque_minimo: "",
    },
  });

  useEffect(() => {
    if (location.state?.item) {
      const item = location.state.item;
      const id = setTimeout(() => {
        setMedicineId(item.id);
        reset({
          nome: item.nome || "",
          principio_ativo: item.principio_ativo || "",
          dosagem: item.dosagem || "",
          unidade_medida: item.unidade_medida || "",
          estoque_minimo: item.estoque_minimo?.toString() || "",
        });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [location.state, reset]);

  const onSubmit = async (data: {
    nome: string;
    principio_ativo: string;
    dosagem: string;
    unidade_medida: string;
    estoque_minimo?: string;
  }) => {
    if (!medicineId) {
      toast({
        title: "Erro",
        description: "Medicamento não identificado.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await updateMedicine(medicineId, {
        nome: data.nome.trim(),
        principio_ativo: data.principio_ativo.trim(),
        dosagem: data.dosagem.trim(),
        unidade_medida: data.unidade_medida || null,
        estoque_minimo: data.estoque_minimo ? Number(data.estoque_minimo) : 0,
      });

      toast({
        title: "Medicamento atualizado",
        description: `${data.nome} foi atualizado com sucesso.`,
        variant: "success",
        duration: 3000,
      });

      navigate("/medicines");
    } catch (err: unknown) {
      toast({
        title: "Erro ao atualizar",
        description: getErrorMessage(
          err,
          "Erro inesperado ao salvar alterações.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Edição de Medicamento">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Editar Medicamento
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome do medicamento</Label>
              <Input
                id="nome"
                {...register("nome")}
                maxLength={255}
                disabled={isSubmitting}
                aria-invalid={errors.nome ? "true" : "false"}
              />
              {errors.nome && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="principio_ativo">Princípio ativo</Label>
              <Input
                id="principio_ativo"
                {...register("principio_ativo")}
                maxLength={255}
                disabled={isSubmitting}
                aria-invalid={errors.principio_ativo ? "true" : "false"}
              />
              {errors.principio_ativo && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.principio_ativo.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="dosagem">Dosagem</Label>
                <Input
                  id="dosagem"
                  {...register("dosagem")}
                  maxLength={100}
                  disabled={isSubmitting}
                  aria-invalid={errors.dosagem ? "true" : "false"}
                />
                {errors.dosagem && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.dosagem.message}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <Label htmlFor="unidade_medida">Unidade de medida</Label>
                <Controller
                  name="unidade_medida"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-white" id="unidade_medida">
                          <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.values(MeasurementUnit) as MeasurementUnit[]
                          ).map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {MEASUREMENT_UNIT_LABEL[unit]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.unidade_medida && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.unidade_medida.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="estoque_minimo">Estoque mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                {...register("estoque_minimo")}
                disabled={isSubmitting}
                aria-invalid={errors.estoque_minimo ? "true" : "false"}
              />
              {errors.estoque_minimo && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.estoque_minimo.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/medicines")}
                disabled={isSubmitting}
                className="rounded-lg"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
