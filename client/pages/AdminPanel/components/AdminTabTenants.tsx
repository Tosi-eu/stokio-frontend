import {
  createAdminTenant,
  deleteAdminTenant,
  getAdminTenants,
  type AdminTenant,
} from "@/api/requests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "@/hooks/use-toast.hook";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import { useCallback, useEffect, useMemo, useState } from "react";

export function AdminTabTenants({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminTenant[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / (limit || 1))),
    [total, limit],
  );

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await getAdminTenants({ page, limit });
      setRows(res.data ?? []);
      setTotal(Number(res.total) || 0);
    } catch (e: unknown) {
      toast({
        title: "Não foi possível carregar os abrigos",
        description: getErrorMessage(
          e,
          USER_FACING_RETRY_SHORT,
          "AdminTabTenants:list",
        ),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [enabled, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Abrigos</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            A lista de módulos ativos por abrigo é gerida na aplicação{" "}
            <span className="font-medium text-foreground">Admin Desktop</span>{" "}
            (chave de API), não neste painel web.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Slug</span>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="ex.: abrigo-x"
              />
            </div>
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Nome</span>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Abrigo X"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  const slug = newSlug.trim();
                  const name = newName.trim();
                  if (!slug || !name) {
                    toast({
                      title: "Slug e nome são obrigatórios",
                      variant: "error",
                    });
                    return;
                  }
                  await createAdminTenant({ slug, name });
                  setNewSlug("");
                  setNewName("");
                  toast({ title: "Abrigo criado", variant: "success" });
                  void load();
                } catch (e: unknown) {
                  toast({
                    title: "Não foi possível criar o abrigo",
                    description: getErrorMessage(
                      e,
                      USER_FACING_RETRY_SHORT,
                      "AdminTabTenants:create",
                    ),
                    variant: "error",
                  });
                }
              }}
              disabled={loading}
            >
              Criar
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Itens/página
              </span>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-muted-foreground">
                  Contrato (portfolio)
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    {loading ? "Carregando..." : "Nenhum abrigo"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.id}</TableCell>
                    <TableCell>{t.slug}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {t.contractPortfolioId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (t.id === 1) return;
                          try {
                            await deleteAdminTenant(t.id);
                            toast({
                              title: "Abrigo removido",
                              variant: "success",
                            });
                            void load();
                          } catch (e: unknown) {
                            toast({
                              title: "Não foi possível remover o abrigo",
                              description: getErrorMessage(
                                e,
                                USER_FACING_RETRY_SHORT,
                                "AdminTabTenants:delete",
                              ),
                              variant: "error",
                            });
                          }
                        }}
                        disabled={t.id === 1}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-center gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
