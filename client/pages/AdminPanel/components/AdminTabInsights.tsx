import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PlusCircle, Edit, XCircle } from "lucide-react";
import { AUDIT_OPERATION_LABEL, AUDIT_RESOURCE_LABEL } from "../constants";
import { auditStatusLabel, auditValuePreview } from "../helpers/audit.helpers";
import type { InsightsData, AuditEvent } from "../types";

interface AdminUserOption {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
}

interface AdminTabInsightsProps {
  insights: InsightsData | null;
  loadingInsights: boolean;
  insightDaysInput: string;
  setInsightDaysInput: (v: string) => void;
  applyInsightDays: () => void;
  insightFilter: "create" | "update" | "delete" | null;
  setInsightFilter: (v: "create" | "update" | "delete" | null) => void;
  insightResourceFilter: string;
  setInsightResourceFilter: (v: string) => void;
  insightUserIdFilter: number | "";
  setInsightUserIdFilter: (v: number | "") => void;
  adminUsers: AdminUserOption[];
  setEventsPage: (v: number) => void;
  eventsPage: number;
  eventsPageSize: number;
  setEventsPageSize: (v: number) => void;
  goToPage: (page: number) => void;
  totalFiltered: number;
  totalPages: number;
  from: number;
  to: number;
  setAuditCompareEvent: (e: AuditEvent | null) => void;
}

export function AdminTabInsights({
  insights,
  loadingInsights,
  insightDaysInput,
  setInsightDaysInput,
  applyInsightDays,
  insightFilter,
  setInsightFilter,
  insightResourceFilter,
  setInsightResourceFilter,
  insightUserIdFilter,
  setInsightUserIdFilter,
  adminUsers,
  setEventsPage,
  eventsPage,
  eventsPageSize,
  setEventsPageSize,
  goToPage,
  totalFiltered,
  totalPages,
  from,
  to,
  setAuditCompareEvent,
}: AdminTabInsightsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle>Auditoria</CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="insight-days" className="text-sm whitespace-nowrap">
            Últimos
          </Label>
          <Input
            id="insight-days"
            type="number"
            min={1}
            max={365}
            className="w-20"
            value={insightDaysInput}
            onChange={(e) => setInsightDaysInput(e.target.value)}
            onBlur={applyInsightDays}
            onKeyDown={(e) => e.key === "Enter" && applyInsightDays()}
          />
          <Label htmlFor="insight-days" className="text-sm whitespace-nowrap">
            dias
          </Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={applyInsightDays}
          >
            Aplicar
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Recurso</Label>
            <Select
              value={insightResourceFilter || "all"}
              onValueChange={(v) => {
                setInsightResourceFilter(v === "all" ? "" : v);
                setEventsPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(AUDIT_RESOURCE_LABEL).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Usuário</Label>
            <Select
              value={
                insightUserIdFilter === "" ? "all" : String(insightUserIdFilter)
              }
              onValueChange={(v) => {
                setInsightUserIdFilter(v === "all" ? "" : Number(v));
                setEventsPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {adminUsers.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.login}
                    {u.firstName || u.lastName
                      ? ` (${[u.firstName, u.lastName].filter(Boolean).join(" ")})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingInsights ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : insights ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  insightFilter === "create"
                    ? "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : ""
                }`}
                onClick={() => {
                  setInsightFilter(
                    insightFilter === "create" ? null : "create",
                  );
                  setEventsPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-green-600" />
                    Criados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insights.created}</p>
                  <p className="text-xs text-muted-foreground">
                    operações de criação • clique para filtrar
                  </p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  insightFilter === "update"
                    ? "ring-2 ring-sky-500 bg-sky-50/50 dark:bg-sky-950/20"
                    : ""
                }`}
                onClick={() => {
                  setInsightFilter(
                    insightFilter === "update" ? null : "update",
                  );
                  setEventsPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Edit className="h-4 w-4 text-sky-600" />
                    Editados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insights.updated}</p>
                  <p className="text-xs text-muted-foreground">
                    operações de edição • clique para filtrar
                  </p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  insightFilter === "delete"
                    ? "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20"
                    : ""
                }`}
                onClick={() => {
                  setInsightFilter(
                    insightFilter === "delete" ? null : "delete",
                  );
                  setEventsPage(1);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Removidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insights.deleted}</p>
                  <p className="text-xs text-muted-foreground">
                    operações de remoção • clique para filtrar
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <p className="text-sm text-muted-foreground">
                {insightFilter ? (
                  <>
                    Exibindo apenas{" "}
                    {insightFilter === "create"
                      ? "criações"
                      : insightFilter === "update"
                        ? "edições"
                        : "remoções"}
                    . Total no período: {insights.total} operações.{" "}
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => {
                        setInsightFilter(null);
                        setEventsPage(1);
                      }}
                    >
                      Ver todos
                    </Button>
                  </>
                ) : (
                  <>Total no período: {insights.total} operações</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="page-size"
                  className="text-sm whitespace-nowrap"
                >
                  Por página
                </Label>
                <Select
                  value={String(eventsPageSize)}
                  onValueChange={(v) => {
                    setEventsPageSize(Number(v));
                    setEventsPage(1);
                  }}
                >
                  <SelectTrigger id="page-size" className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-md overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="min-w-[140px]">Antes</TableHead>
                    <TableHead className="min-w-[140px]">Depois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights.events.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum evento neste filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    insights.events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {e.resource
                            ? (AUDIT_RESOURCE_LABEL[e.resource] ?? e.resource)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {AUDIT_OPERATION_LABEL[e.operation_type] ??
                            e.operation_type}
                        </TableCell>
                        <TableCell>{auditStatusLabel(e.status_code)}</TableCell>
                        <TableCell
                          className="text-xs min-w-[200px] max-w-[360px] font-mono truncate align-top cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30"
                          title="Clique para ver comparação (Antes e Depois)"
                          onClick={() => setAuditCompareEvent(e)}
                        >
                          {auditValuePreview(e.old_value)}
                        </TableCell>
                        <TableCell
                          className="text-xs min-w-[200px] max-w-[360px] font-mono truncate align-top cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/30"
                          title="Clique para ver comparação (Antes e Depois)"
                          onClick={() => setAuditCompareEvent(e)}
                        >
                          {auditValuePreview(e.new_value)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalFiltered > 0 && (
              <div className="flex flex-col items-center justify-center gap-3 mt-3">
                <p className="text-sm text-muted-foreground">
                  {from}–{to} de {totalFiltered} eventos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(eventsPage - 1)}
                    disabled={eventsPage <= 1 || loadingInsights}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm px-2">
                    Página {eventsPage} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(eventsPage + 1)}
                    disabled={eventsPage >= totalPages || loadingInsights}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">
            Nenhum dado de auditoria no período.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
