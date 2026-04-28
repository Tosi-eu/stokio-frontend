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
import type { AdminUser } from "../types";
import { defaultEffectiveMatrixFromFlat } from "@/helpers/permission-matrix.helpers";
import { PermissionMatrixFields } from "./PermissionMatrixFields";

const defaultFlat = {
  read: true,
  create: false,
  update: false,
  delete: false,
} as const;

export type AdminUserEditForm = {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  role: "admin" | "user";
  permissionMatrix: EffectivePermissionMatrixSerialized;
};

interface AdminUserEditDialogProps {
  user: AdminUser | null;
  form: AdminUserEditForm;
  setForm: React.Dispatch<React.SetStateAction<AdminUserEditForm>>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AdminUserEditDialog({
  user,
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: AdminUserEditDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input
              value={form.login}
              onChange={(e) =>
                setForm((p) => ({ ...p, login: e.target.value }))
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
            <Label>Nova senha (deixe em branco para manter)</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
            />
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
                    v === "user"
                      ? defaultEffectiveMatrixFromFlat({ ...defaultFlat })
                      : p.permissionMatrix,
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
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
