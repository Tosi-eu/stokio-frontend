"use client";

import { BarChart3, Package, ShieldCheck } from "lucide-react";
import { APP_PUBLIC_NAME } from "@/constants/app-branding";
import { AuthBrandLogoImage } from "@/components/auth/AuthBrandLogoImage";

type AuthMarketingAsideProps = {
  logoSrc: string;
  onLogoFallback: () => void;
};

export function AuthMarketingAside({
  logoSrc,
  onLogoFallback,
}: AuthMarketingAsideProps) {
  return (
    <aside className="relative hidden h-full min-h-0 max-h-full shrink-0 overflow-hidden lg:flex lg:w-[min(42%,480px)] lg:flex-col lg:items-center lg:justify-center lg:self-stretch bg-brand-strip px-10 py-12 text-primary-foreground xl:px-14">
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="flex w-full justify-center px-2">
          <div className="inline-flex max-w-full items-center justify-center rounded-2xl bg-white/12 p-4 ring-1 ring-white/25 backdrop-blur-sm xl:p-5">
            <AuthBrandLogoImage
              src={logoSrc}
              alt=""
              width={460}
              height={200}
              priority={false}
              onFallback={onLogoFallback}
              className="mx-auto block h-44 w-auto max-w-[min(100%,460px)] object-contain object-center xl:h-52 xl:max-w-[min(100%,500px)] 2xl:h-56"
            />
          </div>
        </div>

        <div className="mt-8 space-y-3 px-1">
          <p className="font-display text-2xl font-semibold leading-tight tracking-tight xl:text-3xl">
            Estoque do abrigo, simples e organizado.
          </p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-primary-foreground/85">
            Menos planilhas. Mais controle.
          </p>
        </div>

        <ul className="mt-8 flex w-full flex-col items-center gap-5 text-sm text-primary-foreground/90">
          <li className="flex max-w-xs flex-col items-center gap-2 sm:max-w-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Package className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-center font-medium text-white">
              Entradas e saídas
            </span>
          </li>
          <li className="flex max-w-xs flex-col items-center gap-2 sm:max-w-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-center font-medium text-white">
              Acesso por perfil
            </span>
          </li>
          <li className="flex max-w-xs flex-col items-center gap-2 sm:max-w-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <BarChart3 className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-center font-medium text-white">
              Relatórios em segundos
            </span>
          </li>
        </ul>

        <p className="mt-10 max-w-sm px-2 text-xs leading-snug text-primary-foreground/65">
          © {new Date().getFullYear()} {APP_PUBLIC_NAME}
        </p>
      </div>
    </aside>
  );
}
