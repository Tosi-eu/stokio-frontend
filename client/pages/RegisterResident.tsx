import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/Layout";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast.hook";
import { createResident } from "@/api/requests";
import {
  residentSchema,
  type ResidentFormData,
} from "@/schemas/resident.schema";
import { getErrorMessage } from "@/helpers/validation.helper";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterResident() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: "",
      cpf: "",
      casela: "",
      data_nascimento: "",
    },
  });

  const onSubmit = async (data: ResidentFormData) => {
    try {
      const dn = data.data_nascimento?.trim();
      const cpf = data.cpf?.trim();
      await createResident(
        data.name.trim(),
        data.casela,
        dn && dn !== "" ? dn : undefined,
        cpf && cpf !== "" ? cpf : undefined,
      );

      toast({
        title: "Residente cadastrado",
        description: "O residente foi registrado com sucesso.",
        variant: "success",
        duration: 3000,
      });

      router.push("/residents");
    } catch (err: unknown) {
      toast({
        title: "Erro ao cadastrar",
        description: getErrorMessage(
          err,
          "Não foi possível cadastrar o residente.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Layout title="Cadastro de Residente e Casela">
      <Card className="max-w-lg mx-auto mt-20 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Cadastro de Residente
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
                placeholder="Digite o nome do residente"
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
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register("cpf")}
                placeholder="000.000.000-00"
                disabled={isSubmitting}
                aria-invalid={errors.cpf ? "true" : "false"}
                inputMode="numeric"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Aceita com ou sem pontuação.
              </p>
              {errors.cpf && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.cpf.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="casela">Casela</Label>
              <Input
                id="casela"
                type="number"
                {...register("casela")}
                min={1}
                max={200}
                placeholder="1"
                disabled={isSubmitting}
                aria-invalid={errors.casela ? "true" : "false"}
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
                Opcional. A idade é calculada automaticamente a partir desta
                data.
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
                {isSubmitting ? "Cadastrando..." : "Cadastrar Residente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
