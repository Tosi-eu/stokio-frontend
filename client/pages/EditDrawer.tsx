import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";
import { consumeSpaNavigationState } from "@/helpers/spa-navigation-state.helper";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { drawerSchema } from "@/schemas/drawer.schema";

import { getDrawers, updateDrawer, getDrawerCategories } from "@/api/requests";
import { Drawer } from "@/interfaces/interfaces";

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

export default function EditDrawer() {
  const router = useRouter();

  const [item] = useState(() => {
    const s = consumeSpaNavigationState<{ item?: Drawer }>();
    return s?.item as Drawer | undefined;
  });

  const [drawers, setDrawers] = useState<Drawer[]>([]);
  const [categories, setCategories] = useState<{ id: number; nome: string }[]>(
    [],
  );

  const {
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useFormWithZod(drawerSchema, {
    defaultValues: {
      numero: "",
      categoria_id: "",
    },
  });

  const watchedNumero = watch("numero");

  useEffect(() => {
    getDrawers()
      .then((res) => setDrawers(res.data))
      .catch(() =>
        toast({
          title: "Erro ao carregar gavetas",
          description: "Não foi possível carregar a lista de gavetas.",
          variant: "error",
          duration: 3000,
        }),
      );
  }, []);

  useEffect(() => {
    getDrawerCategories(1, 20)
      .then((res) => setCategories(res.data))
      .catch(() =>
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias de gavetas.",
          variant: "error",
          duration: 3000,
        }),
      );
  }, []);

  useEffect(() => {
    if (item && drawers.length > 0 && categories.length > 0) {
      const dr = drawers.find((d) => d.numero === item.numero);

      if (dr) {
        const matchedCategory = categories.find((c) => c.nome === dr.categoria);

        reset({
          numero: dr.numero.toString(),
          categoria_id: matchedCategory?.id.toString() ?? "",
        });
      }
    }
  }, [item, drawers, categories, reset]);

  useEffect(() => {
    if (watchedNumero && drawers.length > 0 && categories.length > 0) {
      const dr = drawers.find((d) => d.numero === Number(watchedNumero));
      if (dr) {
        const matchedCategory = categories.find((c) => c.nome === dr.categoria);
        if (matchedCategory) {
          reset({
            numero: watchedNumero,
            categoria_id: matchedCategory.id.toString(),
          });
        }
      }
    }
  }, [watchedNumero, drawers, categories, reset]);

  const onSubmit = async (data: { numero: string; categoria_id: string }) => {
    if (!data.numero || !data.categoria_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma gaveta e uma categoria.",
        variant: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      await updateDrawer(Number(data.numero), Number(data.categoria_id));

      toast({
        title: "Gaveta atualizada",
        description: `A gaveta ${data.numero} foi atualizada com sucesso.`,
        variant: "success",
        duration: 3000,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao editar gaveta",
        description: getErrorMessage(
          err,
          "Não foi possível atualizar a gaveta.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Editar Gaveta">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Editar Gaveta
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="numero">Gaveta</Label>
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
                        <SelectValue placeholder="Selecione a gaveta" />
                      </SelectTrigger>
                      <SelectContent>
                        {drawers.map((d) => (
                          <SelectItem key={d.numero} value={String(d.numero)}>
                            Gaveta {d.numero} ({d.categoria})
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
                  <Label htmlFor="numero-display">Número da gaveta</Label>
                  <Input
                    id="numero-display"
                    type="number"
                    value={watchedNumero}
                    disabled
                    className="bg-slate-100 text-slate-500"
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
                    onClick={() => router.push("/drawers")}
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
