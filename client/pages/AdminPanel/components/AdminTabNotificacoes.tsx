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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, Archive } from "lucide-react";
import type { AdminNotificationItem } from "@/api/requests";

interface AdminTabNotificacoesProps {
  items: AdminNotificationItem[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
  tipoFilter: string;
  setTipoFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  vistoFilter: boolean | "";
  setVistoFilter: (v: boolean | "") => void;
  applyFilters: () => void;
  markAsRead: (id: number) => void;
  archive: (id: number) => void;
}

export function AdminTabNotificacoes({
  items,
  total,
  loading,
  page,
  setPage,
  limit,
  setLimit,
  tipoFilter,
  setTipoFilter,
  statusFilter,
  setStatusFilter,
  vistoFilter,
  setVistoFilter,
  applyFilters,
  markAsRead,
  archive,
}: AdminTabNotificacoesProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão de notificações</CardTitle>
        <p className="text-sm text-muted-foreground">
          Liste, filtre e marque como lidas ou arquive notificações.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="grid gap-2 w-44">
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={tipoFilter || "all"}
              onValueChange={(v) => setTipoFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="medicamento">Medicamento</SelectItem>
                <SelectItem value="reposicao_estoque">Reposição estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-36">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-32">
            <label className="text-sm font-medium">Lida</label>
            <Select
              value={vistoFilter === "" ? "all" : vistoFilter ? "true" : "false"}
              onValueChange={(v) =>
                setVistoFilter(v === "all" ? "" : v === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={applyFilters}>Filtrar</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              <label className="text-sm text-muted-foreground">Itens por página</label>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Residente / Medicamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lida</TableHead>
                    <TableHead className="w-[140px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma notificação encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">
                          {row.data_prevista}
                        </TableCell>
                        <TableCell>{row.tipo_evento}</TableCell>
                        <TableCell>{row.destino}</TableCell>
                        <TableCell>
                          {row.residente_nome ?? row.medicamento_nome ?? "—"}
                        </TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>{row.visto ? "Sim" : "Não"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!row.visto && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(row.id)}
                                title="Marcar como lida"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {row.status !== "cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => archive(row.id)}
                                title="Arquivar"
                                className="text-amber-600"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
