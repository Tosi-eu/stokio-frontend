import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Envie uma mensagem à equipa Stokio — respondemos por e-mail sobre o sistema ou o seu abrigo.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
