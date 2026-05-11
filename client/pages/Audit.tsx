"use client";

import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadComplianceCsv,
  getComplianceAuditEvents,
  getComplianceLoginLog,
  type ComplianceAuditInsights,
} from "@/api/requests";
import { getErrorMessage } from "@/helpers/validation.helper";
import { toast } from "@/hooks/use-toast.hook";
import { pageSurfaceSubtleClass } from "@/components/page/page-ui.constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Audit() {
  const [days, setDays] = useState(30);
  const [pageAudit, setPageAudit] = useState(1);
  const [pageLogin, setPageLogin] = useState(1);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [insights, setInsights] = useState<ComplianceAuditInsights | null>(
    null,
  );
  const [loginData, setLoginData] = useState<{
    data: Array<{
      id: number;
      user_id: number | null;
      login: string;
      success: boolean;
      ip: string | null;
      created_at: string | Date;
    }>;
    total: number;
    page: number;
    limit: number;
  } | null>(null);

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await getComplianceAuditEvents({
        days,
        page: pageAudit,
        limit: 25,
      });
      setInsights(res);
    } catch (e) {
      toast({
        title: "Erro",
        description: getErrorMessage(
          e,
          "Não foi possível carregar a auditoria.",
          "Audit:events",
        ),
        variant: "error",
        duration: 4000,
      });
    } finally {
      setLoadingAudit(false);
    }
  }, [days, pageAudit]);

  const loadLogin = useCallback(async () => {
    setLoadingLogin(true);
    try {
      const res = await getComplianceLoginLog({
        days,
        page: pageLogin,
        limit: 25,
      });
      setLoginData(res);
    } catch (e) {
      toast({
        title: "Erro",
        description: getErrorMessage(
          e,
          "Não foi possível carregar o log de acessos.",
          "Audit:login",
        ),
        variant: "error",
        duration: 4000,
      });
    } finally {
      setLoadingLogin(false);
    }
  }, [days, pageLogin]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  useEffect(() => {
    void loadLogin();
  }, [loadLogin]);

  async function handleCsv(
    kind: "events" | "login" | "movements",
  ): Promise<void> {
    try {
      await downloadComplianceCsv(kind, { days: String(days) });
      toast({
        title: "Transferência iniciada",
        description: "O ficheiro deve começar a transferir em breve.",
        variant: "success",
        duration: 2500,
      });
    } catch (e) {
      toast({
        title: "Erro ao exportar",
        description: getErrorMessage(e, "Falha na exportação.", "Audit:csv"),
        variant: "error",
        duration: 4000,
      });
    }
  }

  const totalAuditPages = insights
    ? Math.max(1, Math.ceil(insights.totalFiltered / 25))
    : 1;
  const totalLoginPages = loginData
    ? Math.max(1, Math.ceil(loginData.total / loginData.limit))
    : 1;

  return (
    <Layout title="Auditoria">
      <div
        className={`${pageSurfaceSubtleClass} max-w-7xl mx-auto px-4 py-8 space-y-6`}
      >
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Conformidade e trilhas
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Eventos de alterações na API e tentativas de login registadas para
              este abrigo. Use exportação CSV para arquivo ou inspeção.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="audit-days" className="text-xs">
                Período (dias)
              </Label>
              <Input
                id="audit-days"
                type="number"
                min={1}
                max={365}
                className="w-28 rounded-xl mt-1"
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 30)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                setPageAudit(1);
                setPageLogin(1);
                void loadAudit();
                void loadLogin();
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="rounded-xl">
            <TabsTrigger value="events" className="rounded-lg">
              Eventos de auditoria
            </TabsTrigger>
            <TabsTrigger value="login" className="rounded-lg">
              Log de acessos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={loadingAudit}
                onClick={() => void handleCsv("events")}
              >
                CSV — eventos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={loadingAudit}
                onClick={() => void handleCsv("movements")}
              >
                CSV — movimentações
              </Button>
            </div>
            {insights && (
              <p className="text-xs text-muted-foreground">
                Criados: {insights.created} · Atualizados: {insights.updated} ·
                Removidos: {insights.deleted} · Listagem:{" "}
                {insights.totalFiltered} evento(s)
              </p>
            )}
            <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Caminho
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAudit ? (
                    <TableRow>
                      <TableCell colSpan={5}>A carregar…</TableCell>
                    </TableRow>
                  ) : insights?.events.length ? (
                    insights.events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(e.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {e.method}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.resource ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.status_code}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs max-w-[280px] truncate">
                          {e.path}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5}>Sem eventos no período.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={pageAudit <= 1 || loadingAudit}
                onClick={() => setPageAudit((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {pageAudit} / {totalAuditPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={loadingAudit || pageAudit >= totalAuditPages}
                onClick={() => setPageAudit((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={loadingLogin}
                onClick={() => void handleCsv("login")}
              >
                CSV — log de acessos
              </Button>
            </div>
            <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Sucesso</TableHead>
                    <TableHead className="hidden sm:table-cell">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLogin ? (
                    <TableRow>
                      <TableCell colSpan={4}>A carregar…</TableCell>
                    </TableRow>
                  ) : loginData?.data.length ? (
                    loginData.data.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(
                            typeof r.created_at === "string"
                              ? r.created_at
                              : r.created_at.toISOString(),
                          ).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs">{r.login}</TableCell>
                        <TableCell className="text-xs">
                          {r.success ? "Sim" : "Não"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">
                          {r.ip ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        Sem registos no período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={pageLogin <= 1 || loadingLogin}
                onClick={() => setPageLogin((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {pageLogin} / {totalLoginPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={
                  loadingLogin || !loginData || pageLogin >= totalLoginPages
                }
                onClick={() => setPageLogin((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          Período de exemplo terminando hoje: últimos {days} dias (ou use
          fromDate / toDate na API para relatórios personalizados).
        </p>
      </div>
    </Layout>
  );
}
