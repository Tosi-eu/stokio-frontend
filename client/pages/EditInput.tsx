import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { editInputSchema } from "@/schemas/edit-input.schema";
import { updateInput } from "@/api/requests";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function EditInput() {
  const location = useLocation();
  const navigate = useNavigate();

  const [inputId, setInputId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useFormWithZod(editInputSchema, {
    defaultValues: {
      nome: "",
      descricao: "",
      estoque_minimo: "",
    },
  });

  useEffect(() => {
    const item = location.state?.item;

    if (!item || !item.id) {
      toast({
        title: "Erro",
        description: "Nenhum insumo foi selecionado para edição.",
        variant: "error",
        duration: 3000,
      });
      navigate("/inputs");
      return;
    }

    const id = setTimeout(() => {
      setInputId(item.id);
      reset({
        nome: item.nome || "",
        descricao: item.descricao || "",
        estoque_minimo: item.estoque_minimo?.toString() || "0",
      });
    }, 0);
    return () => clearTimeout(id);
  }, [location.state, navigate, reset]);

  const onSubmit = async (data: {
    nome: string;
    descricao: string;
    estoque_minimo: string;
  }) => {
    if (!inputId) {
      toast({
        title: "Erro",
        description: "Insumo não identificado.",
        variant: "error",
        duration: 3000,
      });
      return;
    }

    try {
      await updateInput(inputId, {
        nome: data.nome.trim(),
        descricao: data.descricao.trim() || "",
        estoque_minimo: Number(data.estoque_minimo) || 0,
      });

      toast({
        title: "Insumo atualizado",
        description: `${data.nome} foi atualizado com sucesso.`,
        variant: "success",
        duration: 3000,
      });

      navigate("/inputs");
    } catch (err: unknown) {
      toast({
        title: "Erro ao atualizar",
        description: getErrorMessage(
          err,
          "Não foi possível atualizar o insumo.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Edição de Insumo">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Editar Insumo
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome do insumo</Label>
              <Input
                id="nome"
                {...register("nome")}
                maxLength={255}
                placeholder="Ex: Seringa 5ml"
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
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                {...register("descricao")}
                maxLength={1000}
                placeholder="Ex: Material de injeção"
                disabled={isSubmitting}
                aria-invalid={errors.descricao ? "true" : "false"}
              />
              {errors.descricao && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.descricao.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="estoque_minimo">Estoque mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                {...register("estoque_minimo")}
                min={0}
                max={999999}
                placeholder="Ex: 10"
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
                onClick={() => navigate("/inputs")}
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
