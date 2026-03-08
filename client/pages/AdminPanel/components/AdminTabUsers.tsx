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
import { Pencil, Trash2, UserPlus } from "lucide-react";
import type { AdminUser } from "../types";

interface AdminTabUsersProps {
  users: AdminUser[];
  loadingUsers: boolean;
  currentUserId?: number | null;
  openEdit: (u: AdminUser) => void;
  openCreate: () => void;
  setDeleteTarget: (u: AdminUser | null) => void;
}

export function AdminTabUsers({
  users,
  loadingUsers,
  currentUserId,
  openEdit,
  openCreate,
  setDeleteTarget,
}: AdminTabUsersProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Usuários do sistema</CardTitle>
            <p className="text-sm text-muted-foreground">
              Crie, edite e remova usuários. Defina privilégio e permissões.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loadingUsers ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
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
                          u.role === "admin" ? "text-amber-600 font-medium" : ""
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
        )}
      </CardContent>
    </Card>
  );
}
