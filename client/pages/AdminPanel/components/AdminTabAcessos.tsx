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
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LoginLogEntry } from "@/api/requests";

function formatDate(s: string | null) {
  if (!s) return "-";
  try {
    const d = new Date(s);
    return d.toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

interface AdminTabAcessosProps {
  data: LoginLogEntry[];
  total: number;
  loading: boolean;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
  loginFilter: string;
  setLoginFilter: (v: string) => void;
  successFilter: boolean | "";
  setSuccessFilter: (v: boolean | "") => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  applyFilters: () => void;
}

export function AdminTabAcessos({
  data,
  total,
  loading,
  page,
  setPage,
  limit,
  setLimit,
  loginFilter,
  setLoginFilter,
  successFilter,
  setSuccessFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  applyFilters,
}: AdminTabAcessosProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de acessos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Histórico de tentativas de login (sucesso e falha), com IP e data.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="grid gap-2 w-48">
            <Label>Login</Label>
            <Input
              placeholder="Filtrar por login"
              value={loginFilter}
              onChange={(e) => setLoginFilter(e.target.value)}
            />
          </div>
          <div className="grid gap-2 w-36">
            <Label>Resultado</Label>
            <Select
              value={
                successFilter === ""
                  ? "all"
                  : successFilter
                    ? "success"
                    : "failure"
              }
              onValueChange={(v) =>
                setSuccessFilter(v === "all" ? "" : v === "success")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failure">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>De</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Até</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Button onClick={applyFilters}>Filtrar</Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="max-w-[200px]">User-Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(row.created_at)}
                        </TableCell>
                        <TableCell>{row.login}</TableCell>
                        <TableCell>
                          <span
                            className={
                              row.success
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {row.success ? "Sucesso" : "Falha"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.ip ?? "-"}
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate text-muted-foreground"
                          title={row.user_agent ?? undefined}
                        >
                          {row.user_agent ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">
                  Por página
                </Label>
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
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                {from}-{to} de {total}
              </p>
              <div className="flex gap-1">
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
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
