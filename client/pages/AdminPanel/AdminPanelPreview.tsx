"use client";

import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Users,
  LogIn,
  Cog,
  Bell,
  Edit,
} from "lucide-react";
import { PREVIEW_ADMIN_SUMMARY_CARDS } from "@/helpers/preview-mock-data";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminPanelPreview() {
  return (
    <Layout title="Painel administrativo (visualização)">
      <div
        role="status"
        className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <span className="font-medium">Demonstração.</span> Os números abaixo são
        fictícios. Com a configuração concluída e perfil de administrador, verá
        os dados reais do abrigo.
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1 w-full p-1 h-auto flex-wrap">
          <TabsTrigger value="resumo" className="gap-1.5 text-xs sm:text-sm">
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="truncate">Resumo</span>
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-1.5 text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">Alertas</span>
          </TabsTrigger>
          <TabsTrigger
            value="relatorios"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="acessos" className="gap-1.5 text-xs sm:text-sm">
            <LogIn className="h-4 w-4 shrink-0" />
            <span className="truncate">Acessos</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 text-xs sm:text-sm">
            <Cog className="h-4 w-4 shrink-0" />
            <span className="truncate">Config</span>
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className="truncate">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-xs sm:text-sm">
            <Edit className="h-4 w-4 shrink-0" />
            <span className="truncate">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PREVIEW_ADMIN_SUMMARY_CARDS.map((c) => (
              <Card key={c.title}>
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>{c.hint}</CardDescription>
                  <p className="text-3xl font-bold tabular-nums pt-2">
                    {c.value}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {(
          [
            "alertas",
            "relatorios",
            "users",
            "acessos",
            "config",
            "notificacoes",
            "insights",
          ] as const
        ).map((key) => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Pré-visualização</CardTitle>
                <CardDescription>
                  Esta secção mostra dados reais após a configuração do abrigo e
                  com as permissões adequadas.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </Layout>
  );
}
