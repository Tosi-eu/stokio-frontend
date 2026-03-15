import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import Layout from "@/components/Layout";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { cabinetSchema } from "@/schemas/cabinet.schema";

import {
  getCabinets,
  updateCabinet,
  getCabinetCategories,
} from "@/api/requests";
import { Cabinet } from "@/interfaces/interfaces";

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

export default function EditCabinet() {
  const location = useLocation();
  const navigate = useNavigate();

  const item = location.state?.item as Cabinet | undefined;

  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [categories, setCategories] = useState<{ id: number; nome: string }[]>(
    [],
  );

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useFormWithZod(cabinetSchema, {
    defaultValues: {
      numero: "",
      categoria_id: "",
    },
  });

  const watchedNumero = watch("numero");

  useEffect(() => {
    getCabinets()
      .then((res) => setCabinets(res.data))
      .catch(() =>
        toast({
          title: "Erro ao carregar armários",
          description: "Não foi possível buscar os armários do servidor.",
          variant: "error",
          duration: 3000,
        }),
      );
  }, []);

  useEffect(() => {
    getCabinetCategories(1, 200)
      .then((res) => setCategories(res.data))
      .catch(() =>
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias.",
          variant: "error",
          duration: 3000,
        }),
      );
  }, []);

  useEffect(() => {
    if (item && cabinets.length > 0 && categories.length > 0) {
      const cab = cabinets.find((c) => c.numero === item.numero);

      if (cab) {
        const matchedCategory = categories.find(
          (c) => c.nome === cab.categoria,
        );

        reset({
          numero: cab.numero.toString(),
          categoria_id: matchedCategory?.id.toString() ?? "",
        });
      }
    }
  }, [item, cabinets, categories, reset]);

  useEffect(() => {
    if (watchedNumero && cabinets.length > 0 && categories.length > 0) {
      const cab = cabinets.find((c) => c.numero === Number(watchedNumero));
      if (cab) {
        const matchedCategory = categories.find(
          (c) => c.nome === cab.categoria,
        );
        if (matchedCategory) {
          reset({
            numero: watchedNumero,
            categoria_id: matchedCategory.id.toString(),
          });
        }
      }
    }
  }, [watchedNumero, cabinets, categories, reset]);

  const onSubmit = async (data: { numero: string; categoria_id: string }) => {
    if (!data.numero || !data.categoria_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um armário e uma categoria.",
        variant: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      await updateCabinet(Number(data.numero), {
        numero: Number(data.numero),
        categoria_id: Number(data.categoria_id),
      });

      toast({
        title: "Armário atualizado",
        description: `O armário ${data.numero} foi atualizado com sucesso.`,
        variant: "success",
        duration: 3000,
      });

      navigate("/cabinets");
    } catch (err: unknown) {
      toast({
        title: "Erro ao editar armário",
        description: getErrorMessage(
          err,
          "Não foi possível atualizar o armário.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Editar Armário">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Editar Armário
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="numero">Armário</Label>
              <Controller
                name="numero"
                control={control}
                render={({ field }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="bg-white" id="numero">
                        <SelectValue placeholder="Selecione o armário" />
                      </SelectTrigger>
                      <SelectContent>
                        {cabinets.map((c) => (
                          <SelectItem key={c.numero} value={String(c.numero)}>
                            Armário {c.numero} ({c.categoria})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.numero && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.numero.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {watchedNumero && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="numero-display">Número do armário</Label>
                  <Input
                    id="numero-display"
                    className="bg-slate-100 text-slate-500"
                    type="number"
                    value={watchedNumero}
                    disabled
                    readOnly
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <Controller
                    name="categoria_id"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="bg-white" id="categoria_id">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.categoria_id && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.categoria_id.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/cabinets")}
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
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
