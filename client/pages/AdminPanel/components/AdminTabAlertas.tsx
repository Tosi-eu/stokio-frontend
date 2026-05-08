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
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { AlertNoPriceItem, AlertStockItem } from "../types";
interface AdminTabAlertasProps {
  alerts: {
    noStock: AlertStockItem[];
    belowMin: AlertStockItem[];
    expired: AlertStockItem[];
    expiringSoon: AlertStockItem[];
    noPrice: AlertNoPriceItem[];
  };
  counts: {
    noStock: number;
    belowMin: number;
    expired: number;
    expiringSoon: number;
    noPrice: number;
  };
  loadingAlerts: boolean;
}

function todaySlug(): string {
  return new Date().toISOString().slice(0, 10);
}

async function downloadXlsxFromAoA(
  filename: string,
  sheetName: string,
  aoa: unknown[][],
) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AlertTable({
  title,
  totalCount,
  rows,
  titleClassName,
  exportBasename,
}: {
  title: string;
  totalCount: number;
  rows: AlertStockItem[];
  titleClassName?: string;
  exportBasename: string;
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRows = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.nome,
        r.detalhe,
        r.setor,
        String(r.quantidade),
        String(r.minimo ?? ""),
        r.validade,
        r.tipo_item,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filterQuery]);

  useEffect(() => {
    setPage(1);
  }, [filterQuery, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const currentRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const countLabel =
    filterQuery.trim().length > 0
      ? `${filteredRows.length} correspondentes · ${totalCount} no alerta`
      : `${totalCount}`;

  const handleDownload = () => {
    const header = [
      "Nome",
      "Detalhe",
      "Qtd",
      "Mín",
      "Validade",
      "Setor",
      "Tipo",
    ];
    const aoa: unknown[][] = [
      header,
      ...filteredRows.map((r) => [
        r.nome,
        r.detalhe ?? "",
        r.quantidade,
        r.minimo ?? "",
        r.validade,
        r.setor,
        r.tipo_item,
      ]),
    ];
    void downloadXlsxFromAoA(
      `${exportBasename}-${todaySlug()}.xlsx`,
      title,
      aoa,
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
        <div>
          <h3
            className={`text-sm font-medium flex flex-wrap items-center gap-2 ${titleClassName ?? ""}`}
          >
            <span>{title}</span>
            <span className="text-muted-foreground font-normal">
              ({countLabel})
            </span>
          </h3>
          {rows.length < totalCount ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Lista carregada: {rows.length} de {totalCount} linhas. Aumente o
              limite no servidor ou exporte para ver todo o conjunto no Excel.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 items-center shrink-0">
          <Input
            placeholder="Filtrar nesta tabela…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="h-8 max-w-[220px]"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleDownload}
            disabled={filteredRows.length === 0}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            Excel
          </Button>
        </div>
      </div>
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
            {filteredRows.length === 0 ? (
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
                <TableRow key={`${row.nome}-${row.setor}-${idx}`}>
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

      {filteredRows.length > pageSize ? (
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
      ) : null}
    </div>
  );
}

function tipoCatalogLabel(tipo: string): string {
  if (tipo === "medicamento") return "Medicamento";
  if (tipo === "insumo") return "Insumo";
  return tipo || "-";
}

function NoPriceAlertTable({
  title,
  totalCount,
  rows,
  titleClassName,
  exportBasename,
}: {
  title: string;
  totalCount: number;
  rows: AlertNoPriceItem[];
  titleClassName?: string;
  exportBasename: string;
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredRows = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.nome,
        r.detalhe,
        tipoCatalogLabel(r.tipo_item),
        String(r.minimo ?? ""),
        String(r.tentativas_busca),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filterQuery]);

  useEffect(() => {
    setPage(1);
  }, [filterQuery, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const currentRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const countLabel =
    filterQuery.trim().length > 0
      ? `${filteredRows.length} correspondentes · ${totalCount} no alerta`
      : `${totalCount}`;

  const handleDownload = () => {
    const header = ["Nome", "Tipo", "Detalhe", "Mín.", "Buscas (auto)"];
    const aoa: unknown[][] = [
      header,
      ...filteredRows.map((r) => [
        r.nome,
        tipoCatalogLabel(r.tipo_item),
        r.detalhe ?? "",
        r.minimo ?? "",
        r.tentativas_busca,
      ]),
    ];
    void downloadXlsxFromAoA(
      `${exportBasename}-${todaySlug()}.xlsx`,
      title,
      aoa,
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
        <div>
          <h3
            className={`text-sm font-medium flex flex-wrap items-center gap-2 ${titleClassName ?? ""}`}
          >
            <span>{title}</span>
            <span className="text-muted-foreground font-normal">
              ({countLabel})
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Catálogo sem preço definido (inclui itens que já atingiram o limite
            de buscas automáticas pelo agendamento).
          </p>
          {rows.length < totalCount ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Lista carregada: {rows.length} de {totalCount} linhas.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 items-center shrink-0">
          <Input
            placeholder="Filtrar nesta tabela…"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="h-8 max-w-[220px]"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleDownload}
            disabled={filteredRows.length === 0}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            Excel
          </Button>
        </div>
      </div>
      <div className="border rounded-md overflow-auto max-h-48">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>Mín.</TableHead>
              <TableHead className="text-right">Buscas (auto)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Nenhum
                </TableCell>
              </TableRow>
            ) : (
              currentRows.map((row, idx) => (
                <TableRow key={`${row.tipo_item}-${row.nome}-${idx}`}>
                  <TableCell>{row.nome}</TableCell>
                  <TableCell>{tipoCatalogLabel(row.tipo_item)}</TableCell>
                  <TableCell>{row.detalhe ?? "-"}</TableCell>
                  <TableCell>{row.minimo ?? "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.tentativas_busca}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredRows.length > pageSize ? (
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
      ) : null}
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
              totalCount={counts.noStock}
              rows={alerts.noStock}
              titleClassName="text-red-600"
              exportBasename="alertas-sem-estoque"
            />
            <AlertTable
              title="Abaixo do mínimo"
              totalCount={counts.belowMin}
              rows={alerts.belowMin}
              titleClassName="text-amber-600"
              exportBasename="alertas-abaixo-minimo"
            />
            <AlertTable
              title="Vencidos"
              totalCount={counts.expired}
              rows={alerts.expired}
              titleClassName="text-red-700"
              exportBasename="alertas-vencidos"
            />
            <AlertTable
              title="Próximos ao vencimento"
              totalCount={counts.expiringSoon}
              rows={alerts.expiringSoon}
              titleClassName="text-orange-600"
              exportBasename="alertas-proximos-vencimento"
            />
            <NoPriceAlertTable
              title="Sem preço (catálogo)"
              totalCount={counts.noPrice}
              rows={alerts.noPrice}
              titleClassName="text-sky-700 dark:text-sky-400"
              exportBasename="alertas-sem-preco"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
