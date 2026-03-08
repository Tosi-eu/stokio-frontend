import { useEffect, useState, useMemo } from "react";
import { Controller } from "react-hook-form";
import Layout from "@/components/Layout";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import {
  editStockSchema,
  type EditStockFormData,
} from "@/schemas/edit-stock.schema";
import { updateStockItem } from "@/api/requests";
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
import { StockItem } from "@/interfaces/interfaces";
import { Cabinet, Drawer, Patient } from "@/interfaces/interfaces";
import {
  SectorType,
  OriginType,
  ItemStockType,
  StockTypeLabels,
} from "@/utils/enums";
import { useEditStockData } from "@/hooks/use-edit-stock-data.hook";
import ConfirmActionModal from "@/components/ConfirmationActionModal";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { parseDateFromString } from "@/utils/utils";
import { SkeletonForm } from "@/components/SkeletonForm";

export default function EditStock() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    cabinets,
    drawers,
    residents,
    isLoading: loadingData,
  } = useEditStockData();
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isMedicine = stockItem?.itemType === "medicamento";

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormWithZod(editStockSchema, {
    defaultValues: {
      quantidade: 0,
      armario_id: null,
      gaveta_id: null,
      validade: null,
      origem: null,
      setor: SectorType.FARMACIA,
      lote: null,
      casela_id: null,
      tipo: ItemStockType.GERAL,
      preco: "",
      observacao: null,
      dias_para_repor: null,
    },
  });

  const watchedArmarioId = watch("armario_id");
  const watchedGavetaId = watch("gaveta_id");
  const watchedCaselaId = watch("casela_id");
  const watchedTipo = watch("tipo");

  useEffect(() => {
    if (!location.state?.item || loadingData) return;
    const item = location.state.item as StockItem;
    const loadData = () => {
      try {
        setStockItem(item);

        let validadeDate: Date | null = null;
        if (item.expiry && item.expiry !== "-") {
          if (item.expiry.includes("/")) {
            validadeDate = parseDateFromString(item.expiry);
          } else {
            const parsed = new Date(item.expiry);
            validadeDate = isNaN(parsed.getTime()) ? null : parsed;
          }
        }

        let rawTipo = item.tipo || "";
        if (!rawTipo && item.stockType) {
          const tipoMap: Record<string, string> = {
            "Estoque geral": "geral",
            "Estoque individual": "individual",
            "Carrinho de emergência": "carrinho_emergencia",
          };
          rawTipo = tipoMap[item.stockType] || "";
        }

        let validTipo: ItemStockType = ItemStockType.GERAL;
        if (
          rawTipo === ItemStockType.GERAL ||
          rawTipo === ItemStockType.INDIVIDUAL ||
          rawTipo === ItemStockType.CARRINHO ||
          rawTipo === ItemStockType.CARRINHO_PSICOTROPICOS
        ) {
          validTipo = rawTipo as ItemStockType;
        }

        const isMedicineItem = item.itemType === "medicamento";
        reset({
          quantidade: item.quantity || 0,
          armario_id: typeof item.cabinet === "number" ? item.cabinet : null,
          gaveta_id: typeof item.drawer === "number" ? item.drawer : null,
          validade: validadeDate,
          origem: isMedicineItem
            ? (item.origin as OriginType) || null
            : undefined,
          setor: (item.sector as SectorType) || SectorType.FARMACIA,
          lote: item.lot || null,
          casela_id: typeof item.casela === "number" ? item.casela : null,
          tipo: validTipo,
          preco: item.preco ? item.preco.toFixed(2).replace(".", ",") : "",
          observacao: item.detail ?? "",
          dias_para_repor: item.daysToReplacement ?? null,
        });
      } catch (err: unknown) {
        toast({
          title: "Erro",
          description: getErrorMessage(err, "Erro ao carregar dados"),
          variant: "error",
          duration: 3000,
        });
        navigate("/stock");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state, loadingData, navigate, reset]);

  useEffect(() => {
    if (watchedGavetaId !== null) {
      setValue("setor", SectorType.ENFERMAGEM);
      setValue("tipo", ItemStockType.CARRINHO);
      setValue("armario_id", null);
      setValue("casela_id", null);
    }
  }, [watchedGavetaId, setValue, isMedicine]);

  useEffect(() => {
    if (watchedCaselaId !== null) {
      setValue("tipo", ItemStockType.INDIVIDUAL);
    }
  }, [watchedCaselaId, setValue]);

  useEffect(() => {
    if (watchedArmarioId === null) {
      setValue("casela_id", null);
    }
  }, [watchedArmarioId, setValue]);

  useEffect(() => {
    if (
      watchedTipo === ItemStockType.CARRINHO ||
      watchedTipo === ItemStockType.CARRINHO_PSICOTROPICOS
    ) {
      setValue("setor", SectorType.ENFERMAGEM);
    }
  }, [watchedTipo, setValue]);
  const onSubmit = async (data: EditStockFormData) => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!stockItem) return;

    try {
      const formData = watch();

      const updatePayload: Record<string, unknown> = {
        quantidade: formData.quantidade,
        armario_id: formData.armario_id,
        gaveta_id: formData.gaveta_id,
        validade: formData.validade
          ? formData.validade.toISOString().split("T")[0]
          : null,
        setor: formData.setor,
        lote: formData.lote || null,
        casela_id: formData.casela_id,
        tipo: formData.tipo,
        preco:
          formData.preco && formData.preco.trim() !== ""
            ? parseFloat(formData.preco.replace(",", "."))
            : null,
        observacao: formData.observacao || null,
        dias_para_repor: formData.dias_para_repor ?? null,
      };

      const result = await updateStockItem(
        stockItem.id,
        stockItem.itemType === "medicamento" ? "medicamento" : "insumo",
        updatePayload,
      );

      const message =
        (result as { message?: string } | undefined)?.message ??
        "O item de estoque foi atualizado com sucesso.";
      toast({
        title: "Item atualizado",
        description: message,
        variant: "success",
        duration: 3000,
      });

      navigate("/stock");
    } catch (err: unknown) {
      toast({
        title: "Erro ao atualizar",
        description: getErrorMessage(err, "Erro ao atualizar item de estoque"),
        variant: "error",
        duration: 3000,
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  if (loading || loadingData) {
    return (
      <Layout title="Editar Estoque">
        <SkeletonForm />
      </Layout>
    );
  }

  if (!stockItem) {
    return null;
  }

  const selectedResident = residents.find((r) => r.casela === watchedCaselaId);

  const caselaResidentsList = useMemo(() => {
    if (stockItem?.sector === "enfermagem") {
      return [...residents].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      );
    }
    return residents;
  }, [residents, stockItem?.sector]);

  return (
    <Layout title="Editar Item de Estoque">
      <Card className="max-w-2xl mx-auto mt-10 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Editar Item de Estoque
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            {stockItem.name}{" "}
            {isMedicine &&
              stockItem.activeSubstance &&
              `- ${stockItem.activeSubstance}`}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                {...register("quantidade", { valueAsNumber: true })}
                min={1}
                max={999999}
                disabled={isSubmitting}
                aria-invalid={errors.quantidade ? "true" : "false"}
              />
              {errors.quantidade && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.quantidade.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="armario_id">Armário</Label>
                <Controller
                  name="armario_id"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value?.toString() ?? "none"}
                        onValueChange={(v) => {
                          const value = v === "none" ? null : Number(v);
                          field.onChange(value);
                          if (value === null) {
                            setValue("casela_id", null);
                          }
                        }}
                        disabled={isSubmitting || watchedGavetaId !== null}
                      >
                        <SelectTrigger className="bg-white" id="armario_id">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {cabinets.map((cabinet) => (
                            <SelectItem
                              key={cabinet.numero}
                              value={cabinet.numero.toString()}
                            >
                              Armário {cabinet.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.armario_id && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.armario_id.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gaveta_id">Gaveta</Label>
                <Controller
                  name="gaveta_id"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value?.toString() ?? "none"}
                        onValueChange={(v) => {
                          const value = v === "none" ? null : Number(v);
                          field.onChange(value);
                        }}
                        disabled={isSubmitting || watchedArmarioId !== null}
                      >
                        <SelectTrigger className="bg-white" id="gaveta_id">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {drawers.map((drawer) => (
                            <SelectItem
                              key={drawer.numero}
                              value={drawer.numero.toString()}
                            >
                              Gaveta {drawer.numero}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.gaveta_id && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.gaveta_id.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="casela_id">Casela</Label>
                <Controller
                  name="casela_id"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value?.toString() ?? "none"}
                        onValueChange={(v) => {
                          const value = v === "none" ? null : Number(v);
                          field.onChange(value);
                        }}
                        disabled={
                          isSubmitting ||
                          watchedGavetaId !== null ||
                          watchedArmarioId === null
                        }
                      >
                        <SelectTrigger className="bg-white" id="casela_id">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {caselaResidentsList.map((resident) => (
                            <SelectItem
                              key={resident.casela}
                              value={resident.casela.toString()}
                            >
                              {stockItem?.sector === "enfermagem"
                                ? resident.name
                                : resident.casela}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.casela_id && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.casela_id.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="resident_name">Residente</Label>
                <Input
                  id="resident_name"
                  type="text"
                  value={selectedResident?.name || ""}
                  readOnly
                  className="bg-slate-50 text-slate-500"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validade">Validade:</Label>
              <Controller
                name="validade"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date: Date | null) => field.onChange(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    placeholderText="Selecione a data"
                    allowSameDay={true}
                    strictParsing={true}
                    showPopperArrow={false}
                    className="w-full border rounded-lg p-2"
                    calendarClassName="react-datepicker-calendar"
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.validade && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.validade.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isMedicine && (
                <div className="space-y-1">
                  <Label htmlFor="origem">Origem</Label>
                  <Controller
                    name="origem"
                    control={control}
                    render={({ field }) => (
                      <>
                        <Select
                          value={field.value || "none"}
                          onValueChange={(v) => {
                            field.onChange(
                              v === "none" ? null : (v as OriginType),
                            );
                          }}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="bg-white" id="origem">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {Object.values(OriginType).map((origin) => (
                              <SelectItem key={origin} value={origin}>
                                {origin}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.origem && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.origem.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="tipo">Tipo</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                        required
                      >
                        <SelectTrigger className="bg-white" id="tipo">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ItemStockType).map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {StockTypeLabels[
                                tipo as keyof typeof StockTypeLabels
                              ] || tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.tipo && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.tipo.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="setor">Setor</Label>
                <Controller
                  name="setor"
                  control={control}
                  render={({ field }) => {
                    const isCart =
                      watchedTipo === ItemStockType.CARRINHO ||
                      watchedTipo === ItemStockType.CARRINHO_PSICOTROPICOS;
                    return (
                      <>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting || isCart}
                          required
                        >
                          <SelectTrigger
                            className={`bg-white ${isCart ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                            id="setor"
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(SectorType).map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector === SectorType.FARMACIA
                                  ? "Farmácia"
                                  : "Enfermagem"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.setor && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.setor.message}
                          </p>
                        )}
                      </>
                    );
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lote">Lote</Label>
                <Input
                  id="lote"
                  {...register("lote")}
                  maxLength={50}
                  disabled={isSubmitting}
                  placeholder="Número do lote"
                />
                {errors.lote && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.lote.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Input
                    id="observacao"
                    {...register("observacao")}
                    maxLength={255}
                    disabled={isSubmitting}
                    placeholder="Observações adicionais"
                  />
                  {errors.observacao && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.observacao.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dias_para_repor">Dias para repor</Label>
                  <Input
                    id="dias_para_repor"
                    type="number"
                    {...register("dias_para_repor", { valueAsNumber: true })}
                    min={0}
                    disabled={isSubmitting}
                    placeholder="Ex: 30"
                  />
                  {errors.dias_para_repor && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.dias_para_repor.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input
                  id="preco"
                  type="text"
                  {...register("preco")}
                  disabled={isSubmitting}
                  placeholder="0,00"
                  aria-invalid={errors.preco ? "true" : "false"}
                />
                {errors.preco && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.preco.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/stock")}
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

      <ConfirmActionModal
        open={confirmOpen}
        title="Confirmar Edição de Estoque"
        description="Tem certeza que deseja editar este item de estoque? Esta ação não pode ser desfeita."
        confirmLabel="Confirmar Edição"
        cancelLabel="Cancelar"
        loading={isSubmitting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
}
