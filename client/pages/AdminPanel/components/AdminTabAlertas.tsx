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
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AlertStockItem } from "../types";
import { formatValidityDate } from "@/helpers/dates.helper";

interface AdminTabAlertasProps {
  alerts: {
    noStock: AlertStockItem[];
    belowMin: AlertStockItem[];
    expired: AlertStockItem[];
    expiringSoon: AlertStockItem[];
  };
  counts: {
    noStock: number;
    belowMin: number;
    expired: number;
    expiringSoon: number;
  };
  loadingAlerts: boolean;
}

function AlertTable({
  title,
  count,
  rows,
  titleClassName,
}: {
  title: string;
  count: number;
  rows: AlertStockItem[];
  titleClassName?: string;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((rows.length || 0) / pageSize));

  const currentRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page]);

  return (
    <div>
      <h3
        className={`text-sm font-medium mb-2 flex items-center gap-2 ${titleClassName ?? ""}`}
      >
        <span>{title}</span>
        <span className="text-muted-foreground">({count})</span>
      </h3>
      <div className="border rounded-md overflow-auto max-h-48">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>Qtd</TableHead>
              <TableHead>Mín.</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Setor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Nenhum
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell>{row.detalhe ?? "-"}</TableCell>
                  <TableCell>{row.quantidade}</TableCell>
                  <TableCell>{row.minimo ?? "-"}</TableCell>
                  <TableCell>{formatValidityDate(row.validade)}</TableCell>
                  <TableCell>{row.setor}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > pageSize && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages}
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
      )}
    </div>
  );
}

export function AdminTabAlertas({
  alerts,
  counts,
  loadingAlerts,
}: AdminTabAlertasProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas consolidados de estoque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingAlerts ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando alertas...
          </div>
        ) : (
          <>
            <AlertTable
              title="Sem estoque"
              count={counts.noStock}
              rows={alerts.noStock}
              titleClassName="text-red-600"
            />
            <AlertTable
              title="Abaixo do mínimo"
              count={counts.belowMin}
              rows={alerts.belowMin}
              titleClassName="text-amber-600"
            />
            <AlertTable
              title="Vencidos"
              count={counts.expired}
              rows={alerts.expired}
              titleClassName="text-red-700"
            />
            <AlertTable
              title="Próximos ao vencimento"
              count={counts.expiringSoon}
              rows={alerts.expiringSoon}
              titleClassName="text-orange-600"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
