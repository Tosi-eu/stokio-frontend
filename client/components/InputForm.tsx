import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useState, memo, useMemo } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import { ptBR } from "date-fns/locale";

import { InputFormProps } from "@/interfaces/interfaces";
import { toast } from "@/hooks/use-toast.hook";
import { getErrorMessage } from "@/helpers/validation.helper";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import {
  inputFormSchema,
  type InputFormData,
} from "@/schemas/input-form.schema";
import { ItemStockType, StockTypeLabels, SectorType } from "@/utils/enums";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/use-tenant.hook";

function normalizeText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const InputForm = memo(function InputForm({
  inputs,
  caselas,
  cabinets,
  drawers,
  onSubmit,
  isLoading = false,
}: InputFormProps) {
  const { uiDisplay } = useTenant();
  const router = useRouter();
  const [inputOpen, setInputOpen] = useState(false);
  const [caselaOpen, setCaselaOpen] = useState(false);
  const [inputSearch, setInputSearch] = useState("");
  const [caselaSearch, setCaselaSearch] = useState("");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useFormWithZod(inputFormSchema, {
    defaultValues: {
      inputId: undefined,
      quantity: undefined,
      stockType: undefined,
      validity: null,
      casela: null,
      cabinetId: null,
      drawerId: null,
      sector: SectorType.FARMACIA,
      lot: null,
    },
  });

  const stockType = watch("stockType");
  const sector = watch("sector");
  const selectedInputId = watch("inputId");
  const casela = watch("casela");

  const selectedInput = inputs.find((i) => i.id === selectedInputId);
  const isEmergencyCart = stockType === ItemStockType.CARRINHO;
  const isPsychotropicCart = stockType === ItemStockType.CARRINHO_PSICOTROPICOS;
  const isCart = isEmergencyCart || isPsychotropicCart;
  const isIndividual = stockType === ItemStockType.INDIVIDUAL;
  const selectedCasela = caselas.find((c) => c.casela === casela);
  const caselasForSelect = useMemo(() => {
    if (sector === SectorType.ENFERMAGEM) {
      return [...(caselas ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      );
    }
    return caselas ?? [];
  }, [caselas, sector]);

  const filteredInputs = useMemo(() => {
    const s = normalizeText(inputSearch);
    if (!s) return inputs;
    return inputs.filter((i) => normalizeText(i.name ?? "").includes(s));
  }, [inputSearch, inputs]);

  const filteredCaselas = useMemo(() => {
    const s = normalizeText(caselaSearch);
    if (!s) return caselasForSelect;
    return caselasForSelect.filter((c) =>
      normalizeText(`${c.casela} ${c.name}`).includes(s),
    );
  }, [caselaSearch, caselasForSelect]);

  useEffect(() => {
    if (isCart) {
      setValue("sector", SectorType.ENFERMAGEM);
    }
  }, [isCart, setValue]);

  useEffect(() => {
    if (isCart) {
      setValue("cabinetId", null);
    } else {
      setValue("drawerId", null);
    }
  }, [stockType, setValue, isCart]);

  useEffect(() => {
    if (!isIndividual) {
      setValue("casela", null);
    }
  }, [stockType, setValue, isIndividual]);

  const handleInputSelect = (id: number) => {
    setValue("inputId", id);
    setInputOpen(false);
  };

  const onFormSubmit = async (data: InputFormData) => {
    try {
      onSubmit({
        inputId: data.inputId,
        quantity: data.quantity,
        isEmergencyCart: isCart,
        drawerId: data.drawerId ?? undefined,
        cabinetId: data.cabinetId ?? undefined,
        casela: data.casela ?? undefined,
        validity: data.validity ?? undefined,
        stockType: data.stockType,
        sector: data.sector,
        lot: data.lot ?? undefined,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao processar formulário",
        description: getErrorMessage(
          err,
          "Não foi possível processar o formulário.",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  const storageOptions = isCart ? drawers : cabinets;

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-8"
    >
      <div className="bg-accent/50 px-4 py-3 rounded-lg border border-primary/15">
        <h2 className="text-lg font-semibold text-slate-800">
          Informações do Insumo
        </h2>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Nome do Insumo <span className="text-red-500">*</span>
        </label>
        <Controller
          name="inputId"
          control={control}
          render={({ field }) => (
            <>
              <Popover open={inputOpen} onOpenChange={setInputOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between",
                      errors.inputId && "border-red-500",
                    )}
                  >
                    {selectedInput ? selectedInput.name : "Selecione o insumo"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  avoidCollisions={false}
                  className="w-full p-0"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar insumo"
                      value={inputSearch}
                      onValueChange={setInputSearch}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        if (filteredInputs.length !== 1) return;
                        const i = filteredInputs[0]!;
                        e.preventDefault();
                        field.onChange(i.id);
                        handleInputSelect(i.id);
                      }}
                    />
                    <CommandEmpty>Nenhum insumo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {filteredInputs.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={i.name}
                          onSelect={() => {
                            field.onChange(i.id);
                            handleInputSelect(i.id);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedInputId === i.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {i.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.inputId && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.inputId.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Quantidade <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            {...register("quantity", { valueAsNumber: true })}
            min={1}
            max={999999}
            className={cn(
              "w-full border rounded-lg px-3 py-2 text-sm",
              errors.quantity ? "border-red-500" : "border-slate-300",
            )}
          />
          {errors.quantity && (
            <p className="text-sm text-red-500 mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Validade
          </label>
          <Controller
            name="validity"
            control={control}
            render={({ field }) => (
              <DatePicker
                selected={field.value}
                onChange={(date: Date | null) => field.onChange(date)}
                locale={ptBR}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/aaaa"
                allowSameDay={true}
                strictParsing={true}
                showPopperArrow={false}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                calendarClassName="react-datepicker-calendar"
              />
            )}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Setor <span className="text-red-500">*</span>
        </label>
        <select
          {...register("sector")}
          disabled={isCart}
          className={cn(
            "w-full border rounded-lg px-3 py-2 text-sm bg-white",
            errors.sector ? "border-red-500" : "border-slate-300",
            isCart && "bg-slate-100 text-slate-500 cursor-not-allowed",
          )}
        >
          <option value="" disabled hidden>
            Selecione
          </option>
          {Object.values(SectorType).map((s) => (
            <option key={s} value={s}>
              {s === SectorType.FARMACIA ? "Farmácia" : "Enfermagem"}
            </option>
          ))}
        </select>
        {errors.sector && (
          <p className="text-sm text-red-500 mt-1">{errors.sector.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Tipo de Estoque <span className="text-red-500">*</span>
        </label>
        <select
          {...register("stockType")}
          className={cn(
            "w-full border rounded-lg px-3 py-2 text-sm bg-white",
            errors.stockType ? "border-red-500" : "border-slate-300",
          )}
        >
          <option value="" disabled hidden>
            Selecione
          </option>
          {Object.values(ItemStockType).map((t) => (
            <option key={t} value={t}>
              {StockTypeLabels[t]}
            </option>
          ))}
        </select>
        {errors.stockType && (
          <p className="text-sm text-red-500 mt-1">
            {errors.stockType.message}
          </p>
        )}
      </div>

      <div
        className={cn(
          "grid gap-6",
          sector === SectorType.ENFERMAGEM
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2",
        )}
      >
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-slate-700">
            {sector === SectorType.ENFERMAGEM ? "Casela (residente)" : "Casela"}
          </label>
          <Controller
            name="casela"
            control={control}
            render={({ field }) => (
              <>
                <Popover open={caselaOpen} onOpenChange={setCaselaOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      disabled={!isIndividual}
                      className={cn(
                        "w-full justify-between bg-white",
                        errors.casela && "border-red-500",
                        !isIndividual &&
                          "bg-slate-100 text-slate-500 cursor-not-allowed",
                      )}
                    >
                      {field.value != null && selectedCasela
                        ? uiDisplay.casela === "nome"
                          ? `${selectedCasela.name} (${selectedCasela.casela})`
                          : String(selectedCasela.casela)
                        : uiDisplay.casela === "nome"
                          ? "Buscar por nome do residente..."
                          : "Selecione a casela"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    avoidCollisions={false}
                    className="w-full p-0"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={
                          uiDisplay.casela === "nome"
                            ? "Buscar por nome ou número..."
                            : "Buscar por número ou nome..."
                        }
                        value={caselaSearch}
                        onValueChange={setCaselaSearch}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          if (filteredCaselas.length !== 1) return;
                          const c = filteredCaselas[0]!;
                          e.preventDefault();
                          field.onChange(c.casela);
                          setCaselaOpen(false);
                        }}
                      />
                      <CommandEmpty>Nenhuma casela encontrada.</CommandEmpty>
                      <CommandGroup>
                        {filteredCaselas.map((c) => {
                          const primary =
                            uiDisplay.casela === "nome"
                              ? c.name
                              : String(c.casela);
                          const searchValue = `${c.casela} ${c.name}`;
                          return (
                            <CommandItem
                              key={c.casela}
                              value={searchValue}
                              onSelect={() => {
                                field.onChange(c.casela);
                                setCaselaOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === c.casela
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {primary}
                              <span className="ml-2 text-slate-500 text-xs">
                                {uiDisplay.casela === "nome"
                                  ? `(${c.casela})`
                                  : c.name}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.casela && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.casela.message}
                  </p>
                )}
              </>
            )}
          />
        </div>
        {sector === SectorType.FARMACIA && (
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Residente
            </label>
            <input
              type="text"
              value={selectedCasela?.name || ""}
              readOnly
              disabled={!isIndividual}
              className={cn(
                "w-full border rounded-lg px-3 py-2 text-sm",
                !isIndividual
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                  : "bg-slate-50 border-slate-200",
              )}
            />
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-700">
          {isCart ? "Gaveta" : "Armário"}{" "}
          <span className="text-red-500">*</span>
        </label>
        {isCart ? (
          <>
            <select
              {...register("drawerId", { valueAsNumber: true })}
              className={cn(
                "w-full border rounded-lg px-3 py-2 text-sm bg-white",
                errors.drawerId ? "border-red-500" : "border-slate-300",
              )}
            >
              <option value="">Selecione</option>
              {storageOptions.map((s) => (
                <option key={s.numero} value={s.numero}>
                  {s.numero}
                </option>
              ))}
            </select>
            {errors.drawerId && (
              <p className="text-sm text-red-500 mt-1">
                {errors.drawerId.message}
              </p>
            )}
          </>
        ) : (
          <>
            <select
              {...register("cabinetId", { valueAsNumber: true })}
              className={cn(
                "w-full border rounded-lg px-3 py-2 text-sm bg-white",
                errors.cabinetId ? "border-red-500" : "border-slate-300",
              )}
            >
              <option value="">Selecione</option>
              {storageOptions.map((s) => (
                <option key={s.numero} value={s.numero}>
                  {s.numero}
                </option>
              ))}
            </select>
            {errors.cabinetId && (
              <p className="text-sm text-red-500 mt-1">
                {errors.cabinetId.message}
              </p>
            )}
          </>
        )}
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-700">Lote</label>
        <input
          type="text"
          {...register("lot")}
          maxLength={100}
          placeholder="Ex: L2024-01"
          className={cn(
            "w-full border rounded-lg px-3 py-2 text-sm",
            errors.lot ? "border-red-500" : "border-slate-300",
          )}
        />
        {errors.lot && (
          <p className="text-sm text-red-500 mt-1">{errors.lot.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.push("/stock")}
          className="px-5 py-2 border border-slate-400 rounded-lg text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm transition-colors",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90",
          )}
        >
          {isLoading ? "Processando..." : "Confirmar"}
        </button>
      </div>
    </form>
  );
});
