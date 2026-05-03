import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminDataQualitySummary,
  getAdminInconsistencies,
  getAdminMedicineDuplicates,
  mergeAdminMedicines,
  normalizeAdminMedicineUnits,
} from "@/api/requests";
import { toast } from "@/hooks/use-toast.hook";
import { formatDateToPtBr, formatValidityDate } from "@/helpers/dates.helper";
import { getErrorMessage } from "@/helpers/validation.helper";

type InconsistencyType = "negative_stock" | "missing_lot" | "orphan_movements";

export function AdminTabQualidade({ enabled }: { enabled: boolean }) {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<{
    negativeStock: { medicines: number; inputs: number };
    missingLot: { medicines: number; inputs: number };
    orphanMovements: number;
  } | null>(null);

  const [type, setType] = useState<InconsistencyType>("negative_stock");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const [dupPage, setDupPage] = useState(1);
  const [dupTotal, setDupTotal] = useState(0);
  const [dupRows, setDupRows] = useState<Record<string, unknown>[]>([]);
  const [loadingDup, setLoadingDup] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / (limit || 1))),
    [total, limit],
  );

  const dupTotalPages = useMemo(
    () => Math.max(1, Math.ceil((dupTotal || 0) / 25)),
    [dupTotal],
  );

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const s = await getAdminDataQualitySummary();
      setSummary(s);
    } catch {
      setSummary(null);
      toast({ title: "Erro ao carregar qualidade de dados", variant: "error" });
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    try {
      const res = (await getAdminInconsistencies({
        type,
        page,
        limit,
      })) as { data?: Record<string, unknown>[]; total?: number };
      setRows(Array.isArray(res?.data) ? res.data : []);
      setTotal(Number(res?.total) || 0);
    } catch {
      setRows([]);
      setTotal(0);
      toast({ title: "Erro ao listar inconsistências", variant: "error" });
    } finally {
      setLoadingRows(false);
    }
  }, [type, page, limit]);

  const loadDuplicates = useCallback(async () => {
    setLoadingDup(true);
    try {
      const res = (await getAdminMedicineDuplicates({
        page: dupPage,
        limit: 25,
      })) as { data?: Record<string, unknown>[]; total?: number };
      setDupRows(Array.isArray(res?.data) ? res.data : []);
      setDupTotal(Number(res?.total) || 0);
    } catch {
      setDupRows([]);
      setDupTotal(0);
      toast({ title: "Erro ao listar duplicados", variant: "error" });
    } finally {
      setLoadingDup(false);
    }
  }, [dupPage]);

  useEffect(() => {
    if (!enabled) return;
    loadSummary();
  }, [enabled, loadSummary]);

  useEffect(() => {
    if (!enabled) return;
    loadRows();
  }, [enabled, loadRows]);

  useEffect(() => {
    if (!enabled) return;
    loadDuplicates();
  }, [enabled, loadDuplicates]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Qualidade de dados (detecção)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Identifica inconsistências comuns que impactam relatórios e
            rastreabilidade.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadSummary}
              disabled={loadingSummary}
            >
              {loadingSummary ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>

          {summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Estoque negativo</div>
                <div className="font-medium">
                  Med: {summary.negativeStock.medicines} | Ins:{" "}
                  {summary.negativeStock.inputs}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">
                  Sem lote (com qtd &gt; 0)
                </div>
                <div className="font-medium">
                  Med: {summary.missingLot.medicines} | Ins:{" "}
                  {summary.missingLot.inputs}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">
                  Movimentos sem vínculo
                </div>
                <div className="font-medium">{summary.orphanMovements}</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Sem dados.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inconsistências (lista)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tipo</div>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as InconsistencyType);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negative_stock">
                    Estoque negativo
                  </SelectItem>
                  <SelectItem value="missing_lot">
                    Sem lote (qtd &gt; 0)
                  </SelectItem>
                  <SelectItem value="orphan_movements">
                    Movimentos sem vínculo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Itens/página
              </div>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {type === "orphan_movements" ? (
                    <>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Lote</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estoque ID</TableHead>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Lote</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingRows ? (
                  <TableRow>
                    <TableCell
                      colSpan={type === "orphan_movements" ? 7 : 7}
                      className="text-center text-muted-foreground"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={type === "orphan_movements" ? 7 : 7}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum registro
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) =>
                    type === "orphan_movements" ? (
                      <TableRow key={idx}>
                        <TableCell>{String(r.id ?? "-")}</TableCell>
                        <TableCell>{String(r.tipo ?? "-")}</TableCell>
                        <TableCell>
                          {r.data != null && String(r.data).trim() !== ""
                            ? formatDateToPtBr(String(r.data))
                            : "-"}
                        </TableCell>
                        <TableCell>{String(r.login_id ?? "-")}</TableCell>
                        <TableCell>{String(r.quantidade ?? "-")}</TableCell>
                        <TableCell>{String(r.setor ?? "-")}</TableCell>
                        <TableCell>{String(r.lote ?? "-")}</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={idx}>
                        <TableCell>{String(r.item_type ?? "-")}</TableCell>
                        <TableCell>{String(r.id ?? "-")}</TableCell>
                        <TableCell>{String(r.item_id ?? "-")}</TableCell>
                        <TableCell>{String(r.quantidade ?? "-")}</TableCell>
                        <TableCell>{String(r.setor ?? "-")}</TableCell>
                        <TableCell>
                          {formatValidityDate(
                            r.validade != null ? String(r.validade) : "",
                          )}
                        </TableCell>
                        <TableCell>{String(r.lote ?? "-")}</TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages} (total {total})
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ferramentas de manutenção</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ações administrativas para padronizar e corrigir dados.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = (await normalizeAdminMedicineUnits({
                    dryRun: true,
                  })) as { updated?: number };
                  toast({
                    title: "Prévia de normalização",
                    description: `${res.updated ?? 0} medicamento(s) seriam atualizados (mostrando até 50).`,
                    variant: "success",
                  });
                } catch (err: unknown) {
                  toast({
                    title: "Erro na prévia",
                    description: getErrorMessage(
                      err,
                      "Não foi possível gerar a prévia.",
                      "AdminTabQualidade:normalizePreview",
                    ),
                    variant: "error",
                  });
                }
              }}
            >
              Prévia: padronizar unidades
            </Button>
            <Button
              onClick={async () => {
                try {
                  const res = (await normalizeAdminMedicineUnits({
                    dryRun: false,
                  })) as { updated?: number };
                  toast({
                    title: "Unidades padronizadas",
                    description: `${res.updated ?? 0} medicamento(s) atualizado(s).`,
                    variant: "success",
                  });
                  loadDuplicates();
                } catch (err: unknown) {
                  toast({
                    title: "Erro ao padronizar",
                    description: getErrorMessage(
                      err,
                      "Não foi possível padronizar as unidades.",
                      "AdminTabQualidade:normalizeApply",
                    ),
                    variant: "error",
                  });
                }
              }}
            >
              Aplicar: padronizar unidades
            </Button>
          </div>

          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  Possíveis duplicados (medicamentos)
                </div>
                <div className="text-sm text-muted-foreground">
                  Agrupados por nome/princípio/dosagem/unidade (normalizados).
                </div>
              </div>
              <Button
                variant="outline"
                onClick={loadDuplicates}
                disabled={loadingDup}
              >
                {loadingDup ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>

            <div className="rounded-md border overflow-x-auto mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chave normalizada</TableHead>
                    <TableHead>IDs</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead className="w-[180px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDup ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : dupRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        Nenhum duplicado encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dupRows.map((g, idx) => {
                      const ids = Array.isArray(g.ids)
                        ? (g.ids as number[])
                        : [];
                      const keepId = ids[0];
                      const mergeIds = ids.slice(1);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">
                            {String(g.n_nome)} | {String(g.n_principio)} |{" "}
                            {String(g.n_dosagem)} | {String(g.n_unidade)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {ids.join(", ")}
                          </TableCell>
                          <TableCell>{String(g.count)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={mergeIds.length === 0}
                              onClick={async () => {
                                try {
                                  await mergeAdminMedicines({
                                    keepId,
                                    mergeIds,
                                  });
                                  toast({
                                    title: "Duplicados mesclados",
                                    description: `Mantido ID ${keepId}. Removidos: ${mergeIds.join(", ")}`,
                                    variant: "success",
                                  });
                                  loadDuplicates();
                                } catch (err: unknown) {
                                  toast({
                                    title: "Erro ao mesclar",
                                    description: getErrorMessage(
                                      err,
                                      "Não foi possível mesclar os registos.",
                                      "AdminTabQualidade:merge",
                                    ),
                                    variant: "error",
                                  });
                                }
                              }}
                            >
                              Mesclar (manter {keepId})
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {dupTotal > 25 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={dupPage <= 1}
                  onClick={() => setDupPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {dupPage} de {dupTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={dupPage >= dupTotalPages}
                  onClick={() =>
                    setDupPage((p) => Math.min(dupTotalPages, p + 1))
                  }
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
