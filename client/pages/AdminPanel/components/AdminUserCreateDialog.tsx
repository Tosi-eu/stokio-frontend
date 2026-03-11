import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { UserPermissions } from "../types";

const defaultPermissions: UserPermissions = {
  read: true,
  create: false,
  update: false,
  delete: false,
};

export interface CreateUserForm {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  role: "admin" | "user";
  permissions: UserPermissions;
}

interface AdminUserCreateDialogProps {
  open: boolean;
  form: CreateUserForm;
  setForm: React.Dispatch<React.SetStateAction<CreateUserForm>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AdminUserCreateDialog({
  open,
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: AdminUserCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>E-mail / Login</Label>
            <Input
              value={form.login}
              onChange={(e) =>
                setForm((p) => ({ ...p, login: e.target.value }))
              }
              placeholder="usuario@exemplo.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Sobrenome</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Privilégio</Label>
            <Select
              value={form.role}
              onValueChange={(v: "admin" | "user") =>
                setForm((p) => ({
                  ...p,
                  role: v,
                  permissions:
                    v === "admin"
                      ? {
                          read: true,
                          create: true,
                          update: true,
                          delete: true,
                        }
                      : p.permissions,
                }))
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
          <div className="grid gap-3 border-t pt-4">
            <Label>Permissões</Label>
            <p className="text-xs text-muted-foreground">
              Leitura é obrigatória. Marque as permissões de escrita para este
              usuário.
            </p>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-not-allowed opacity-70">
                <Checkbox checked disabled />
                <span className="text-sm">Leitura</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.permissions.create}
                  disabled={form.role === "admin"}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({
                      ...p,
                      permissions: {
                        ...p.permissions,
                        create: Boolean(checked),
                      },
                    }))
                  }
                />
                <span className="text-sm">Criar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.permissions.update}
                  disabled={form.role === "admin"}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({
                      ...p,
                      permissions: {
                        ...p.permissions,
                        update: Boolean(checked),
                      },
                    }))
                  }
                />
                <span className="text-sm">Editar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.permissions.delete}
                  disabled={form.role === "admin"}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({
                      ...p,
                      permissions: {
                        ...p.permissions,
                        delete: Boolean(checked),
                      },
                    }))
                  }
                />
                <span className="text-sm">Remover</span>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={
              saving ||
              !form.login.trim() ||
              !form.password ||
              form.password.length < 8
            }
          >
            {saving ? "Criando..." : "Criar usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const defaultCreateUserForm: CreateUserForm = {
  firstName: "",
  lastName: "",
  login: "",
  password: "",
  role: "user",
  permissions: { ...defaultPermissions },
};
