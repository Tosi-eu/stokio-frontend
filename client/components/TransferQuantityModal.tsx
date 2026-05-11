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
  getCabinetsInTenantContext,
  getDrawersInTenantContext,
  getResidentsInTenantContext,
  type AccessibleTenantRow,
  type TenantSetorRow,
  type InterTenantMedicineTransferPayload,
} from "@/api/requests";
import { useTenant } from "@/hooks/use-tenant.hook";
import { caselaModeForContext } from "@/helpers/ui-display.helper";
import {
  compareResidentsByCaselaThenName,
  compareResidentsByNameThenCasela,
} from "@/helpers/resident-sort.helper";
import { ItemStockType, StockTypeLabels } from "@/utils/enums";
import type { Drawer } from "@/interfaces/interfaces";
import { accessibleTenantLabel } from "@/helpers/tenant-display.helper";
import { fetchAllPaginated } from "@/helpers/paginacao.helper";

export type InterTenantTransferModalPayload = Omit<
  InterTenantMedicineTransferPayload,
  "sourceEstoqueId"
> & {
  /** Apenas UI (toast); não enviar na API. */
  destTenantDisplayLabel?: string;
};

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
  const [destArmarioSel, setDestArmarioSel] = useState("");
  const [destGavetaSel, setDestGavetaSel] = useState("");
  const [destCabinets, setDestCabinets] = useState<
    { numero: number; categoria: string }[]
  >([]);
  const [destDrawers, setDestDrawers] = useState<Drawer[]>([]);
  const [destLocLoading, setDestLocLoading] = useState(false);
  const [destResidents, setDestResidents] = useState<
    Array<{ casela: number; name: string }>
  >([]);
  const [destResidentsLoading, setDestResidentsLoading] = useState(false);
  const [destInterCasela, setDestInterCasela] = useState("");

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
      setDestArmarioSel("");
      setDestGavetaSel("");
      setDestCabinets([]);
      setDestDrawers([]);
      setDestResidents([]);
      setDestInterCasela("");
      setDestResidentsLoading(false);
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
    setDestArmarioSel("");
    setDestGavetaSel("");
    setDestInterCasela("");
  }, [destSlug]);

  useEffect(() => {
    if (destTipoLocal === ItemStockType.INDIVIDUAL) {
      setDestArmarioSel("");
      setDestGavetaSel("");
    } else {
      setDestInterCasela("");
    }
  }, [destTipoLocal]);

  useEffect(() => {
    if (
      !open ||
      !sendToOtherTenant ||
      !allowInterTenantFlow ||
      !destSlug.trim() ||
      destTipoLocal === ItemStockType.INDIVIDUAL
    ) {
      setDestCabinets([]);
      setDestDrawers([]);
      setDestLocLoading(false);
      return;
    }
    let cancelled = false;
    setDestLocLoading(true);
    Promise.all([
      getCabinetsInTenantContext(destSlug.trim(), 1, 500),
      getDrawersInTenantContext(destSlug.trim(), 1, 500),
    ])
      .then(([cab, dr]) => {
        if (cancelled) return;
        setDestCabinets(
          [...(cab.data ?? [])].sort((a, b) => a.numero - b.numero),
        );
        setDestDrawers(
          [...(dr.data ?? [])].sort((a, b) => a.numero - b.numero),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setDestCabinets([]);
          setDestDrawers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setDestLocLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, allowInterTenantFlow, sendToOtherTenant, destSlug, destTipoLocal]);

  useEffect(() => {
    if (
      !open ||
      !sendToOtherTenant ||
      !allowInterTenantFlow ||
      !destSlug.trim() ||
      destTipoLocal !== ItemStockType.INDIVIDUAL
    ) {
      setDestResidents([]);
      setDestResidentsLoading(false);
      return;
    }
    let cancelled = false;
    setDestResidentsLoading(true);
    fetchAllPaginated(
      (p, l) => getResidentsInTenantContext(destSlug.trim(), p, l),
      150,
    )
      .then((rows) => {
        if (cancelled) return;
        const mapped = (Array.isArray(rows) ? rows : []).map(
          (r: { casela?: unknown; name?: unknown }) => ({
            casela: Number(r.casela),
            name: String(r.name ?? ""),
          }),
        );
        setDestResidents(mapped.sort(compareResidentsByNameThenCasela));
      })
      .catch(() => {
        if (!cancelled) setDestResidents([]);
      })
      .finally(() => {
        if (!cancelled) setDestResidentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, allowInterTenantFlow, sendToOtherTenant, destSlug, destTipoLocal]);

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

  const destIsInterIndividual = destTipoLocal === ItemStockType.INDIVIDUAL;
  const armarioNum = destArmarioSel.trim() ? Number(destArmarioSel) : NaN;
  const gavetaNum = destGavetaSel.trim() ? Number(destGavetaSel) : NaN;
  const armarioSel =
    Number.isFinite(armarioNum) && armarioNum > 0 ? armarioNum : 0;
  const gavetaSel = Number.isFinite(gavetaNum) && gavetaNum > 0 ? gavetaNum : 0;
  const armarioOk =
    !destIsInterIndividual &&
    armarioSel > 0 &&
    gavetaSel === 0 &&
    destCabinets.some((c) => c.numero === armarioSel);
  const gavetaOk =
    !destIsInterIndividual &&
    gavetaSel > 0 &&
    armarioSel === 0 &&
    destDrawers.some((d) => d.numero === gavetaSel);
  const interCaselaNum = destInterCasela.trim() ? Number(destInterCasela) : NaN;
  const interCaselaOk =
    destIsInterIndividual &&
    Number.isFinite(interCaselaNum) &&
    interCaselaNum > 0 &&
    destResidents.some((r) => r.casela === interCaselaNum);

  const hasDestLocation = destIsInterIndividual
    ? interCaselaOk
    : armarioOk || gavetaOk;

  const hasDestChoices = destIsInterIndividual
    ? destResidents.length > 0
    : destCabinets.length > 0 || destDrawers.length > 0;

  const destLocationLoading = destIsInterIndividual
    ? destResidentsLoading
    : destLocLoading;

  const canConfirmInter =
    isValidQuantity &&
    Boolean(destSlug.trim()) &&
    Boolean(destSetorKey.trim()) &&
    destSetores.some((s) => s.key === destSetorKey) &&
    Boolean(destTipoLocal.trim()) &&
    !destLocationLoading &&
    hasDestChoices &&
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
      !destIsInterIndividual &&
      Number.isFinite(armarioNum) &&
      armarioNum > 0 &&
      gavetaSel === 0
        ? armarioNum
        : undefined;
    const gav =
      !destIsInterIndividual &&
      Number.isFinite(gavetaNum) &&
      gavetaNum > 0 &&
      armarioSel === 0
        ? gavetaNum
        : undefined;
    const cas =
      destIsInterIndividual &&
      Number.isFinite(interCaselaNum) &&
      interCaselaNum > 0
        ? interCaselaNum
        : undefined;

    const destRow = accessibleTenants.find((t) => t.slug === destSlug.trim());
    const destLbl = destRow ? accessibleTenantLabel(destRow) : destSlug.trim();

    onConfirmInterTenant({
      destTenantSlug: destSlug.trim(),
      quantidade: quantityNum,
      destTipo: destTipoLocal.trim(),
      destSetor: destSetorKey.trim() || undefined,
      destCaselaId: cas ?? null,
      destArmarioId: arm ?? null,
      destGavetaId: gav ?? null,
      destTenantDisplayLabel: destLbl,
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
        ? compareResidentsByNameThenCasela(a, b)
        : compareResidentsByCaselaThenName(a, b),
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
                No destino, o catálogo é reutilizado quando já existir o mesmo
                medicamento ou insumo; caso contrário, o registo é criado
                automaticamente a partir da origem. Validade e lote seguem a
                linha de origem. Para tipos{" "}
                <strong className="text-foreground">não individuais</strong>,
                escolha <strong className="text-foreground">apenas</strong>{" "}
                armário <strong className="text-foreground">ou</strong> gaveta.
                Para <strong className="text-foreground">individual</strong>,
                escolha o residente (casela) no abrigo destino.
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
                          {accessibleTenantLabel(t)}
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
                        {StockTypeLabels[k] ?? k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {destIsInterIndividual && destResidentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> A carregar
                  residentes do destino…
                </div>
              ) : null}

              {!destIsInterIndividual && destLocLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> A carregar
                  armários e gavetas do destino…
                </div>
              ) : null}

              {destIsInterIndividual &&
              !destResidentsLoading &&
              destSlug.trim() &&
              !hasDestChoices ? (
                <p className="text-sm text-amber-800 dark:text-amber-200 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
                  Não há residentes (caselas) cadastrados neste abrigo destino.
                  Cadastre residentes antes de transferir estoque individual.
                </p>
              ) : null}

              {!destIsInterIndividual &&
              !destLocLoading &&
              destSlug.trim() &&
              !hasDestChoices ? (
                <p className="text-sm text-amber-800 dark:text-amber-200 rounded-md border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
                  Este abrigo não tem armários nem gavetas cadastrados. Cadastre
                  pelo menos um local físico no destino para este tipo de
                  estoque.
                </p>
              ) : null}

              {destIsInterIndividual ? (
                <div className="space-y-2">
                  <Label>Residente (casela) no destino</Label>
                  <Select
                    value={destInterCasela || "__none__"}
                    onValueChange={(v) =>
                      setDestInterCasela(v === "__none__" ? "" : v)
                    }
                    disabled={
                      loading ||
                      destResidentsLoading ||
                      !destSlug.trim() ||
                      destResidents.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar casela" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Selecionar</SelectItem>
                      {destResidents.map((r) => (
                        <SelectItem key={r.casela} value={String(r.casela)}>
                          Casela {r.casela} — {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Armário destino</Label>
                    <Select
                      value={destArmarioSel || "__none__"}
                      onValueChange={(v) => {
                        const next = v === "__none__" ? "" : v;
                        setDestArmarioSel(next);
                        if (next) setDestGavetaSel("");
                      }}
                      disabled={loading || destLocLoading || !destSlug.trim()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Nenhum</SelectItem>
                        {destCabinets.map((c) => (
                          <SelectItem key={c.numero} value={String(c.numero)}>
                            Armário {c.numero} — {c.categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gaveta destino</Label>
                    <Select
                      value={destGavetaSel || "__none__"}
                      onValueChange={(v) => {
                        const next = v === "__none__" ? "" : v;
                        setDestGavetaSel(next);
                        if (next) setDestArmarioSel("");
                      }}
                      disabled={loading || destLocLoading || !destSlug.trim()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Nenhum</SelectItem>
                        {destDrawers.map((g) => (
                          <SelectItem key={g.numero} value={String(g.numero)}>
                            Gaveta {g.numero} — {g.categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {!destIsInterIndividual ? (
                <p className="text-xs text-muted-foreground">
                  Selecione <strong>apenas</strong> armário <strong>ou</strong>{" "}
                  gaveta (não ambos).
                </p>
              ) : null}
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
