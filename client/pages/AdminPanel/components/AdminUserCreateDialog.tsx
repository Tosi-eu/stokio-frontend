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
import type { EffectivePermissionMatrixSerialized } from "@/domain/permission-matrix.types";
import { defaultEffectiveMatrixFromFlat } from "@/helpers/permission-matrix.helpers";
import { PermissionMatrixFields } from "./PermissionMatrixFields";

const defaultFlat = {
  read: true,
  create: false,
  update: false,
  delete: false,
} as const;

export interface CreateUserForm {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  role: "admin" | "user";
  permissionMatrix: EffectivePermissionMatrixSerialized;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                  permissionMatrix:
                    v === "admin"
                      ? p.permissionMatrix
                      : defaultEffectiveMatrixFromFlat({ ...defaultFlat }),
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
          {form.role === "user" ? (
            <div className="grid gap-3 border-t pt-4">
              <Label>Permissões por recurso</Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ajuste leitura e operações por módulo. A matriz é guardada em
                formato versão 2 no servidor.
              </p>
              <PermissionMatrixFields
                value={form.permissionMatrix}
                onChange={(permissionMatrix) =>
                  setForm((p) => ({ ...p, permissionMatrix }))
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground border-t pt-4">
              Administradores têm acesso total a todos os recursos e tipos de
              movimentação.
            </p>
          )}
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
  permissionMatrix: defaultEffectiveMatrixFromFlat({ ...defaultFlat }),
};
