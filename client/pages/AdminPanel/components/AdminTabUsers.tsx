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
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import type { AdminUser } from "../types";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast.hook";
import { createTenantInvite } from "@/api/requests";
import { useState } from "react";

interface AdminTabUsersProps {
  users: AdminUser[];
  loadingUsers: boolean;
  currentUserId?: number | null;
  openEdit: (u: AdminUser) => void;
  openCreate: () => void;
  setDeleteTarget: (u: AdminUser | null) => void;
  page: number;
  setPage: (v: number | ((p: number) => number)) => void;
  limit: number;
  setLimit: (v: number) => void;
  total: number;
}

export function AdminTabUsers({
  users,
  loadingUsers,
  currentUserId,
  openEdit,
  openCreate,
  setDeleteTarget,
  page,
  setPage,
  limit,
  setLimit,
  total,
}: AdminTabUsersProps) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `${label} copiado`,
        duration: 2000,
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente do campo exibido.",
        variant: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Usuários do sistema</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gerencie usuários e convites. O convite usa só e-mail e função;
              permissões detalhadas depois de o utilizador aceitar (editar
              utilizador).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-2 py-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Convidar por e-mail"
                className="h-9 w-[220px]"
                type="email"
              />
              <Select
                value={inviteRole}
                onValueChange={(v) =>
                  setInviteRole(v === "admin" ? "admin" : "user")
                }
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="gap-2"
                disabled={sendingInvite || !inviteEmail.trim()}
                onClick={async () => {
                  const email = inviteEmail.trim();
                  if (!email || !email.includes("@")) {
                    toast({
                      title: "E-mail inválido",
                      variant: "error",
                      duration: 2500,
                    });
                    return;
                  }
                  setSendingInvite(true);
                  try {
                    const res = await createTenantInvite({
                      email,
                      role: inviteRole,
                      expires_in_days: 7,
                    });
                    if ("emailSent" in res && res.emailSent === false) {
                      setLastInviteToken(res.token || null);
                      setLastInviteLink(res.link || null);
                      toast({
                        title: "Convite gerado",
                        description:
                          "SMTP não configurado. Copie o link (ou token) abaixo.",
                        duration: 4500,
                      });
                    } else {
                      setLastInviteToken(null);
                      setLastInviteLink(null);
                      toast({
                        title: "Convite enviado",
                        duration: 2500,
                      });
                    }
                    setInviteEmail("");
                  } catch (e) {
                    toast({
                      title: "Falha ao convidar",
                      description: e instanceof Error ? e.message : String(e),
                      variant: "error",
                      duration: 3500,
                    });
                  } finally {
                    setSendingInvite(false);
                  }
                }}
              >
                Convidar
              </Button>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo usuário
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lastInviteToken || lastInviteLink ? (
          <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                Convite gerado (copie e envie ao utilizador)
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLastInviteToken(null);
                  setLastInviteLink(null);
                }}
              >
                Limpar
              </Button>
            </div>
            {lastInviteLink ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Link</p>
                <div className="flex items-center gap-2">
                  <Input value={lastInviteLink} readOnly className="h-9" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copy(lastInviteLink, "Link")}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            ) : null}
            {lastInviteToken ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Token</p>
                <div className="flex items-center gap-2">
                  <Input value={lastInviteToken} readOnly className="h-9" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copy(lastInviteToken, "Token")}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Importante: use este token original (não o token_digest da
                  base).
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {loadingUsers ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2 mb-3">
              <span className="text-sm text-muted-foreground">
                Total: {total}
              </span>
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

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Sobrenome</TableHead>
                  <TableHead>Privilégio</TableHead>
                  <TableHead className="text-center">Leitura</TableHead>
                  <TableHead className="text-center">Criar</TableHead>
                  <TableHead className="text-center">Editar</TableHead>
                  <TableHead className="text-center">Remover</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const p = u.permissions ?? {
                    read: true,
                    create: false,
                    update: false,
                    delete: false,
                  };
                  const canRead = u.role === "admin" || p.read;
                  const canCreate = u.role === "admin" || p.create;
                  const canUpdate = u.role === "admin" || p.update;
                  const canDelete = u.role === "admin" || p.delete;
                  return (
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
                      <TableCell className="text-center text-muted-foreground">
                        {canRead ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {canCreate ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {canUpdate ? "Sim" : "Não"}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {canDelete ? "Sim" : "Não"}
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
                            disabled={u.id === currentUserId}
                            aria-label="Remover"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, Number(p) - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((p) => Math.min(totalPages, Number(p) + 1))
                }
              >
                Próxima
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
