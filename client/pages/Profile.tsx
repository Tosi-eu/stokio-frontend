import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast.hook";
import Layout from "@/components/Layout";
import { getCurrentUser, updateUser } from "@/api/requests";
import { profileSchema, type ProfileFormData } from "@/schemas/profile.schema";
import type { UpdateUserPayload } from "@/interfaces/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { VALIDATION_LIMITS } from "@/constants/app.constants";
import { authStorage } from "@/helpers/auth.helper";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";

export default function Profile() {
  const router = useRouter();
  const { toast } = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      currentLogin: "",
      currentPassword: "",
      login: "",
      password: "",
    },
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getCurrentUser();
        const firstName = data.firstName ?? data.first_name ?? "";
        const lastName = data.lastName ?? data.last_name ?? "";
        const login = data.login ?? "";

        reset({
          firstName,
          lastName,
          currentLogin: login,
          currentPassword: "",
          login,
          password: "",
        });
      } catch (error) {
        console.error("Erro ao carregar usuário logado", error);
      }
    };

    loadUser();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const payload: UpdateUserPayload = {
        currentPassword: data.currentPassword,
      };

      if (data.firstName) payload.firstName = data.firstName;
      if (data.lastName) payload.lastName = data.lastName;

      if (data.login && data.login !== data.currentLogin) {
        payload.login = data.login.trim();
      }

      if (data.password) {
        payload.password = data.password;
      }

      await updateUser(payload);

      const user = await getCurrentUser();
      const firstName = user.firstName ?? user.first_name ?? "";
      const lastName = user.lastName ?? user.last_name ?? "";
      const login = user.login ?? "";

      reset({
        firstName,
        lastName,
        currentLogin: login,
        currentPassword: "",
        login,
        password: "",
      });

      toast({
        title: "Perfil atualizado",
        variant: "success",
        duration: 3000,
      });
    } catch (err: unknown) {
      toast({
        title: "Não foi possível atualizar o perfil",
        description: getErrorMessage(
          err,
          USER_FACING_RETRY_SHORT,
          "Profile:update",
        ),
        variant: "error",
        duration: 3000,
      });
    }
  };

  const handleLogout = () => {
    authStorage.clearAll();
    router.push("/user/login");
  };

  return (
    <Layout title="Meu Perfil">
      <div className="flex justify-center py-24 px-4">
        <Card className="w-full max-w-md shadow-lg border border-slate-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold">
              Editar Perfil
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    disabled={isSubmitting}
                    aria-invalid={errors.firstName ? "true" : "false"}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    disabled={isSubmitting}
                    aria-invalid={errors.lastName ? "true" : "false"}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currentLogin">E-mail atual</Label>
                  <Input
                    id="currentLogin"
                    type="email"
                    {...register("currentLogin")}
                    maxLength={VALIDATION_LIMITS.EMAIL_MAX_LENGTH}
                    disabled={isSubmitting}
                    aria-invalid={errors.currentLogin ? "true" : "false"}
                  />
                  {errors.currentLogin && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.currentLogin.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...register("currentPassword")}
                    maxLength={VALIDATION_LIMITS.PASSWORD_MAX_LENGTH}
                    disabled={isSubmitting}
                    aria-invalid={errors.currentPassword ? "true" : "false"}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="login">Novo e-mail</Label>
                  <Input
                    id="login"
                    type="email"
                    {...register("login")}
                    maxLength={255}
                    disabled={isSubmitting}
                    aria-invalid={errors.login ? "true" : "false"}
                  />
                  {errors.login && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.login.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    maxLength={128}
                    disabled={isSubmitting}
                    className={
                      errors.password
                        ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                        : ""
                    }
                    aria-invalid={errors.password ? "true" : "false"}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <CardFooter className="flex gap-2 px-0">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>

        <LogoutConfirmDialog
          open={logoutOpen}
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false);
            handleLogout();
          }}
        />
      </div>

      <div className="text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {APP_PUBLIC_NAME}
      </div>
    </Layout>
  );
}
