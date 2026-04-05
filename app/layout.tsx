import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/AppProviders";
import { fontDisplay, fontSans } from "./fonts";
import "../client/global.css";

export const metadata: Metadata = {
  title: {
    default: "Stokio",
    template: "%s · Stokio",
  },
  description:
    "Gestão inteligente de estoque, medicamentos e abrigos — operação clara e segura.",
  applicationName: "Stokio",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/default_logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1222" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fontSans.variable} ${fontDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
