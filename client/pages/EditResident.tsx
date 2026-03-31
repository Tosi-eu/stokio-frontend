import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { residentSchema } from "@/schemas/resident.schema";
import { updateResident } from "@/api/requests";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function EditResident() {
  const location = useLocation();
  const item = location.state?.item;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithZod(residentSchema, {
    defaultValues: {
      name: "",
      casela: "",
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name || "",
        casela: item.casela?.toString() || "",
      });
    } else {
      toast({
        title: "Nenhum residente selecionado",
        description: "Volte à lista e escolha um residente para editar.",
        variant: "warning",
        duration: 3000,
      });
      navigate("/residents");
    }
  }, [item, navigate, reset]);

  const onSubmit = async (data: { name: string; casela: string }) => {
    if (!data.casela) {
      toast({
        title: "Erro",
        description: "Casela não identificada.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const updated = await updateResident(data.casela, {
        nome: data.name.trim(),
      });

      toast({
        title: "Residente atualizado",
        description: `O residente ${updated.name} foi atualizado com sucesso!`,
        variant: "success",
        duration: 3000,
      });

      navigate("/residents");
    } catch (err: unknown) {
      toast({
        title: "Erro ao editar residente",
        description: getErrorMessage(
          err,
          "Não foi possível atualizar o residente.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Editar Residente">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Edição de Residente
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="name">Nome do residente</Label>
              <Input
                id="name"
                {...register("name")}
                maxLength={60}
                disabled={isSubmitting}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="casela">Casela</Label>
              <Controller
                name="casela"
                control={control}
                render={({ field }) => (
                  <Input
                    id="casela"
                    {...field}
                    disabled
                    className="bg-slate-100 text-slate-500"
                    aria-invalid={errors.casela ? "true" : "false"}
                  />
                )}
              />
              {errors.casela && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.casela.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/residents")}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
