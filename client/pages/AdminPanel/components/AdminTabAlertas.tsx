import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { AlertStockItem } from "../types";

interface AdminTabAlertasProps {
  alerts: {
    noStock: AlertStockItem[];
    belowMin: AlertStockItem[];
    expired: AlertStockItem[];
    expiringSoon: AlertStockItem[];
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
              rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell>{row.detalhe ?? "-"}</TableCell>
                  <TableCell>{row.quantidade}</TableCell>
                  <TableCell>{row.minimo ?? "-"}</TableCell>
                  <TableCell>{row.validade}</TableCell>
                  <TableCell>{row.setor}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AdminTabAlertas({
  alerts,
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
              count={alerts.noStock.length}
              rows={alerts.noStock}
              titleClassName="text-red-600"
            />
            <AlertTable
              title="Abaixo do mínimo"
              count={alerts.belowMin.length}
              rows={alerts.belowMin}
              titleClassName="text-amber-600"
            />
            <AlertTable
              title="Vencidos"
              count={alerts.expired.length}
              rows={alerts.expired}
              titleClassName="text-red-700"
            />
            <AlertTable
              title="Próximos ao vencimento"
              count={alerts.expiringSoon.length}
              rows={alerts.expiringSoon}
              titleClassName="text-orange-600"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
