import { Inter, Plus_Jakarta_Sans } from "next/font/google";

/** Texto de interface — otimizado pelo Next (subset, swap, sem @import bloqueante). */
export const fontSans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

/** Títulos — alinhado ao wordmark do logo. */
export const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});
