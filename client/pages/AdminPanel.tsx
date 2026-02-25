import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast.hook";
import { useAuth } from "@/hooks/use-auth.hook";
import { useNavigate } from "react-router-dom";
import {
  getAdminUsers,
  getAdminInsights,
  updateAdminUser,
  deleteAdminUser,
  register,
} from "@/api/requests";
import { UserPlus, Pencil, Trash2, PlusCircle, Edit, XCircle } from "lucide-react";

interface AdminUser {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
}

interface AuditEvent {
  id: number;
  user_id: number | null;
  method: string;
  path: string;
  operation_type: string;
  resource: string | null;
  status_code: number;
  duration_ms: number | null;
  created_at: string;
}

interface InsightsData {
  created: number;
  updated: number;
  deleted: number;
  total: number;
  totalFiltered: number;
  events: AuditEvent[];
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightDays, setInsightDays] = useState(30);
  const [insightDaysInput, setInsightDaysInput] = useState("30");
  const [insightFilter, setInsightFilter] = useState<
    "create" | "update" | "delete" | null
  >(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPageSize, setEventsPageSize] = useState(25);
  const [editModal, setEditModal] = useState<AdminUser | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [formEdit, setFormEdit] = useState({
    firstName: "",
    lastName: "",
    login: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [formAdd, setFormAdd] = useState({
    login: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    loadUsers();
  }, [user?.role, navigate]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Erro ao carregar usuários",
        variant: "error",
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadInsights() {
    setLoadingInsights(true);
    try {
      const data = (await getAdminInsights({
        days: insightDays,
        limit: eventsPageSize,
        page: eventsPage,
        ...(insightFilter ? { operationType: insightFilter } : {}),
      })) as InsightsData | null;
      if (!data) {
        setInsights(null);
        return;
      }
      setInsights({
        created: data.created ?? 0,
        updated: data.updated ?? 0,
        deleted: data.deleted ?? 0,
        total: data.total ?? 0,
        totalFiltered: data.totalFiltered ?? 0,
        events: data.events ?? [],
      });
    } catch (err) {
      toast({
        title: "Erro ao carregar insights",
        variant: "error",
      });
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin" && insightDays) {
      loadInsights();
    }
  }, [user?.role, insightDays, eventsPage, eventsPageSize, insightFilter]);

  const applyInsightDays = () => {
    const n = Math.min(365, Math.max(1, Number(insightDaysInput) || 30));
    setInsightDaysInput(String(n));
    setInsightDays(n);
    setEventsPage(1);
  };

  const goToPage = (page: number) => {
    setEventsPage(Math.max(1, page));
  };

  const totalFiltered = insights?.totalFiltered ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFiltered / eventsPageSize),
  );
  const from = totalFiltered === 0 ? 0 : (eventsPage - 1) * eventsPageSize + 1;
  const to = Math.min(eventsPage * eventsPageSize, totalFiltered);

  const openEdit = (u: AdminUser) => {
    setEditModal(u);
    setFormEdit({
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      login: u.login,
      password: "",
      role: u.role,
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await updateAdminUser(editModal.id, {
        firstName: formEdit.firstName,
        lastName: formEdit.lastName,
        login: formEdit.login,
        ...(formEdit.password ? { password: formEdit.password } : {}),
        role: formEdit.role,
      });
      toast({ title: "Usuário atualizado", variant: "success" });
      setEditModal(null);
      loadUsers();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao atualizar",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      toast({ title: "Usuário removido", variant: "success" });
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao remover",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!formAdd.login || !formAdd.password) {
      toast({ title: "Login e senha obrigatórios", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await register(
        formAdd.login,
        formAdd.password,
        formAdd.firstName,
        formAdd.lastName,
      );
      toast({ title: "Usuário criado", variant: "success" });
      setAddModal(false);
      setFormAdd({ login: "", password: "", firstName: "", lastName: "" });
      loadUsers();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao criar usuário",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <Layout title="Painel administrativo">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="insights">Auditoria / Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Usuários do sistema</CardTitle>
              <Button onClick={() => setAddModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar usuário
              </Button>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Login</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Sobrenome</TableHead>
                      <TableHead>Privilégio</TableHead>
                      <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.login}</TableCell>
                        <TableCell>{u.firstName ?? "-"}</TableCell>
                        <TableCell>{u.lastName ?? "-"}</TableCell>
                        <TableCell>
                          <span
                            className={
                              u.role === "admin"
                                ? "text-amber-600 font-medium"
                                : ""
                            }
                          >
                            {u.role === "admin" ? "Administrador" : "Usuário"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(u)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(u)}
                              disabled={u.id === user?.id}
                              aria-label="Remover"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <CardTitle>Auditoria e insights</CardTitle>
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
                <Button type="button" variant="secondary" size="sm" onClick={applyInsightDays}>
                  Aplicar
                </Button>
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
                        setInsightFilter((f) => (f === "create" ? null : "create"));
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
                        setInsightFilter((f) => (f === "update" ? null : "update"));
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
                        setInsightFilter((f) => (f === "delete" ? null : "delete"));
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
                      <Label htmlFor="page-size" className="text-sm whitespace-nowrap">
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
                  <div className="border rounded-md overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Rota</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {insights.events.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
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
                              <TableCell>{e.operation_type}</TableCell>
                              <TableCell>{e.resource ?? "-"}</TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate">
                                {e.path}
                              </TableCell>
                              <TableCell>{e.status_code}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {totalFiltered > 0 && (
                    <div className="flex items-center justify-between gap-4 mt-3">
                      <p className="text-sm text-muted-foreground">
                        {from}–{to} de {totalFiltered} eventos
                      </p>
                      <div className="flex items-center gap-1">
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
        </TabsContent>
      </Tabs>

      {/* Edit user modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Login</Label>
              <Input
                value={formEdit.login}
                onChange={(e) =>
                  setFormEdit((p) => ({ ...p, login: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input
                  value={formEdit.firstName}
                  onChange={(e) =>
                    setFormEdit((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Sobrenome</Label>
                <Input
                  value={formEdit.lastName}
                  onChange={(e) =>
                    setFormEdit((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nova senha (deixe em branco para manter)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formEdit.password}
                onChange={(e) =>
                  setFormEdit((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Privilégio</Label>
              <Select
                value={formEdit.role}
                onValueChange={(v: "admin" | "user") =>
                  setFormEdit((p) => ({ ...p, role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add user modal */}
      <Dialog open={addModal} onOpenChange={setAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Login *</Label>
              <Input
                value={formAdd.login}
                onChange={(e) =>
                  setFormAdd((p) => ({ ...p, login: e.target.value }))
                }
                placeholder="ex: usuario@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={formAdd.password}
                onChange={(e) =>
                  setFormAdd((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input
                  value={formAdd.firstName}
                  onChange={(e) =>
                    setFormAdd((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Sobrenome</Label>
                <Input
                  value={formAdd.lastName}
                  onChange={(e) =>
                    setFormAdd((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser} disabled={saving}>
              {saving ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover o usuário{" "}
            <strong>{deleteTarget?.login}</strong>? Esta ação não pode ser
            desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
