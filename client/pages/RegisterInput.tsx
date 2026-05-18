import { useState } from "react";
import { useForm } from "react-hook-form";
import { DisplayNamePreview } from "@/components/DisplayNamePreview";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { createInput } from "@/api/requests";
import { inputSchema, type InputFormData } from "@/schemas/input.schema";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterInput() {
  const router = useRouter();
  const [namePreview, setNamePreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InputFormData>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      name: "",
      description: "",
      minimum: "",
    },
  });

  const onSubmit = async (data: InputFormData) => {
    try {
      await createInput(
        data.name.trim(),
        data.description.trim(),
        Number(data.minimum) || 0,
        data.price ? Number(data.price) : null,
      );

      toast({
        title: "Insumo cadastrado",
        description: `${data.name} foi adicionado ao sistema.`,
        variant: "success",
        duration: 3000,
      });

      router.push("/inputs");
    } catch (err: unknown) {
      toast({
        title: "Erro ao cadastrar insumo",
        description: getErrorMessage(
          err,
          "Não foi possível salvar o insumo no banco.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Cadastro de Insumo">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Cadastro de Insumo
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="name">Nome do insumo</Label>
              <Input
                id="name"
                {...register("name", {
                  onBlur: (e) => setNamePreview(e.target.value),
                })}
                maxLength={255}
                placeholder="Seringa 5ml"
                disabled={isSubmitting}
                aria-invalid={errors.name ? "true" : "false"}
              />
              <DisplayNamePreview value={namePreview} />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                {...register("description")}
                maxLength={1000}
                placeholder="Material de Injeção"
                disabled={isSubmitting}
                aria-invalid={errors.description ? "true" : "false"}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="minimum">Estoque mínimo</Label>
              <Input
                id="minimum"
                type="number"
                {...register("minimum")}
                min={0}
                max={999999}
                placeholder="5"
                disabled={isSubmitting}
                aria-invalid={errors.minimum ? "true" : "false"}
              />
              {errors.minimum && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.minimum.message}
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
                onClick={() => router.push("/inputs")}
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
