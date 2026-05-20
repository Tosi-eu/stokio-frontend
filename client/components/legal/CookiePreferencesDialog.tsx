"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCookieConsent } from "@/context/cookie-consent-context";

function privacyPolicyHref(): string {
  const external = process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL?.trim();
  if (external) return external;
  return "/privacidade";
}

export function CookiePreferencesDialog() {
  const { preferencesOpen, closePreferences, saveChoice, consent } =
    useCookieConsent();
  const [functional, setFunctional] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (preferencesOpen) {
      setFunctional(consent?.functional ?? false);
      setAnalytics(consent?.analytics ?? false);
    }
  }, [preferencesOpen, consent]);

  return (
    <Dialog
      open={preferencesOpen}
      onOpenChange={(open) => {
        if (!open) closePreferences();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preferências de cookies</DialogTitle>
          <DialogDescription>
            Escolha quais categorias autoriza. Os cookies necessários mantêm a
            sessão segura e não podem ser desativados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3 bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Necessários</Label>
              <p className="text-xs text-muted-foreground">
                Autenticação, segurança e funcionamento básico da aplicação.
              </p>
            </div>
            <Switch checked disabled aria-readonly />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-1">
              <Label
                htmlFor="cookie-functional"
                className="text-sm font-medium"
              >
                Funcionais
              </Label>
              <p className="text-xs text-muted-foreground">
                Abrigo ativo, layout do painel, barra lateral e preferências de
                interface.
              </p>
            </div>
            <Switch
              id="cookie-functional"
              checked={functional}
              onCheckedChange={setFunctional}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-1">
              <Label htmlFor="cookie-analytics" className="text-sm font-medium">
                Analíticos
              </Label>
              <p className="text-xs text-muted-foreground">
                Relatórios anónimos de erros para melhorar a estabilidade do
                produto.
              </p>
            </div>
            <Switch
              id="cookie-analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          <Link
            href={privacyPolicyHref()}
            className="underline underline-offset-2 hover:text-foreground"
            target={
              privacyPolicyHref().startsWith("http") ? "_blank" : undefined
            }
            rel={
              privacyPolicyHref().startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
          >
            Política de privacidade
          </Link>
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full"
            onClick={() => saveChoice({ functional: true, analytics: true })}
          >
            Aceitar todos
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => saveChoice("reject_optional")}
          >
            Recusar opcionais
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => saveChoice({ functional, analytics })}
          >
            Guardar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
