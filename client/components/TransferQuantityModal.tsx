import { FC, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  getDaysForReplacementForNursing,
  listAccessibleTenants,
  listTenantSetoresInTenantContext,
  type AccessibleTenantRow,
  type TenantSetorRow,
  type InterTenantMedicineTransferPayload,
} from "@/api/requests";
import { useTenant } from "@/hooks/use-tenant.hook";
import { caselaModeForContext } from "@/helpers/ui-display.helper";
import { ItemStockType } from "@/utils/enums";

export type InterTenantTransferModalPayload = Omit<
  InterTenantMedicineTransferPayload,
  "sourceEstoqueId"
>;

interface TransferQuantityModalProps {
  open: boolean;
  item: {
    name: string;
    quantity: number;
    sector: string;
    itemType?: "medicamento" | "insumo";
    isGeneralMedicine?: boolean;
    casela?: number | null;
    daysToReplacement?: number | null;
    medicamentoId?: number | null;
    estoqueId?: number;
    tipo?: string;
    expiry?: string;
    lot?: string | null;
  } | null;
  residents?: Array<{ casela: number; name: string }>;
  onConfirm: (
    quantity: number,
    casela?: number | null,
    destino?: string | null,
    details?: string | null,
    options?: {
      bypassCasela: boolean;
      dias_para_repor: number | null;
    },
  ) => void;
  onConfirmInterTenant?: (payload: InterTenantTransferModalPayload) => void;
  enableInterTenant?: boolean;
  onCancel: () => void;
  loading?: boolean;
}

const STOCK_TYPES = Object.values(ItemStockType);

const TransferQuantityModal: FC<TransferQuantityModalProps> = ({
  open,
  item,
  residents = [],
  onConfirm,
  onConfirmInterTenant,
  enableInterTenant = false,
  onCancel,
  loading = false,
}) => {
  const { uiDisplay, tenantId } = useTenant();
  const [quantity, setQuantity] = useState("");
  const [selectedCasela, setSelectedCasela] = useState("");
  const [caselaOpen, setCaselaOpen] = useState(false);
  const [caselaSearch, setCaselaSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [details, setDetails] = useState("");
  const [isGeneralUse, setIsGeneralUse] = useState(false);
  const [daysToReplacement, setDaysToReplacement] = useState("");
  const [fetchedDiasParaRepor, setFetchedDiasParaRepor] = useState<
    number | null
  >(null);

  /** Envio para outro tenant (medicamentos, mesma linha de stock) */
  const [sendToOtherTenant, setSendToOtherTenant] = useState(false);

  const [accessibleTenants, setAccessibleTenants] = useState<
    AccessibleTenantRow[]
  >([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [destSlug, setDestSlug] = useState("");
  const [destSetores, setDestSetores] = useState<TenantSetorRow[]>([]);
  const [destSetorKey, setDestSetorKey] = useState("");
  const [destTipoLocal, setDestTipoLocal] = useState<string>(
    ItemStockType.GERAL,
  );
  const [destArmarioStr, setDestArmarioStr] = useState("");
  const [destGavetaStr, setDestGavetaStr] = useState("");

  const allowInterTenantFlow =
    Boolean(enableInterTenant) &&
    (item?.itemType === "medicamento" || item?.itemType === "insumo") &&
    typeof onConfirmInterTenant === "function";

  const caselaForDaysFetch = selectedCasela
    ? Number(selectedCasela)
    : item?.sector === "farmacia" && item?.casela != null
      ? item.casela
      : null;

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setQuantity("");
      setSelectedCasela("");
      setDestination("");
      setDetails("");
      setCaselaSearch("");
      setIsGeneralUse(false);
      setFetchedDiasParaRepor(null);
      setDaysToReplacement(
        item?.daysToReplacement != null ? String(item.daysToReplacement) : "",
      );
      setSendToOtherTenant(false);
      setDestSlug("");
      setDestSetores([]);
      setDestSetorKey("");
      setDestTipoLocal(item?.tipo ?? ItemStockType.GERAL);
      setDestArmarioStr("");
      setDestGavetaStr("");
    }, 0);
    return () => clearTimeout(id);
  }, [open, item?.daysToReplacement, item?.tipo]);

  useEffect(() => {
    if (!open || !allowInterTenantFlow || !sendToOtherTenant) return;
    let cancelled = false;
    setTenantsLoading(true);
    listAccessibleTenants()
      .then((r) => {
        if (cancelled) return;
        const list = (r.tenants ?? []).filter(
          (t) => tenantId == null || t.id !== tenantId,
        );
        setAccessibleTenants(list);
      })
      .catch(() => {
        if (!cancelled) setAccessibleTenants([]);
      })
      .finally(() => {
        if (!cancelled) setTenantsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, allowInterTenantFlow, sendToOtherTenant, tenantId]);

  useEffect(() => {
    if (!destSlug.trim()) {
      setDestSetores([]);
      setDestSetorKey("");
      return;
    }
    let cancelled = false;
    listTenantSetoresInTenantContext(destSlug)
      .then((r) => {
        if (cancelled) return;
        const rows = r.data ?? [];
        setDestSetores(rows);
        setDestSetorKey((prev) => {
          if (rows.some((x) => x.key === prev)) return prev;
          return rows[0]?.key ?? "";
        });
      })
      .catch(() => {
        if (!cancelled) {
          setDestSetores([]);
          setDestSetorKey("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [destSlug]);

  useEffect(() => {
    if (
      !open ||
      sendToOtherTenant ||
      !item?.medicamentoId ||
      caselaForDaysFetch == null ||
      isGeneralUse ||
      item.itemType !== "medicamento"
    ) {
      const id = setTimeout(() => setFetchedDiasParaRepor(null), 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    getDaysForReplacementForNursing(item.medicamentoId, caselaForDaysFetch)
      .then((res: { dias_para_repor?: number | null }) => {
        if (cancelled) return;
        if (res.dias_para_repor != null) {
          setFetchedDiasParaRepor(Number(res.dias_para_repor));
          setDaysToReplacement(String(res.dias_para_repor));
        } else {
          setFetchedDiasParaRepor(null);
          setDaysToReplacement(
            item?.daysToReplacement != null
              ? String(item.daysToReplacement)
              : "",
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFetchedDiasParaRepor(null);
        setDaysToReplacement(
          item?.daysToReplacement != null ? String(item.daysToReplacement) : "",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [
    open,
    sendToOtherTenant,
    item?.medicamentoId,
    item?.itemType,
    item?.daysToReplacement,
    caselaForDaysFetch,
    isGeneralUse,
  ]);

  const maxQuantity = item?.quantity || 0;
  const quantityNum = parseInt(quantity, 10);
  const isValidQuantity = quantityNum > 0 && quantityNum <= maxQuantity;
  const isIndividualStock = item?.casela != null;
  const isInput = item?.itemType === "insumo";
  const isMedicamento = item?.itemType === "medicamento";
  const isIndividual = item?.casela != null;
  const isMedicamentoGeral = isMedicamento && item?.isGeneralMedicine === true;
  const isInsumoGeral = isInput && !isIndividual;
  const hasCaselaSelected = selectedCasela.length > 0;
  const hasDestination = destination.trim().length > 0;

  const suggestedDiasParaRepor = fetchedDiasParaRepor ?? null;

  const hasValidCaselaForDaysToReplacement =
    isIndividualStock || (isMedicamento && !isGeneralUse && hasCaselaSelected);

  const hasValidDiasValue =
    suggestedDiasParaRepor != null ||
    (hasValidCaselaForDaysToReplacement && daysToReplacement !== "");

  const isValidDaysToReplacement =
    !hasValidCaselaForDaysToReplacement ||
    hasValidDiasValue ||
    daysToReplacement === "";

  const canConfirmSector =
    isValidQuantity &&
    isValidDaysToReplacement &&
    (isIndividual ||
      (isMedicamentoGeral && (isGeneralUse || hasCaselaSelected)) ||
      (isInsumoGeral && (hasCaselaSelected || hasDestination)));

  const armarioNum = destArmarioStr.trim() ? Number(destArmarioStr) : NaN;
  const gavetaNum = destGavetaStr.trim() ? Number(destGavetaStr) : NaN;
  const hasDestLocation =
    (Number.isFinite(armarioNum) && armarioNum > 0) ||
    (Number.isFinite(gavetaNum) && gavetaNum > 0);

  const canConfirmInter =
    isValidQuantity &&
    Boolean(destSlug.trim()) &&
    Boolean(destSetorKey.trim()) &&
    destSetores.some((s) => s.key === destSetorKey) &&
    Boolean(destTipoLocal.trim()) &&
    hasDestLocation;

  const handleConfirmSector = () => {
    if (!canConfirmSector) return;

    const casela = isIndividualStock
      ? item.casela
      : isGeneralUse
        ? null
        : selectedCasela
          ? Number(selectedCasela)
          : null;

    const destino =
      (isIndividualStock || isInput) && hasDestination
        ? destination.trim()
        : null;

    const hasValidCasela =
      isIndividualStock || (!isGeneralUse && hasCaselaSelected);
    const valueToSend =
      daysToReplacement !== ""
        ? Number(daysToReplacement)
        : (suggestedDiasParaRepor ?? item?.daysToReplacement ?? null);
    const shouldSendDaysToReplacement =
      !isGeneralUse && isMedicamento && hasValidCasela && valueToSend != null;

    onConfirm(quantityNum, casela, destino, details.trim() || null, {
      bypassCasela: isGeneralUse,
      dias_para_repor: shouldSendDaysToReplacement ? valueToSend : null,
    });
  };

  const handleConfirmInter = () => {
    if (!canConfirmInter || !onConfirmInterTenant) return;

    const arm =
      Number.isFinite(armarioNum) && armarioNum > 0 ? armarioNum : undefined;
    const gav =
      Number.isFinite(gavetaNum) && gavetaNum > 0 ? gavetaNum : undefined;

    onConfirmInterTenant({
      destTenantSlug: destSlug.trim(),
      quantidade: quantityNum,
      destTipo: destTipoLocal.trim(),
      destSetor: destSetorKey.trim() || undefined,
      destArmarioId: arm ?? null,
      destGavetaId: gav ?? null,
    });
  };

  const sortedResidents = useMemo(() => {
    const eff = caselaModeForContext(
      uiDisplay.casela,
      uiDisplay.caselaSetor,
      "enfermagem",
    );
    return [...(residents ?? [])].sort((a, b) =>
      eff === "nome"
        ? a.name.localeCompare(b.name, "pt-BR")
        : a.casela - b.casela,
    );
  }, [residents, uiDisplay.casela, uiDisplay.caselaSetor]);

  const filteredResidents = sortedResidents.filter((r) => {
    if (!caselaSearch) return true;
    if (/^\d+$/.test(caselaSearch)) {
      return r.casela === Number(caselaSearch);
    }
    return r.name.toLowerCase().includes(caselaSearch.toLowerCase());
  });

  const nextSector = item?.sector === "farmacia" ? "enfermagem" : "farmacia";

  const dialogTitle =
    sendToOtherTenant && allowInterTenantFlow
      ? "Enviar para outro abrigo"
      : `Transferir para ${nextSector === "farmacia" ? "Farmácia" : "Enfermaria"}`;

  const dialogDescription =
    sendToOtherTenant && allowInterTenantFlow
      ? `Mesmo medicamento desta linha: ${item?.name ?? ""}. Preencha o destino e local físico no outro abrigo.`
      : "Quantas unidades deseja transferir?";

  const confirmDisabled =
    loading ||
    (sendToOtherTenant && allowInterTenantFlow
      ? !canConfirmInter
      : !canConfirmSector);

  const handlePrimaryConfirm = () => {
    if (sendToOtherTenant && allowInterTenantFlow) {
      handleConfirmInter();
    } else {
      handleConfirmSector();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Quantidade disponível:{" "}
              <span className="font-semibold">{maxQuantity}</span>
            </Label>

            <Input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading}
            />
          </div>

          {allowInterTenantFlow ? (
            <div
              className={`flex items-start gap-2 rounded-md border p-3 ${
                sendToOtherTenant
                  ? "border-primary/40 bg-accent/30"
                  : "border-muted"
              }`}
            >
              <input
                type="checkbox"
                id="send-other-tenant"
                checked={sendToOtherTenant}
                onChange={(e) => setSendToOtherTenant(e.target.checked)}
                className="mt-1"
                disabled={loading}
              />
              <Label
                htmlFor="send-other-tenant"
                className="text-sm leading-snug cursor-pointer"
              >
                Vou enviar para <strong>outro abrigo</strong>
              </Label>
            </div>
          ) : null}

          {sendToOtherTenant && allowInterTenantFlow ? (
            <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">
                No destino, o sistema procura o mesmo produto no catálogo
                (medicamento: nome, princípio, dosagem e unidade; insumo: nome e
                descrição). Validade e lote seguem a linha de origem.
              </p>
              <div className="space-y-2">
                <Label>Abrigo destino</Label>
                {tenantsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> A carregar
                    abrigos…
                  </div>
                ) : (
                  <Select value={destSlug} onValueChange={setDestSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar abrigo" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessibleTenants.map((t) => (
                        <SelectItem key={t.id} value={t.slug}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Setor no abrigo destino</Label>
                <Select
                  value={destSetorKey}
                  onValueChange={setDestSetorKey}
                  disabled={!destSlug.trim() || destSetores.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {destSetores.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.nome ?? s.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de estoque</Label>
                <Select value={destTipoLocal} onValueChange={setDestTipoLocal}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_TYPES.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Armário destino</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="Nº armário"
                    value={destArmarioStr}
                    onChange={(e) => setDestArmarioStr(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gaveta destino</Label>
                  <Input
                    inputMode="numeric"
                    placeholder="Nº gaveta"
                    value={destGavetaStr}
                    onChange={(e) => setDestGavetaStr(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Informe pelo menos um: armário ou gaveta no destino.
              </p>
            </div>
          ) : (
            <>
              {isMedicamento && item?.isGeneralMedicine && (
                <div className="space-y-3">
                  <Label>Casela</Label>

                  <Popover open={caselaOpen} onOpenChange={setCaselaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={loading || isGeneralUse}
                        className="w-full justify-between"
                      >
                        {selectedCasela
                          ? (() => {
                              const r = residents.find(
                                (x) => x.casela === Number(selectedCasela),
                              );
                              if (uiDisplay.casela === "numero") {
                                return r
                                  ? `Casela ${selectedCasela} — ${r.name}`
                                  : `Casela ${selectedCasela}`;
                              }
                              return r
                                ? `${r.name} (${selectedCasela})`
                                : `Casela ${selectedCasela}`;
                            })()
                          : "Selecione uma casela..."}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Buscar por casela ou nome"
                          value={caselaSearch}
                          onValueChange={setCaselaSearch}
                        />
                        <CommandEmpty>Nenhuma casela encontrada.</CommandEmpty>
                        <CommandGroup>
                          {filteredResidents.map((resident) => (
                            <CommandItem
                              key={resident.casela}
                              onSelect={() => {
                                setSelectedCasela(resident.casela.toString());
                                setCaselaOpen(false);
                                setCaselaSearch("");
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedCasela === resident.casela.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {uiDisplay.casela === "numero"
                                ? `Casela ${resident.casela} — ${resident.name}`
                                : `${resident.name} (${resident.casela})`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {!isInput && (
                    <div
                      className={`flex items-start gap-2 rounded-md border p-3 ${
                        isGeneralUse
                          ? "border-red-400 bg-red-50"
                          : "border-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id="general-use"
                        checked={isGeneralUse}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsGeneralUse(checked);

                          if (checked) {
                            setSelectedCasela("");
                            setDetails("");
                            setDaysToReplacement("");
                            setFetchedDiasParaRepor(null);
                          }
                        }}
                        className="mt-1"
                      />
                      <Label
                        htmlFor="general-use"
                        className="text-sm leading-snug cursor-pointer"
                      >
                        Este medicamento é para <strong>uso geral</strong>.
                      </Label>
                    </div>
                  )}
                </div>
              )}

              {isInput && !isIndividualStock && !isGeneralUse && (
                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Input
                    placeholder="Digite o destino (opcional)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              {!isGeneralUse && isMedicamento && (
                <div className="space-y-2">
                  <Label>Dias para repor</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex: 7"
                    value={daysToReplacement}
                    onChange={(e) => setDaysToReplacement(e.target.value)}
                    disabled={loading}
                    className={
                      suggestedDiasParaRepor != null
                        ? "border-primary/25 bg-accent/60 text-foreground font-medium"
                        : undefined
                    }
                  />
                  {daysToReplacement === "" &&
                    !isIndividualStock &&
                    hasCaselaSelected && (
                      <p className="text-xs text-slate-500">
                        Digite os dias para reposição (ou aguarde o
                        carregamento)
                      </p>
                    )}
                  {daysToReplacement === "" &&
                    !isIndividualStock &&
                    !hasCaselaSelected && (
                      <p className="text-xs text-amber-600">
                        Selecione uma casela para buscar ou definir os dias para
                        reposição
                      </p>
                    )}
                  {isIndividualStock && item?.sector === "farmacia" && (
                    <p className="text-xs text-slate-500">
                      Mesmo medicamento e residente: use o ciclo já na
                      enfermaria (se houver) ou defina os dias para reposição.
                    </p>
                  )}
                  {suggestedDiasParaRepor != null && (
                    <p className="text-xs text-slate-500">
                      Valor preenchido automaticamente; você pode alterar se
                      quiser.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Observação</Label>
                <Input
                  placeholder="Digite uma observação (opcional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={loading || isGeneralUse}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handlePrimaryConfirm} disabled={confirmDisabled}>
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferQuantityModal;
