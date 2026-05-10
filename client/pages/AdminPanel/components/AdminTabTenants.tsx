import {
  createAdminTenant,
  deleteAdminTenant,
  getAdminTenantConfig,
  getAdminTenants,
  listTenantModuleDefinitions,
  setAdminTenantConfig,
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
import { ADMIN_TAB_CONFIG_MODULE_OPTIONS } from "./admin-tab-config/admin-tab-config.constants";

export function AdminTabTenants({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminTenant[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modules, setModules] = useState<Set<string>>(new Set());
  const [moduleCatalogOptions, setModuleCatalogOptions] = useState<
    Array<{ key: string; label: string }>
  >(() => [...ADMIN_TAB_CONFIG_MODULE_OPTIONS]);
  const [configLoading, setConfigLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listTenantModuleDefinitions();
        const list = res?.modules;
        if (
          !cancelled &&
          Array.isArray(list) &&
          list.length > 0 &&
          list.every(
            (x) =>
              x && typeof x.key === "string" && typeof x.label === "string",
          )
        ) {
          setModuleCatalogOptions(list);
        }
      } catch {
        /* fallback ADMIN_TAB_CONFIG_MODULE_OPTIONS */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const loadConfig = useCallback(async (id: number) => {
    setConfigLoading(true);
    try {
      const res = await getAdminTenantConfig(id);
      setSelectedId(id);
      const enabled = res.modules?.enabled ?? [];
      setModules(new Set([...enabled, "admin"]));
    } catch (e: unknown) {
      toast({
        title: "Não foi possível carregar a configuração",
        description: getErrorMessage(
          e,
          USER_FACING_RETRY_SHORT,
          "AdminTabTenants:loadConfig",
        ),
        variant: "error",
      });
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const previewJson = useMemo(
    () => JSON.stringify({ enabled: Array.from(modules) }, null, 2),
    [modules],
  );

  const toggle = (key: string) => {
    if (key === "admin") return;
    setModules((prev) => {
      const next = new Set(prev);
      next.add("admin");
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Abrigos</CardTitle>
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
                        variant="outline"
                        onClick={() => void loadConfig(t.id)}
                        disabled={configLoading}
                      >
                        Configurar módulos
                      </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Módulos do abrigo {selectedId ?? "-"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedId == null ? (
            <div className="text-sm text-muted-foreground">
              Selecione um abrigo na lista e clique em “Configurar módulos”.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {moduleCatalogOptions.map((m) => {
                  const lockedAdmin = m.key === "admin";
                  const checked = lockedAdmin || modules.has(m.key);
                  return (
                    <label
                      key={m.key}
                      className={
                        lockedAdmin
                          ? "flex items-center gap-3 border rounded-md p-3 cursor-not-allowed opacity-90 bg-muted/20"
                          : "flex items-center gap-3 border rounded-md p-3 cursor-pointer"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={lockedAdmin}
                        onChange={() => toggle(m.key)}
                      />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Prévia JSON</div>
                <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-64">
                  {previewJson}
                </pre>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (selectedId == null) return;
                    setSaveLoading(true);
                    try {
                      await setAdminTenantConfig(selectedId, {
                        enabled: Array.from(new Set([...modules, "admin"])),
                      });
                      toast({ title: "Config salva" });
                    } catch {
                      toast({
                        title: "Erro ao salvar config",
                        variant: "error",
                      });
                    } finally {
                      setSaveLoading(false);
                    }
                  }}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
