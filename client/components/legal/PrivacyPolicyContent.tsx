"use client";

import Link from "next/link";
import { ManageCookiesLink } from "@/components/legal/ManageCookiesLink";

type PrivacyPolicyContentProps = {
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function PrivacyPolicyContent({
  showBackLink = false,
  backHref = "/",
  backLabel = "Voltar ao início",
}: PrivacyPolicyContentProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Privacidade e cookies</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Utilizamos cookies necessários para a sessão e, com o seu
          consentimento, cookies funcionais e analíticos. Este resumo é
          informativo; recomenda-se revisão jurídica externa.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Categorias de cookies</h3>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>
            <strong className="text-foreground">Necessários</strong> — sessão de
            login (HttpOnly), segurança; sempre ativos.
          </li>
          <li>
            <strong className="text-foreground">Funcionais</strong> — abrigo
            ativo, layout, barra lateral e preferências de interface.
          </li>
          <li>
            <strong className="text-foreground">Analíticos</strong> — relatório
            anónimo de erros para melhorar o produto.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Como revogar</h3>
        <p className="text-sm text-muted-foreground">
          Pode alterar as preferências a qualquer momento através de{" "}
          <ManageCookiesLink className="inline text-foreground" />.
        </p>
      </section>

      {showBackLink ? (
        <p className="text-sm">
          <Link href={backHref} className="text-primary hover:underline">
            {backLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
