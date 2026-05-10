import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sessão",
  description:
    "Entre na sua conta Stokio com e-mail e senha para gerir o estoque do seu abrigo.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
