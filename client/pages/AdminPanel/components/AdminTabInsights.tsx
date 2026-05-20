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
import type { AuditActionFilter } from "../hooks/useAdminInsights";
import { formatDateTimePtBr } from "@/helpers/dates.helper";

interface AdminUserOption {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
}

interface AdminTabInsightsProps {
  insights: InsightsData | null;
  loadingInsights: boolean;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  actionFilter: AuditActionFilter;
  setActionFilter: (v: AuditActionFilter) => void;
  resourceFilter: string;
  setResourceFilter: (v: string) => void;
  operatorUserId: number | "";
  setOperatorUserId: (v: number | "") => void;
  applyFilters: () => void;
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
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  actionFilter,
  setActionFilter,
  resourceFilter,
  setResourceFilter,
  operatorUserId,
  setOperatorUserId,
  applyFilters,
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
      <CardHeader>
        <CardTitle>Auditoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <AuditDateField label="De" value={fromDate} onChange={setFromDate} />
          <AuditDateField label="Até" value={toDate} onChange={setToDate} />
          <div className="grid gap-2">
            <Label>Operador</Label>
            <Select
              value={operatorUserId === "" ? "all" : String(operatorUserId)}
              onValueChange={(v) =>
                setOperatorUserId(v === "all" ? "" : Number(v))
              }
            >
              <SelectTrigger className="w-[200px]">
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
          <div className="grid gap-2">
            <Label>Entidade</Label>
            <Select
              value={resourceFilter || "all"}
              onValueChange={(v) => setResourceFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(AUDIT_RESOURCE_LABEL).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Ação</Label>
            <Select
              value={actionFilter || "all"}
              onValueChange={(v) =>
                setActionFilter(
                  v === "all" ? "" : (v as "create" | "update" | "delete"),
                )
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Remoção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={applyFilters}>
            Filtrar
          </Button>
        </div>

        {loadingInsights ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : insights ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    Criados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insights.created}</p>
                  <p className="text-xs text-muted-foreground">
                    operações de criação no período
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Edit className="h-4 w-4 text-primary" />
                    Editados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insights.updated}</p>
                  <p className="text-xs text-muted-foreground">
                    operações de edição no período
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Removidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{insights.deleted}</p>
                  <p className="text-xs text-muted-foreground">
                    operações de remoção no período
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Total no período: {insights.total} operações
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
                    <TableHead>Operador</TableHead>
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
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhum evento neste filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    insights.events.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDateTimePtBr(e.created_at)}
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">
                          {e.operator?.trim() ||
                            (e.user_id != null ? `#${e.user_id}` : "—")}
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
                          className="text-xs min-w-[200px] max-w-[360px] font-mono truncate align-top cursor-pointer hover:bg-accent/50 dark:hover:bg-primary/10"
                          title="Clique para ver comparação (Antes e Depois)"
                          onClick={() => setAuditCompareEvent(e)}
                        >
                          {auditValuePreview(e.old_value)}
                        </TableCell>
                        <TableCell
                          className="text-xs min-w-[200px] max-w-[360px] font-mono truncate align-top cursor-pointer hover:bg-accent/50 dark:hover:bg-primary/10"
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
              <div className="flex flex-col items-center justify-center gap-3">
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

function AuditDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
