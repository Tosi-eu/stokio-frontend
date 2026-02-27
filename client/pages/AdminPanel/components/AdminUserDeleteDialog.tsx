import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "../types";

interface AdminUserDeleteDialogProps {
  user: AdminUser | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminUserDeleteDialog({
  user,
  saving,
  onClose,
  onConfirm,
}: AdminUserDeleteDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover usuário</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja remover o usuário <strong>{user.login}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={saving}>
            {saving ? "Removendo..." : "Remover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
