"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast.hook";
import { submitPublicContact } from "@/api/requests";
import { cn } from "@/lib/utils";
import { pageSurfaceCardClass } from "@/components/page/page-ui.constants";

export type ContactFormSectionProps = { variant?: "standalone" | "embedded" };

export function ContactFormSection({
  variant = "standalone",
}: ContactFormSectionProps) {
  const embedded = variant === "embedded";
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await submitPublicContact({ name, email, message });
      toast({
        title: "Mensagem enviada",
        description: "Obrigado. Responderemos para o e-mail que indicou.",
        variant: "success",
        duration: 5000,
      });
      setMessage("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Não foi possível enviar agora.";
      toast({
        title: "Erro ao enviar",
        description: msg,
        variant: "error",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={cn(pageSurfaceCardClass, "bg-card/95 backdrop-blur-sm")}>
      {!embedded && (
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-2xl">Contacto</CardTitle>
          <CardDescription>
            Envie-nos uma mensagem. Responderemos para o e-mail que indicar.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(embedded && "pt-1")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden
          />
          <div className="space-y-2">
            <Label htmlFor="contact-name">Nome</Label>
            <Input
              id="contact-name"
              name="name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">E-mail</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Mensagem</Label>
            <Textarea
              id="contact-message"
              name="message"
              required
              minLength={10}
              maxLength={8000}
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a sua mensagem…"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A enviar…" : "Enviar mensagem"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
