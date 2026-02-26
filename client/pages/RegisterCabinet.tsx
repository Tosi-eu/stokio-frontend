import { useState } from "react";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.hook";
import { useQueryClient } from "@tanstack/react-query";
import { useCabinetCategories } from "@/hooks/use-categories.hook";

import { createCabinet, createCabinetCategory } from "@/api/requests";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";

export default function RegisterCabinet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { categories, isLoading: loadingCategories } = useCabinetCategories();

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
        description: "Informe um número de armário válido.",
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

    await createCabinetFlow(existingCategory.id);
  };

  const createCabinetFlow = async (categoryId?: number) => {
    setSaving(true);

    try {
      let finalCategoryId = categoryId;

      if (!finalCategoryId) {
        const res = await createCabinetCategory(category.trim());
        finalCategoryId = res.id;
        await queryClient.invalidateQueries({ queryKey: ["cabinet-categories"] });
      }

      await createCabinet(numero, finalCategoryId);

      toast({
        title: "Armário criado",
        description: `O armário ${numero} foi cadastrado com sucesso.`,
        variant: "success",
      });

      navigate("/cabinets");
    } catch (err) {
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o armário.",
        variant: "error",
      });
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  };

  return (
    <Layout title="Cadastrar Armário">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg border border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 text-center">
            Cadastro de Armário
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <Label>Número do Armário</Label>
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
                list="categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Selecione ou digite uma categoria"
                disabled={saving}
              />

              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c.id} value={c.nome} />
                ))}
              </datalist>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/cabinets")}
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-700 text-white"
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
        onConfirm={() => createCabinetFlow()}
        onCancel={() => setModalOpen(false)}
      />
    </Layout>
  );
}
