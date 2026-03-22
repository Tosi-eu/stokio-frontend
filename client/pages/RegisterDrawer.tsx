import { useState } from "react";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.hook";
import { useQueryClient } from "@tanstack/react-query";
import { useDrawerCategories } from "@/hooks/use-categories.hook";

import { createDrawer, createDrawerCategory } from "@/api/requests";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import { getErrorMessage } from "@/helpers/validation.helper";

export default function RegisterDrawer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { categories } = useDrawerCategories();

  const [numero, setNumero] = useState<number>(0);
  const [category, setCategory] = useState("");

  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const findCategoryByName = (name: string) =>
    categories.find((c) => c.nome.toLowerCase() === name.trim().toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numero || numero <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe um número de gaveta válido.",
        variant: "warning",
      });
      return;
    }

    if (!category.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe uma categoria.",
        variant: "warning",
      });
      return;
    }

    const existingCategory = findCategoryByName(category);

    if (!existingCategory) {
      setModalOpen(true);
      return;
    }

    await createDrawerFlow(existingCategory.id);
  };

  const createDrawerFlow = async (categoryId?: number) => {
    setSaving(true);

    try {
      let finalCategoryId = categoryId;

      if (!finalCategoryId) {
        const res = await createDrawerCategory(category.trim());
        finalCategoryId = res.id;
        await queryClient.invalidateQueries({
          queryKey: ["drawer-categories"],
        });
      }

      await createDrawer(numero, finalCategoryId);

      toast({
        title: "Gaveta criada",
        description: `A gaveta ${numero} foi cadastrada com sucesso.`,
        variant: "success",
      });

      navigate("/drawers");
    } catch (err) {
      toast({
        title: "Erro ao cadastrar",
        description:
          "Não foi possível cadastrar a gaveta: " + getErrorMessage(err),
        variant: "error",
      });
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  };

  return (
    <Layout title="Cadastrar Gaveta">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg border border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 text-center">
            Cadastro de Gaveta
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <Label>Número da Gaveta</Label>
              <Input
                type="number"
                placeholder="Ex: 4"
                value={numero || ""}
                onChange={(e) =>
                  setNumero(e.target.value === "" ? 0 : Number(e.target.value))
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input
                list="drawer-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Selecione ou digite uma categoria"
                disabled={saving}
              />

              <datalist id="drawer-categories">
                {categories.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/drawers")}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ConfirmationModal
        open={modalOpen}
        categoryName={category}
        onConfirm={() => createDrawerFlow()}
        onCancel={() => setModalOpen(false)}
      />
    </Layout>
  );
}
