import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatDateTimePtBr, formatDateToPtBr } from "@/helpers/dates.helper";
import type { Dispatch, SetStateAction } from "react";
import type {
  AdminActiveUserThisMonth,
  StockHistoryEntry,
} from "@/api/requests";

type Vm = {
  metricsDialog: null | "activeUsers" | "movements";
  setMetricsDialog: (v: null | "activeUsers" | "movements") => void;
  metricsPage: number;
  setMetricsPage: Dispatch<SetStateAction<number>>;
  metricsLimit: number;
  setMetricsLimit: Dispatch<SetStateAction<number>>;
  metricsLoading: boolean;
  metricsTotalPages: number;
  activeUsersRows: AdminActiveUserThisMonth[];
  movementsRows: StockHistoryEntry[];
};

export function AdminTabResumoMetricsDialog({ vm }: { vm: Vm }) {
  const {
    metricsDialog,
    setMetricsDialog,
    metricsPage,
    setMetricsPage,
    metricsLimit,
    setMetricsLimit,
    metricsLoading,
    metricsTotalPages,
    activeUsersRows,
    movementsRows,
  } = vm;

  return (
    <Dialog
      open={metricsDialog != null}
      onOpenChange={(open) => {
        if (!open) setMetricsDialog(null);
      }}
    >
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {metricsDialog === "activeUsers"
              ? "Usuários ativos este mês"
              : "Movimentações este mês"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2">
          <label className="text-sm text-muted-foreground">
            Itens por página
          </label>
          <Select
            value={String(metricsLimit)}
            onValueChange={(v) => {
              setMetricsLimit(Number(v));
              setMetricsPage(1);
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

        <div className="border rounded-md overflow-auto max-h-[420px]">
          {metricsLoading ? (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {metricsDialog === "activeUsers" ? (
                    <>
                      <TableHead>Nome</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead className="whitespace-nowrap">
                        Último acesso
                      </TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Acessos
                      </TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="whitespace-nowrap">Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        Qtd
                      </TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead>Residente</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricsDialog === "activeUsers" ? (
                  activeUsersRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        Nenhum usuário ativo no mês.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeUsersRows.map((u) => {
                      const fullName = [u.first_name, u.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim();
                      const last = u.last_login_at
                        ? formatDateTimePtBr(u.last_login_at)
                        : "-";
                      return (
                        <TableRow key={u.id}>
                          <TableCell>{fullName || u.login}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {u.login}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {last}
                          </TableCell>
                          <TableCell className="text-right">
                            {u.logins_count ?? 0}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )
                ) : movementsRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma movimentação no mês.
                    </TableCell>
                  </TableRow>
                ) : (
                  movementsRows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateToPtBr(m.data)}
                      </TableCell>
                      <TableCell>{m.tipo}</TableCell>
                      <TableCell>{m.nome}</TableCell>
                      <TableCell className="text-right">
                        {m.quantidade}
                      </TableCell>
                      <TableCell>{m.setor}</TableCell>
                      <TableCell>{m.operador}</TableCell>
                      <TableCell>{m.residente ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={metricsPage <= 1}
            onClick={() => setMetricsPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Página {metricsPage} de {metricsTotalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={metricsPage >= metricsTotalPages}
            onClick={() =>
              setMetricsPage((p) => Math.min(metricsTotalPages, p + 1))
            }
          >
            Próxima
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
