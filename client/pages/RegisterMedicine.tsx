import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { createMedicine, getMedicines } from "@/api/requests";
import type { RawStockMedicine } from "@/interfaces/interfaces";
import {
  medicineSchema,
  type MedicineFormData,
} from "@/schemas/medicine.schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MeasurementUnitCombobox } from "@/components/MeasurementUnitCombobox";
import { MeasurementUnit } from "@/constants/measurement-units";

export {
  MEASUREMENT_UNIT_LABEL,
  MeasurementUnit,
} from "@/constants/measurement-units";

export default function SignUpMedicine() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: "",
      substance: "",
      dosageValue: "",
      measurementUnit: "",
      minimumStock: "",
      price: "",
    },
  });

  const [medicines, setMedicines] = useState<RawStockMedicine[]>([]);
  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form watch()
  const watchedName = watch("name");

  useEffect(() => {
    async function fetchMedicines() {
      try {
        const data = await getMedicines();
        setMedicines(data.data || []);
      } catch (err: unknown) {
        toast({
          title: "Erro",
          description: getErrorMessage(
            err,
            "Não foi possível carregar os medicamentos.",
          ),
          variant: "error",
          duration: 3000,
        });
      }
    }

    fetchMedicines();
  }, []);

  useEffect(() => {
    if (watchedName) {
      const selected = medicines.find((m) => m.nome === watchedName);
      if (selected) {
        const match = selected.dosagem?.match(/^(\d+(?:,\d+)?)([a-zA-Z]+)$/);
        const dosageValue = match ? match[1] : "";
        const measurementUnit = match ? match[2] : "";

        setValue("substance", selected.principio_ativo || "");
        setValue("dosageValue", dosageValue);
        if (
          Object.values(MeasurementUnit).includes(
            measurementUnit as MeasurementUnit,
          )
        ) {
          setValue("measurementUnit", measurementUnit as MeasurementUnit);
        }
        setValue("minimumStock", selected.estoque_minimo?.toString() || "");
      }
    }
  }, [watchedName, medicines, setValue]);

  const onSubmit = async (data: MedicineFormData) => {
    try {
      await createMedicine(
        data.name.trim(),
        data.substance.trim(),
        data.dosageValue.trim(),
        data.measurementUnit,
        data.minimumStock ? Number(data.minimumStock) : null,
        data.price ? Number(data.price) : null,
      );

      toast({
        title: "Medicamento cadastrado!",
        description: `${data.name} (${data.dosageValue}${data.measurementUnit}) foi registrado com sucesso.`,
        variant: "success",
        duration: 3000,
      });

      router.push("/medicines");
    } catch (error: unknown) {
      toast({
        title: "Erro ao cadastrar",
        description: getErrorMessage(
          error,
          "Não foi possível registrar o medicamento.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Cadastro de Medicamento">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Cadastro de Medicamento
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="name">Nome do medicamento</Label>
              <Input
                id="name"
                list="lista-medicamentos"
                {...register("name")}
                maxLength={255}
                placeholder="Digite o nome do medicamento"
                disabled={isSubmitting}
                aria-invalid={errors.name ? "true" : "false"}
              />
              <datalist id="lista-medicamentos">
                {medicines.map((m) => (
                  <option key={m.id} value={m.nome} />
                ))}
              </datalist>
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="substance">Princípio ativo</Label>
              <Input
                id="substance"
                {...register("substance")}
                maxLength={255}
                placeholder="Paracetamol"
                disabled={isSubmitting}
                aria-invalid={errors.substance ? "true" : "false"}
              />
              {errors.substance && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.substance.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="dosageValue">Dosagem</Label>
                <Input
                  id="dosageValue"
                  {...register("dosageValue")}
                  maxLength={50}
                  placeholder="10,5 ou 10/100"
                  disabled={isSubmitting}
                  aria-invalid={errors.dosageValue ? "true" : "false"}
                />
                {errors.dosageValue && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.dosageValue.message}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <Label htmlFor="measurementUnit">Unidade</Label>
                <Controller
                  name="measurementUnit"
                  control={control}
                  render={({ field }) => (
                    <>
                      <MeasurementUnitCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                        id="measurementUnit"
                        placeholder="Selecione"
                        aria-invalid={Boolean(errors.measurementUnit)}
                      />
                      {errors.measurementUnit && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.measurementUnit.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="minimumStock">Estoque mínimo</Label>
              <Input
                id="minimumStock"
                type="number"
                {...register("minimumStock")}
                placeholder="10"
                disabled={isSubmitting}
                aria-invalid={errors.minimumStock ? "true" : "false"}
              />
              {errors.minimumStock && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.minimumStock.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">Preço unitário (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register("price")}
                placeholder="0.00"
                disabled={isSubmitting}
                aria-invalid={errors.price ? "true" : "false"}
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/medicines")}
                disabled={isSubmitting}
                className="rounded-lg"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
