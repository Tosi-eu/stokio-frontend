import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast.hook";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/api/requests";
import type { AdminUser, UserPermissions } from "../types";
import type { CreateUserForm } from "../components/AdminUserCreateDialog";

const defaultPermissions: UserPermissions = {
  read: true,
  create: false,
  update: false,
  delete: false,
};

export function useAdminUsers(isAdmin: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editModal, setEditModal] = useState<AdminUser | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [formEdit, setFormEdit] = useState({
    firstName: "",
    lastName: "",
    login: "",
    password: "",
    role: "user" as "admin" | "user",
    permissions: defaultPermissions as UserPermissions,
  });
  const [formCreate, setFormCreate] = useState<CreateUserForm>({
    firstName: "",
    lastName: "",
    login: "",
    password: "",
    role: "user",
    permissions: { ...defaultPermissions },
  });
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Erro ao carregar usuários", variant: "error" });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  function openEdit(u: AdminUser) {
    setEditModal(u);
    const perms =
      u.role === "admin"
        ? { read: true, create: true, update: true, delete: true }
        : u.permissions
          ? { ...defaultPermissions, ...u.permissions }
          : defaultPermissions;
    setFormEdit({
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      login: u.login,
      password: "",
      role: u.role,
      permissions: perms,
    });
  }

  async function handleSaveEdit() {
    if (!editModal) return;
    setSaving(true);
    try {
      const permissionsToSend =
        formEdit.role === "admin"
          ? { read: true, create: true, update: true, delete: true }
          : formEdit.permissions;
      await updateAdminUser(editModal.id, {
        firstName: formEdit.firstName,
        lastName: formEdit.lastName,
        login: formEdit.login,
        ...(formEdit.password ? { password: formEdit.password } : {}),
        role: formEdit.role,
        permissions: permissionsToSend,
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
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const permissionsToSend =
        formCreate.role === "admin"
          ? { read: true, create: true, update: true, delete: true }
          : formCreate.permissions;
      await createAdminUser({
        login: formCreate.login.trim(),
        password: formCreate.password,
        firstName: formCreate.firstName.trim() || undefined,
        lastName: formCreate.lastName.trim() || undefined,
        role: formCreate.role,
        permissions: permissionsToSend,
      });
      toast({ title: "Usuário criado", variant: "success" });
      setCreateModalOpen(false);
      setFormCreate({
        firstName: "",
        lastName: "",
        login: "",
        password: "",
        role: "user",
        permissions: { ...defaultPermissions },
      });
      loadUsers();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Erro ao criar usuário",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
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
  }

  return {
    users,
    loadingUsers,
    loadUsers,
    editModal,
    setEditModal,
    createModalOpen,
    setCreateModalOpen,
    formCreate,
    setFormCreate,
    deleteTarget,
    setDeleteTarget,
    formEdit,
    setFormEdit,
    saving,
    openEdit,
    handleSaveEdit,
    handleCreate,
    handleDelete,
  };
}
