import { redirect } from "next/navigation";

/** Auditoria consolidada no painel administrativo (separador «Auditoria»). */
export default function AuditRedirectPage() {
  redirect("/admin");
}
