import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import { SkeletonTable } from "@/components/SkeletonTable";
import { toast } from "@/hooks/use-toast.hook";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import {
  deleteResident,
  getResidents,
  getResidentActiveMedicalRecord,
  updateResident,
  type ActiveMedicalRecordItem,
} from "@/api/requests";
import { formatDateToPtBr } from "@/helpers/dates.helper";
import {
  cpfDigitsOnly,
  cpfInputValueFromStored,
  cpfPayloadFromInput,
  formatCpfForDisplay,
  formatCpfMask,
} from "@/helpers/cpf-format.helper";
import { DEFAULT_PAGE_SIZE } from "@/helpers/paginacao.helper";
import { compareResidentsByNameThenCasela } from "@/helpers/resident-sort.helper";
import { useTenant } from "@/hooks/use-tenant.hook";
import { usePermissionMatrix } from "@/hooks/usePermissionMatrix";
import {
  PREVIEW_RESIDENTS,
  getPreviewActiveMedicalRecordForCasela,
} from "@/helpers/preview-mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DownloadJobButton } from "@/components/DownloadJobButton";
import { ClipboardList, Pencil, Trash2, UserRound, Users } from "lucide-react";
import DeletePopUp from "@/components/DeletePopUp";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ResidentRow } from "@/components/residents/residents.types";
import { EmptyStateCard } from "@/components/medical-record-exports/medical-record-exports.shared";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";
import { ResidentMedicalRecordTable } from "@/components/residents/ResidentMedicalRecordTable";
import { residentInitials } from "@/components/residents/residents.stock-chart";

export default function Resident() {
  const { previewMode } = useTenant();
  const { can } = usePermissionMatrix();
  const canUpdateResidents = can("residents", "update");
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCasela, setSelectedCasela] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [residentChartItems, setResidentChartItems] = useState<
    ActiveMedicalRecordItem[]
  >([]);
  const [residentChartLoading, setResidentChartLoading] = useState(false);
  const [residentChartPage, setResidentChartPage] = useState(1);
  const RESIDENT_CHART_PAGE_SIZE = 10;
  const [residentChartNameFilter, setResidentChartNameFilter] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editDataNascimento, setEditDataNascimento] = useState("");
  const [editCpf, setEditCpf] = useState("");

  const loadResidents = useCallback(async () => {
    setLoading(true);
    try {
      if (previewMode) {
        const start = (page - 1) * DEFAULT_PAGE_SIZE;
        const slice = PREVIEW_RESIDENTS.slice(start, start + DEFAULT_PAGE_SIZE);
        setResidents(slice.map((r) => ({ ...r, cpf: null })));
        setHasNext(start + DEFAULT_PAGE_SIZE < PREVIEW_RESIDENTS.length);
        return;
      }

      const res = await getResidents(page, DEFAULT_PAGE_SIZE);
      const mapped = (Array.isArray(res.data) ? res.data : []).map((r) => ({
        name: String(r.name ?? ""),
        casela: Number(r.casela),
        cpf:
          (r as { cpf?: unknown }).cpf != null
            ? String((r as { cpf?: unknown }).cpf)
            : null,
        data_nascimento:
          r.data_nascimento != null ? String(r.data_nascimento) : null,
        idade:
          typeof r.idade === "number" && Number.isFinite(r.idade)
            ? r.idade
            : null,
      }));
      setResidents(mapped);
      setHasNext(Boolean(res.hasNext));
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(
        err,
        "Não foi possível carregar a lista de residentes.",
        "Residents:load",
      );
      toast({
        title: "Erro ao carregar residentes",
        description: errorMessage,
        variant: "error",
        duration: 3000,
      });
      setResidents([]);
      setHasNext(false);
    } finally {
      setLoading(false);
    }
  }, [previewMode, page]);

  useEffect(() => {
    void loadResidents();
  }, [loadResidents]);

  useEffect(() => {
    setSelectedCasela((prev) => {
      if (prev == null) return null;
      return residents.some((r) => r.casela === prev) ? prev : null;
    });
  }, [residents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? residents
      : residents.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            String(r.casela).includes(q.trim()),
        );
    return [...list].sort(compareResidentsByNameThenCasela);
  }, [residents, search]);

  const selected = useMemo(
    () => residents.find((r) => r.casela === selectedCasela) ?? null,
    [residents, selectedCasela],
  );

  const loadResidentMedicalRecordSource = useCallback(
    async (casela: number) => {
      setResidentChartLoading(true);
      try {
        if (previewMode) {
          setResidentChartItems(getPreviewActiveMedicalRecordForCasela(casela));
          return;
        }
        const res = await getResidentActiveMedicalRecord(casela);
        setResidentChartItems(res.items ?? []);
      } catch {
        toast({
          title: "Falha ao carregar prontuário",
          description:
            "Não foi possível carregar medicamentos e insumos em uso nesta casela.",
          variant: "error",
          duration: 3000,
        });
        setResidentChartItems([]);
      } finally {
        setResidentChartLoading(false);
      }
    },
    [previewMode],
  );

  useEffect(() => {
    if (selected == null) {
      setResidentChartItems([]);
      setResidentChartPage(1);
      return;
    }
    setResidentChartPage(1);
  }, [selected]);

  useEffect(() => {
    if (selected == null) return;
    setResidentChartPage(1);
  }, [selected, residentChartNameFilter]);

  useEffect(() => {
    if (selected == null) return;
    void loadResidentMedicalRecordSource(selected.casela);
  }, [
    selected,
    selected?.casela,
    previewMode,
    loadResidentMedicalRecordSource,
  ]);

  const residentMedicalRecordFiltered = useMemo(() => {
    let list = residentChartItems;
    const nameQ = residentChartNameFilter.trim().toLowerCase();
    if (nameQ) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(nameQ) ||
          (i.detail && i.detail.toLowerCase().includes(nameQ)),
      );
    }
    return list;
  }, [residentChartItems, residentChartNameFilter]);

  const residentMedicalRecordPageSlice = useMemo(() => {
    const start = (residentChartPage - 1) * RESIDENT_CHART_PAGE_SIZE;
    return residentMedicalRecordFiltered.slice(
      start,
      start + RESIDENT_CHART_PAGE_SIZE,
    );
  }, [residentMedicalRecordFiltered, residentChartPage]);

  const residentChartTotal = residentMedicalRecordFiltered.length;

  const residentChartDownloadParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (selected?.casela != null) params.casela = String(selected.casela);
    return params;
  }, [selected]);

  const residentChartTotalPages = useMemo(
    () => Math.max(1, Math.ceil(residentChartTotal / RESIDENT_CHART_PAGE_SIZE)),
    [residentChartTotal],
  );

  const handleEditResident = useCallback(() => {
    if (!selected || previewMode) return;
    setEditNome(selected.name ?? "");
    setEditDataNascimento(
      typeof selected.data_nascimento === "string"
        ? selected.data_nascimento
        : "",
    );
    setEditCpf(cpfInputValueFromStored(selected.cpf));
    setEditOpen(true);
  }, [selected, previewMode]);

  const handleSaveEdit = useCallback(async () => {
    if (!selected || previewMode) return;
    const nomeTrim = editNome.trim();
    if (!nomeTrim) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome completo do residente.",
        variant: "warning",
        duration: 3000,
      });
      return;
    }

    const cpfDigits = cpfPayloadFromInput(editCpf);
    if (cpfDigits !== null && cpfDigits.length !== 11) {
      toast({
        title: "CPF incompleto",
        description: "Informe os 11 dígitos do CPF ou deixe o campo vazio.",
        variant: "warning",
        duration: 3500,
      });
      return;
    }

    setEditSaving(true);
    try {
      const dn = editDataNascimento.trim();
      await updateResident(selected.casela, {
        nome: nomeTrim,
        cpf: cpfDigits && cpfDigits.length === 11 ? cpfDigits : null,
        data_nascimento: dn === "" ? null : dn,
      });
      toast({
        title: "Residente atualizado",
        description: "Dados salvos com sucesso.",
        variant: "success",
        duration: 3000,
      });
      setEditOpen(false);
      await loadResidents();
    } catch (err: unknown) {
      toast({
        title: "Erro ao salvar",
        description: getErrorMessage(
          err,
          "Não foi possível guardar as alterações.",
          "Residents:update",
        ),
        variant: "error",
        duration: 3500,
      });
    } finally {
      setEditSaving(false);
    }
  }, [
    selected,
    previewMode,
    editNome,
    editDataNascimento,
    loadResidents,
    setEditOpen,
    editCpf,
  ]);

  const handleDeleteResident = useCallback(async () => {
    if (!selected || previewMode) return;
    setDeleteLoading(true);
    try {
      await deleteResident(selected.casela);
      toast({
        title: "Residente removido",
        description: "A casela foi removida com sucesso.",
        variant: "success",
        duration: 3000,
      });
      setDeleteOpen(false);
      setSelectedCasela(null);
      await loadResidents();
    } catch (err: unknown) {
      toast({
        title: "Não foi possível remover",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "Residents:delete",
        ),
        variant: "error",
        duration: 3500,
      });
    } finally {
      setDeleteLoading(false);
    }
  }, [selected, previewMode, loadResidents]);

  return (
    <Layout
      title="Residentes"
      description="Lista por casela, detalhe e ligação ao estoque por residente."
    >
      <div className="flex w-full flex-col gap-8 pb-12 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!previewMode ? (
            <Button asChild className="rounded-xl">
              <Link href="/residents/register">Novo residente</Link>
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou casela…"
              className="rounded-xl"
            />
            {loading ? (
              <SkeletonTable rows={5} cols={2} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                {filtered.map((r) => {
                  const active = selectedCasela === r.casela;
                  return (
                    <button
                      key={r.casela}
                      type="button"
                      onClick={() =>
                        setSelectedCasela((prev) =>
                          prev === r.casela ? null : r.casela,
                        )
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        active
                          ? "border-primary bg-primary/8 shadow-md"
                          : "border-border/80 bg-card hover:border-primary/30 hover:bg-accent/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100",
                        )}
                      >
                        {residentInitials(r.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {r.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ({r.casela})
                          {r.idade != null ? (
                            <span className="text-foreground/90">
                              {" "}
                              · {r.idade} anos
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!loading && filtered.length === 0 ? (
              <EmptyStateCard
                icon={Users}
                title="Nenhum residente encontrado"
                description="Ajuste a busca ou volte à página anterior para ver mais caselas."
              />
            ) : null}

            {!loading ? (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl min-w-[7rem]"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl min-w-[7rem]"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext}
                >
                  Próximo
                </Button>
              </div>
            ) : null}
          </div>

          <div className="xl:col-span-8">
            {selected ? (
              <section
                className={cn(pageSurfaceCardClass, "h-full min-h-[280px]")}
              >
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100">
                      <UserRound className="h-12 w-12" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-display text-2xl font-semibold tracking-tight">
                          {selected.name}
                        </h2>
                        {!previewMode ? (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 rounded-xl"
                              onClick={handleEditResident}
                              aria-label="Editar residente"
                              disabled={deleteLoading || editSaving}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-10 w-10 rounded-xl"
                              onClick={() => setDeleteOpen(true)}
                              aria-label="Remover residente"
                              disabled={deleteLoading || editSaving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground">
                        Casela{" "}
                        <span className="font-medium text-foreground">
                          {selected.casela}
                        </span>
                      </p>
                      {previewMode ? (
                        <p className="text-sm text-amber-800 dark:text-amber-200/90 pt-2">
                          Modo de visualização: não é possível alterar
                          cadastros.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-border/60 pt-6">
                    <div>
                      <dt className="text-muted-foreground">Nome completo</dt>
                      <dd className="font-medium mt-1">{selected.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Casela</dt>
                      <dd className="font-medium mt-1">{selected.casela}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">CPF</dt>
                      <dd className="font-medium mt-1">
                        {formatCpfForDisplay(selected.cpf)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Data de nascimento
                      </dt>
                      <dd className="font-medium mt-1">
                        {selected.data_nascimento
                          ? formatDateToPtBr(selected.data_nascimento)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Idade</dt>
                      <dd className="font-medium mt-1">
                        {selected.idade != null
                          ? `${selected.idade} anos`
                          : "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="border-t border-border/60 pt-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ClipboardList
                          className="h-5 w-5 text-muted-foreground shrink-0"
                          aria-hidden
                        />
                        <h3 className="text-base font-semibold tracking-tight">
                          Prontuário
                        </h3>
                      </div>
                      <DownloadJobButton
                        reportType="prontuario_residente"
                        params={residentChartDownloadParams}
                        filenameBase={`medical-record-casela-${selected.casela}-${new Date().toISOString().slice(0, 10)}`}
                        disabled={residentChartLoading}
                        label="Descarregar"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      O que o residente utiliza
                    </p>
                    <div className="grid grid-cols-1 gap-3 max-w-md">
                      <div className="space-y-1">
                        <Label htmlFor="chart-name" className="text-xs">
                          Nome ou detalhe
                        </Label>
                        <Input
                          id="chart-name"
                          value={residentChartNameFilter}
                          onChange={(e) =>
                            setResidentChartNameFilter(e.target.value)
                          }
                          placeholder="ex.: Paracetamol"
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                    {residentChartLoading ? (
                      <SkeletonTable rows={4} cols={7} />
                    ) : residentMedicalRecordPageSlice.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center rounded-xl border border-dashed border-border/70">
                        Não há medicamentos nem insumos ativos na casela (com os
                        filtros atuais).
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <ResidentMedicalRecordTable
                          casela={selected.casela}
                          items={residentMedicalRecordPageSlice}
                          previewMode={previewMode}
                          canUpdate={canUpdateResidents}
                          onSaved={() =>
                            void loadResidentMedicalRecordSource(
                              selected.casela,
                            )
                          }
                        />

                        <div className="flex flex-col items-center justify-center gap-2 pt-1">
                          <p className="text-xs text-muted-foreground">
                            A mostrar{" "}
                            <span className="font-medium text-foreground">
                              {residentChartTotal === 0
                                ? 0
                                : (residentChartPage - 1) *
                                    RESIDENT_CHART_PAGE_SIZE +
                                  1}
                              –
                              {(residentChartPage - 1) *
                                RESIDENT_CHART_PAGE_SIZE +
                                residentMedicalRecordPageSlice.length}
                            </span>{" "}
                            de{" "}
                            <span className="font-medium text-foreground">
                              {residentChartTotal}
                            </span>
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl min-w-[7rem]"
                              onClick={() =>
                                setResidentChartPage((p) => Math.max(1, p - 1))
                              }
                              disabled={residentChartPage <= 1}
                            >
                              Anterior
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Página {residentChartPage} de{" "}
                              {residentChartTotalPages}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl min-w-[7rem]"
                              onClick={() =>
                                setResidentChartPage((p) =>
                                  Math.min(residentChartTotalPages, p + 1),
                                )
                              }
                              disabled={
                                residentChartPage >= residentChartTotalPages
                              }
                            >
                              Seguinte
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <DeletePopUp
                    open={deleteOpen}
                    onCancel={() => {
                      if (deleteLoading) return;
                      setDeleteOpen(false);
                    }}
                    onConfirm={handleDeleteResident}
                    message={`Remover ${selected.name} (casela ${selected.casela})?`}
                  />

                  <Dialog
                    open={editOpen}
                    onOpenChange={(open) => {
                      if (editSaving) return;
                      setEditOpen(open);
                    }}
                  >
                    <DialogContent className="max-w-lg rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Editar residente</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label htmlFor="resident-nome">Nome completo</Label>
                          <Input
                            id="resident-nome"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            disabled={editSaving}
                            className="rounded-xl"
                            maxLength={80}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label htmlFor="resident-casela">Casela</Label>
                            <Input
                              id="resident-casela"
                              value={String(selected.casela)}
                              disabled
                              className="rounded-xl bg-muted"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="resident-idade">Idade</Label>
                            <Input
                              id="resident-idade"
                              value={
                                selected.idade != null
                                  ? `${selected.idade} anos`
                                  : "—"
                              }
                              disabled
                              className="rounded-xl bg-muted"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="resident-cpf">CPF</Label>
                          <Input
                            id="resident-cpf"
                            value={editCpf}
                            onChange={(e) =>
                              setEditCpf(
                                formatCpfMask(cpfDigitsOnly(e.target.value)),
                              )
                            }
                            disabled={editSaving}
                            className="rounded-xl"
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={14}
                          />
                          <p className="text-xs text-muted-foreground">
                            Deixe em branco para remover.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="resident-dn">
                            Data de nascimento
                          </Label>
                          <Input
                            id="resident-dn"
                            type="date"
                            value={editDataNascimento}
                            onChange={(e) =>
                              setEditDataNascimento(e.target.value)
                            }
                            disabled={editSaving}
                            className="rounded-xl"
                          />
                          <p className="text-xs text-muted-foreground">
                            Deixe em branco para remover. A idade é calculada
                            automaticamente.
                          </p>
                        </div>
                      </div>

                      <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setEditOpen(false)}
                          disabled={editSaving}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          className="rounded-xl"
                          onClick={handleSaveEdit}
                          disabled={editSaving}
                        >
                          {editSaving ? "Salvando..." : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center text-muted-foreground">
                Selecione um residente na lista.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
