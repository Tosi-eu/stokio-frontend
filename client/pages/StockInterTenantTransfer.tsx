"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import ModuleRoute from "@/pages/ModuleRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAccessibleTenants,
  transferMedicineInterTenant,
  listInterTenantMovements,
  getMedicinesInTenantContext,
  getInputsInTenantContext,
  listTenantSetoresInTenantContext,
  type AccessibleTenantRow,
  type InterTenantMovementRow,
  type TenantSetorRow,
} from "@/api/requests";
import { useTenant } from "@/hooks/use-tenant.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import { ItemStockType, StockTypeLabels } from "@/utils/enums";
import { getErrorMessage } from "@/helpers/validation.helper";
import { toast } from "@/hooks/use-toast.hook";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageSurfaceCard } from "@/components/page/PageSurfaceCard";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import { fetchStockPage, formatStockItems } from "@/helpers/stock-list.helper";
import type {
  StockItem,
  RawStockMedicine,
  RawStockInput,
} from "@/interfaces/interfaces";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StockInterTenantTransferPage() {
  const { tenantId } = useTenant();
  const { canMovementTipo } = usePermissionMatrix();
  const allowed = canMovementTipo("transferencia");

  const [tenants, setTenants] = useState<AccessibleTenantRow[]>([]);
  const [destSlug, setDestSlug] = useState("");
  const [itemKind, setItemKind] = useState<"medicamento" | "insumo">(
    "medicamento",
  );

  const [sourceQuery, setSourceQuery] = useState("");
  const [debouncedSourceQ, setDebouncedSourceQ] = useState("");
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceHits, setSourceHits] = useState<StockItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<StockItem | null>(null);

  const [destMedQuery, setDestMedQuery] = useState("");
  const [debouncedDestMedQ, setDebouncedDestMedQ] = useState("");
  const [destMedLoading, setDestMedLoading] = useState(false);
  const [destMedHits, setDestMedHits] = useState<RawStockMedicine[]>([]);
  const [selectedDestMed, setSelectedDestMed] =
    useState<RawStockMedicine | null>(null);

  const [destInpQuery, setDestInpQuery] = useState("");
  const [debouncedDestInpQ, setDebouncedDestInpQ] = useState("");
  const [destInpLoading, setDestInpLoading] = useState(false);
  const [destInpHits, setDestInpHits] = useState<RawStockInput[]>([]);
  const [selectedDestInput, setSelectedDestInput] =
    useState<RawStockInput | null>(null);

  const [destSetores, setDestSetores] = useState<TenantSetorRow[]>([]);

  const [quantidade, setQuantidade] = useState("");
  const [destTipo, setDestTipo] = useState<ItemStockType>(ItemStockType.GERAL);
  const [destSetor, setDestSetor] = useState("farmacia");
  const [destArmarioId, setDestArmarioId] = useState("");
  const [destGavetaId, setDestGavetaId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showManualIds, setShowManualIds] = useState(false);
  const [manualSourceId, setManualSourceId] = useState("");
  const [manualDestCatalogId, setManualDestCatalogId] = useState("");

  const [movRows, setMovRows] = useState<InterTenantMovementRow[]>([]);
  const [movLoading, setMovLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSourceQ(sourceQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [sourceQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDestInpQ(destInpQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [destInpQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDestMedQ(destMedQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [destMedQuery]);

  useEffect(() => {
    let c = false;
    listAccessibleTenants()
      .then((r) => {
        if (c) return;
        const list = (r.tenants ?? []).filter(
          (t) => tenantId == null || t.id !== tenantId,
        );
        setTenants(list);
        setDestSlug((prev) => prev || (list[0]?.slug ?? ""));
      })
      .catch(() => {
        /* handled on submit */
      });
    return () => {
      c = true;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!destSlug.trim()) {
      setDestSetores([]);
      return;
    }
    let c = false;
    listTenantSetoresInTenantContext(destSlug)
      .then((r) => {
        if (c) return;
        const rows = r.data ?? [];
        setDestSetores(rows);
        setDestSetor((prev) => {
          if (rows.some((x) => x.key === prev)) return prev;
          return rows[0]?.key ?? "farmacia";
        });
      })
      .catch(() => setDestSetores([]));
    return () => {
      c = true;
    };
  }, [destSlug]);

  useEffect(() => {
    if (!allowed || tenantId == null) return;
    if (debouncedSourceQ.length < 2) {
      setSourceHits([]);
      return;
    }
    let c = false;
    setSourceLoading(true);
    fetchStockPage(
      1,
      15,
      {
        nome: debouncedSourceQ,
        itemType: itemKind,
        onlyInStock: true,
      },
      null,
    )
      .then((page) => {
        if (c) return;
        setSourceHits(formatStockItems(page.data));
      })
      .catch(() => setSourceHits([]))
      .finally(() => {
        if (!c) setSourceLoading(false);
      });
    return () => {
      c = true;
    };
  }, [allowed, tenantId, debouncedSourceQ, itemKind]);

  useEffect(() => {
    if (itemKind !== "medicamento" || !destSlug.trim() || !allowed) {
      setDestMedHits([]);
      return;
    }
    if (debouncedDestMedQ.length < 2) {
      setDestMedHits([]);
      return;
    }
    let c = false;
    setDestMedLoading(true);
    getMedicinesInTenantContext(destSlug, 1, 20, debouncedDestMedQ)
      .then((res) => {
        if (c) return;
        setDestMedHits(res.data ?? []);
      })
      .catch(() => setDestMedHits([]))
      .finally(() => {
        if (!c) setDestMedLoading(false);
      });
    return () => {
      c = true;
    };
  }, [destSlug, debouncedDestMedQ, allowed, itemKind]);

  useEffect(() => {
    if (itemKind !== "insumo" || !destSlug.trim() || !allowed) {
      setDestInpHits([]);
      return;
    }
    if (debouncedDestInpQ.length < 2) {
      setDestInpHits([]);
      return;
    }
    let c = false;
    setDestInpLoading(true);
    getInputsInTenantContext(destSlug, 1, 20, debouncedDestInpQ)
      .then((res) => {
        if (c) return;
        setDestInpHits(res.data ?? []);
      })
      .catch(() => setDestInpHits([]))
      .finally(() => {
        if (!c) setDestInpLoading(false);
      });
    return () => {
      c = true;
    };
  }, [destSlug, debouncedDestInpQ, allowed, itemKind]);

  const loadMovements = useCallback(async () => {
    setMovLoading(true);
    try {
      const res = await listInterTenantMovements({ page: 1, limit: 50 });
      setMovRows(res.data ?? []);
    } catch (err: unknown) {
      toast({
        title: "Não foi possível carregar o relatório",
        description: getErrorMessage(err, "Tente novamente."),
        variant: "error",
      });
    } finally {
      setMovLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tenantId != null) void loadMovements();
  }, [tenantId, loadMovements]);

  const stockTypes = useMemo(() => Object.values(ItemStockType), []);

  const effectiveSourceEstoqueId = showManualIds
    ? manualSourceId.trim()
    : selectedSource?.id != null
      ? String(selectedSource.id)
      : "";

  function pickSource(row: StockItem) {
    setSelectedSource(row);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed) return;
    const sid = Number(effectiveSourceEstoqueId);
    const q = Number(quantidade);

    if (!Number.isInteger(sid) || sid < 1) {
      toast({
        title: "Seleção incompleta",
        description: "Indique a linha de stock de origem (ou ID manual).",
        variant: "error",
      });
      return;
    }
    if (!Number.isFinite(q) || q < 1) {
      toast({
        title: "Quantidade inválida",
        variant: "error",
      });
      return;
    }

    let destMedicamentoId: number | undefined;
    let destInsumoId: number | undefined;

    if (showManualIds) {
      const manualCat = Number(manualDestCatalogId.trim());
      if (!Number.isInteger(manualCat) || manualCat < 1) {
        toast({
          title: "IDs incompletos",
          description:
            "Em modo manual, preencha o ID do stock de origem e o ID do produto no catálogo de destino.",
          variant: "error",
        });
        return;
      }
      if (itemKind === "medicamento") destMedicamentoId = manualCat;
      else destInsumoId = manualCat;
    } else {
      if (itemKind === "medicamento" && selectedDestMed?.id != null) {
        destMedicamentoId = selectedDestMed.id;
      }
      if (itemKind === "insumo" && selectedDestInput?.id != null) {
        destInsumoId = selectedDestInput.id;
      }
    }

    setSubmitting(true);
    try {
      await transferMedicineInterTenant({
        tipo_item: itemKind,
        destTenantSlug: destSlug.trim(),
        sourceEstoqueId: sid,
        quantidade: q,
        destTipo,
        destSetor: destSetor.trim() || undefined,
        destArmarioId: destArmarioId.trim() ? Number(destArmarioId) : undefined,
        destGavetaId: destGavetaId.trim() ? Number(destGavetaId) : undefined,
        ...(destMedicamentoId != null ? { destMedicamentoId } : {}),
        ...(destInsumoId != null ? { destInsumoId } : {}),
      });
      toast({
        title: "Transferência registada",
        variant: "success",
      });
      await loadMovements();
    } catch (err: unknown) {
      toast({
        title: "Erro na transferência",
        description: getErrorMessage(err, "Verifique os dados e permisões."),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmitPicker = Boolean(selectedSource) && Number(quantidade) >= 1;

  const canSubmitManual =
    manualSourceId.trim() !== "" &&
    manualDestCatalogId.trim() !== "" &&
    Number(quantidade) >= 1;

  return (
    <ModuleRoute moduleKey="stock">
      <Layout
        title="Transferência entre abrigos"
        description="Saída no abrigo atual e entrada no catálogo do destino (medicamentos e insumos)."
      >
        {!allowed ? (
          <PageSurfaceCard>
            <p className="text-muted-foreground">
              Sem permissão para transferências de stock.
            </p>
          </PageSurfaceCard>
        ) : (
          <div className="flex flex-col gap-8">
            <PageSurfaceCard className="p-6 space-y-6 max-w-3xl">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong className="text-foreground">Origem:</strong> abrigo
                  atual (contexto em sessão / cabeçalho «Abrigo ativo»).
                </p>
                <p>
                  <strong className="text-foreground">Correspondência:</strong>{" "}
                  se não escolher produto no destino, o servidor tenta igualar
                  ao catálogo (medicamento ou insumo).
                </p>
              </div>

              <form className="grid gap-5" onSubmit={onSubmit}>
                <div>
                  <Label>Abrigo destino</Label>
                  <Select value={destSlug} onValueChange={setDestSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.slug}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de produto</Label>
                  <Select
                    value={itemKind}
                    onValueChange={(v) => {
                      const nk = v as "medicamento" | "insumo";
                      setItemKind(nk);
                      setSelectedSource(null);
                      setSourceQuery("");
                      setSelectedDestMed(null);
                      setSelectedDestInput(null);
                      setDestMedQuery("");
                      setDestInpQuery("");
                      setManualSourceId("");
                      setManualDestCatalogId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicamento">Medicamento</SelectItem>
                      <SelectItem value="insumo">Insumo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border/70 p-4 space-y-3">
                  <Label className="text-base">
                    Linha de stock no abrigo atual
                  </Label>
                  <Input
                    placeholder="Pesquisar por nome (mín. 2 caracteres)…"
                    value={sourceQuery}
                    onChange={(e) => setSourceQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {sourceLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> A pesquisar…
                    </div>
                  ) : null}
                  {sourceHits.length > 0 ? (
                    <ul
                      className="max-h-44 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-sm"
                      role="listbox"
                    >
                      {sourceHits.map((row) => (
                        <li key={String(row.id)}>
                          <button
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-2 hover:bg-accent/70 transition-colors",
                              selectedSource?.id === row.id && "bg-accent",
                            )}
                            onClick={() => pickSource(row)}
                          >
                            <span className="font-medium">{row.name}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              · Stock #{row.id} · qtd {row.quantity} · val.{" "}
                              {row.expiry}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : debouncedSourceQ.length >= 2 && !sourceLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum resultado. Ajuste o termo de pesquisa.
                    </p>
                  ) : null}
                  {selectedSource ? (
                    <p className="text-sm text-muted-foreground">
                      Selecionado:{" "}
                      <strong className="text-foreground">
                        #{selectedSource.id}
                      </strong>{" "}
                      — {selectedSource.name}
                    </p>
                  ) : null}
                </div>

                {itemKind === "medicamento" ? (
                  <div className="rounded-lg border border-border/70 p-4 space-y-3">
                    <Label className="text-base">
                      Medicamento no catálogo do destino (opcional)
                    </Label>
                    {!destSlug ? (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Escolha primeiro o abrigo destino.
                      </p>
                    ) : (
                      <>
                        <Input
                          placeholder="Pesquisar medicamento no destino (mín. 2 caracteres)…"
                          value={destMedQuery}
                          onChange={(e) => setDestMedQuery(e.target.value)}
                          autoComplete="off"
                        />
                        {destMedLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> A
                            pesquisar catálogo…
                          </div>
                        ) : null}
                        {destMedHits.length > 0 ? (
                          <ul className="max-h-44 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-sm">
                            {destMedHits.map((m, idx) => (
                              <li key={m.id != null ? `m-${m.id}` : `i-${idx}`}>
                                <button
                                  type="button"
                                  className={cn(
                                    "w-full text-left px-3 py-2 hover:bg-accent/70 transition-colors",
                                    selectedDestMed?.id === m.id && "bg-accent",
                                  )}
                                  onClick={() => setSelectedDestMed(m)}
                                >
                                  <span className="font-medium">{m.nome}</span>
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · ID {m.id ?? "—"} · {m.dosagem}{" "}
                                    {m.unidade_medida}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : debouncedDestMedQ.length >= 2 &&
                          !destMedLoading &&
                          destSlug ? (
                          <p className="text-xs text-muted-foreground">
                            Nenhum medicamento encontrado nesse abrigo.
                          </p>
                        ) : null}
                        {selectedDestMed ? (
                          <p className="text-sm text-muted-foreground">
                            Selecionado:{" "}
                            <strong className="text-foreground">
                              #{selectedDestMed.id ?? "—"}
                            </strong>{" "}
                            — {selectedDestMed.nome}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/70 p-4 space-y-3">
                    <Label className="text-base">
                      Insumo no catálogo do destino (opcional)
                    </Label>
                    {!destSlug ? (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Escolha primeiro o abrigo destino.
                      </p>
                    ) : (
                      <>
                        <Input
                          placeholder="Pesquisar insumo no destino (mín. 2 caracteres)…"
                          value={destInpQuery}
                          onChange={(e) => setDestInpQuery(e.target.value)}
                          autoComplete="off"
                        />
                        {destInpLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> A
                            pesquisar catálogo…
                          </div>
                        ) : null}
                        {destInpHits.length > 0 ? (
                          <ul className="max-h-44 overflow-auto rounded-md border border-border/60 divide-y divide-border/50 text-sm">
                            {destInpHits.map((inp, idx) => (
                              <li
                                key={
                                  inp.id != null ? `inp-${inp.id}` : `i-${idx}`
                                }
                              >
                                <button
                                  type="button"
                                  className={cn(
                                    "w-full text-left px-3 py-2 hover:bg-accent/70 transition-colors",
                                    selectedDestInput?.id === inp.id &&
                                      "bg-accent",
                                  )}
                                  onClick={() => setSelectedDestInput(inp)}
                                >
                                  <span className="font-medium">
                                    {inp.nome}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" "}
                                    · ID {inp.id ?? "—"} · {inp.descricao}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : debouncedDestInpQ.length >= 2 &&
                          !destInpLoading &&
                          destSlug ? (
                          <p className="text-xs text-muted-foreground">
                            Nenhum insumo encontrado nesse abrigo.
                          </p>
                        ) : null}
                        {selectedDestInput ? (
                          <p className="text-sm text-muted-foreground">
                            Selecionado:{" "}
                            <strong className="text-foreground">
                              #{selectedDestInput.id ?? "—"}
                            </strong>{" "}
                            — {selectedDestInput.nome}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                )}

                <div>
                  <Label>Quantidade</Label>
                  <Input
                    inputMode="numeric"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo stock destino</Label>
                    <Select
                      value={destTipo}
                      onValueChange={(v) => setDestTipo(v as ItemStockType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stockTypes.map((st) => (
                          <SelectItem key={st} value={st}>
                            {StockTypeLabels[st] ?? st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Setor destino</Label>
                    <Select
                      value={destSetor}
                      onValueChange={setDestSetor}
                      disabled={!destSetores.length}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            destSetores.length
                              ? "Setor"
                              : "Carregue o abrigo destino"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {destSetores.map((s) => (
                          <SelectItem key={s.id} value={s.key}>
                            {s.nome} ({s.key})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Armário destino (número)</Label>
                    <Input
                      inputMode="numeric"
                      value={destArmarioId}
                      onChange={(e) => setDestArmarioId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Gaveta destino (número)</Label>
                    <Input
                      inputMode="numeric"
                      value={destGavetaId}
                      onChange={(e) => setDestGavetaId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => setShowManualIds((v) => !v)}
                  >
                    {showManualIds
                      ? "Ocultar introdução manual de IDs"
                      : "Introduzir IDs manualmente (avançado)"}
                  </Button>
                </div>

                {showManualIds ? (
                  <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed border-border p-3">
                    <div>
                      <Label>ID stock origem</Label>
                      <Input
                        inputMode="numeric"
                        value={manualSourceId}
                        onChange={(e) => setManualSourceId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>ID catálogo destino (medicamento ou insumo)</Label>
                      <Input
                        inputMode="numeric"
                        value={manualDestCatalogId}
                        onChange={(e) => setManualDestCatalogId(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    (!showManualIds && !canSubmitPicker) ||
                    (showManualIds && !canSubmitManual)
                  }
                >
                  {submitting ? "A registar…" : "Transferir"}
                </Button>
              </form>
            </PageSurfaceCard>

            <PageSurfaceCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Movimentos entre abrigos (este abrigo)
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadMovements()}
                  disabled={movLoading}
                >
                  Atualizar
                </Button>
              </div>
              {movLoading ? (
                <p className="text-sm text-muted-foreground">A carregar…</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Produto (ids)</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movRows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          {formatDateToPtBr(new Date(r.data))}
                        </TableCell>
                        <TableCell>{r.tipo}</TableCell>
                        <TableCell>{r.quantidade}</TableCell>
                        <TableCell>
                          {r.medicamento_id != null
                            ? `Med. ${r.medicamento_id}`
                            : r.insumo_id != null
                              ? `Ins. ${r.insumo_id}`
                              : "—"}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                          {r.observacao ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </PageSurfaceCard>
          </div>
        )}
      </Layout>
    </ModuleRoute>
  );
}
