import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { consumeSpaNavigationState } from "@/helpers/spa-navigation-state.helper";
import Layout from "@/components/Layout";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import {
  residentSchema,
  type ResidentFormData,
} from "@/schemas/resident.schema";
import { getResidentByCasela, updateResident } from "@/api/requests";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function EditResident() {
  const router = useRouter();
  const [item] = useState(
    () =>
      consumeSpaNavigationState<{
        item?: {
          name?: string;
          casela?: number;
          data_nascimento?: string | null;
        };
      }>()?.item,
  );

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
      data_nascimento: "",
    },
  });

  useEffect(() => {
    if (!item?.casela) {
      toast({
        title: "Nenhum residente selecionado",
        description: "Volte à lista e escolha um residente para editar.",
        variant: "warning",
        duration: 3000,
      });
      router.push("/residents");
      return;
    }

    void getResidentByCasela(item.casela)
      .then((r) => {
        reset({
          name: r.name ?? "",
          casela: String(r.casela),
          data_nascimento: r.data_nascimento ?? "",
        });
      })
      .catch(() => {
        reset({
          name: item.name || "",
          casela: String(item.casela),
          data_nascimento:
            typeof item.data_nascimento === "string"
              ? item.data_nascimento
              : "",
        });
      });
  }, [item, router, reset]);

  const onSubmit = async (data: ResidentFormData) => {
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
      const dn = data.data_nascimento?.trim() ?? "";
      await updateResident(data.casela, {
        nome: data.name.trim(),
        data_nascimento: dn === "" ? null : dn,
      });

      toast({
        title: "Residente atualizado",
        description: `O residente ${data.name.trim()} foi atualizado com sucesso!`,
        variant: "success",
        duration: 3000,
      });

      router.push("/residents");
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

            <div className="space-y-1">
              <Label htmlFor="data_nascimento">Data de nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                {...register("data_nascimento")}
                disabled={isSubmitting}
                aria-invalid={errors.data_nascimento ? "true" : "false"}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para remover. A idade é calculada
                automaticamente.
              </p>
              {errors.data_nascimento && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.data_nascimento.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/residents")}
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
