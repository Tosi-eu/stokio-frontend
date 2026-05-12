import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast.hook";
import Layout from "@/components/Layout";
import { getCurrentUser, updateUser } from "@/api/requests";
import { profileSchema, type ProfileFormData } from "@/schemas/profile.schema";
import type { UpdateUserPayload } from "@/interfaces/types";
import { useAuth } from "@/hooks/use-auth.hook";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VALIDATION_LIMITS } from "@/constants/app.constants";
import {
  getErrorMessage,
  USER_FACING_RETRY_SHORT,
} from "@/helpers/validation.helper";
import {
  pageSurfaceCardClass,
  pageSectionInnerStackClass,
} from "@/components/page/page-ui.constants";
import { cn } from "@/lib/utils";
import { UserRound, Shield } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { patchStoredUser } = useAuth();
  const [initialLogin, setInitialLogin] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
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
      confirmPassword: "",
    },
  });

  const watchedNewPassword = useWatch({ control, name: "password" }) ?? "";

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await getCurrentUser();
        const firstName = data.firstName ?? data.first_name ?? "";
        const lastName = data.lastName ?? data.last_name ?? "";
        const login = data.login ?? "";

        setInitialLogin(login);
        reset({
          firstName,
          lastName,
          currentLogin: login,
          currentPassword: "",
          login: "",
          password: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Failed to load current user", error);
      }
    };

    void loadUser();
  }, [reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const payload: UpdateUserPayload = {
        currentPassword: data.currentPassword,
      };

      if (data.firstName) payload.firstName = data.firstName.trim();
      if (data.lastName) payload.lastName = data.lastName.trim();

      const newEmail = data.login?.trim() ?? "";
      if (
        newEmail &&
        newEmail.toLowerCase() !== data.currentLogin?.trim().toLowerCase()
      ) {
        payload.login = newEmail;
      }

      if (data.password?.trim()) {
        payload.password = data.password;
      }

      const updated = await updateUser(payload);

      patchStoredUser({
        login: updated.login,
        firstName: updated.firstName,
        lastName: updated.lastName,
        first_name: updated.firstName,
        last_name: updated.lastName,
      });

      setInitialLogin(updated.login);
      reset({
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        currentLogin: updated.login,
        currentPassword: "",
        login: "",
        password: "",
        confirmPassword: "",
      });

      toast({
        title: "Alterações guardadas",
        description: "A sua conta foi atualizada com sucesso.",
        variant: "success",
        duration: 4000,
      });
    } catch (err: unknown) {
      const raw = getErrorMessage(
        err,
        USER_FACING_RETRY_SHORT,
        "Profile:update",
      );
      const lower = raw.toLowerCase();
      const isWrongPassword =
        lower.includes("incorreta") ||
        lower.includes("401") ||
        lower.includes("credenciais");

      toast({
        title: isWrongPassword
          ? "Senha atual incorreta"
          : "Não foi possível guardar",
        description: isWrongPassword
          ? "Confirme a senha atual e tente novamente."
          : raw,
        variant: "error",
        duration: 5000,
      });
    }
  };

  const fieldClass = (hasError: boolean) =>
    cn(
      "h-11 rounded-xl border bg-background text-sm transition-colors",
      hasError
        ? "border-destructive/80 focus-visible:ring-destructive/25"
        : "border-input focus-visible:ring-ring/30",
    );

  return (
    <Layout
      title="Conta e perfil"
      description="Atualize o seu nome, o e-mail de acesso e a palavra-passe. A palavra-passe atual é sempre necessária para guardar."
      breadcrumb={[
        { label: "Início", path: "/loading" },
        { label: "Conta e perfil", path: "/user/profile" },
      ]}
    >
      <div className="mx-auto w-full max-w-2xl pb-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section className={cn(pageSurfaceCardClass, "p-6 sm:p-8")}>
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Dados pessoais
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Estes dados aparecem na sua sessão e nos registos do abrigo.
                </p>
              </div>
            </div>

            <div className={pageSectionInnerStackClass}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    disabled={isSubmitting}
                    className={fieldClass(!!errors.firstName)}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apelido</Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    disabled={isSubmitting}
                    className={fieldClass(!!errors.lastName)}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLogin">E-mail de acesso atual</Label>
                <Input
                  id="currentLogin"
                  type="email"
                  readOnly
                  {...register("currentLogin")}
                  className={cn(
                    fieldClass(false),
                    "bg-muted/40 cursor-default",
                  )}
                  aria-readonly="true"
                />
                <p className="text-xs text-muted-foreground">
                  Para alterar, use o campo abaixo. O e-mail tem de ser único no
                  sistema.
                </p>
              </div>
            </div>
          </section>

          <section className={cn(pageSurfaceCardClass, "p-6 sm:p-8")}>
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Segurança
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Palavra-passe atual obrigatória em qualquer alteração, como no
                  resto da aplicação.
                </p>
              </div>
            </div>

            <div className={pageSectionInnerStackClass}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Palavra-passe atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...register("currentPassword")}
                  maxLength={VALIDATION_LIMITS.PASSWORD_MAX_LENGTH}
                  disabled={isSubmitting}
                  className={fieldClass(!!errors.currentPassword)}
                  autoComplete="current-password"
                />
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <Separator className="my-2 bg-border/60" />

              <div className="space-y-2">
                <Label htmlFor="login">Novo e-mail (opcional)</Label>
                <Input
                  id="login"
                  type="email"
                  placeholder={initialLogin || "novo@email.com"}
                  {...register("login")}
                  maxLength={255}
                  disabled={isSubmitting}
                  className={fieldClass(!!errors.login)}
                  autoComplete="off"
                />
                {errors.login && (
                  <p className="text-xs text-destructive">
                    {errors.login.message}
                  </p>
                )}
              </div>

              <Separator className="my-2 bg-border/60" />

              <div className="space-y-2">
                <Label htmlFor="password">Nova palavra-passe (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  maxLength={128}
                  disabled={isSubmitting}
                  className={fieldClass(!!errors.password)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
                {watchedNewPassword &&
                  !errors.password &&
                  watchedNewPassword.length >= 8 && (
                    <p className="text-xs text-primary font-medium">
                      Requisitos da nova palavra-passe satisfeitos.
                    </p>
                  )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mínimo 8 caracteres, com maiúscula, minúscula, número e
                  símbolo.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar nova palavra-passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  maxLength={128}
                  disabled={isSubmitting}
                  className={fieldClass(!!errors.confirmPassword)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl sm:min-w-[140px]"
              disabled={isSubmitting}
              onClick={() => {
                void getCurrentUser().then((data) => {
                  const firstName = data.firstName ?? data.first_name ?? "";
                  const lastName = data.lastName ?? data.last_name ?? "";
                  const login = data.login ?? "";
                  setInitialLogin(login);
                  reset({
                    firstName,
                    lastName,
                    currentLogin: login,
                    currentPassword: "",
                    login: "",
                    password: "",
                    confirmPassword: "",
                  });
                });
              }}
            >
              Repor
            </Button>
            <Button
              type="submit"
              className="h-11 rounded-xl shadow-brand-glow sm:min-w-[180px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "A guardar…" : "Guardar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
