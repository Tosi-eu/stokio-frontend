import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: [
          '"Plus Jakarta Sans"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        elevated: "var(--shadow-soft)",
        "brand-glow": "0 8px 32px -8px hsl(174 45% 35% / 0.25)",
      },
      backgroundImage: {
        "brand-hero":
          "linear-gradient(160deg, hsl(168 38% 94%) 0%, hsl(165 35% 97%) 40%, hsl(88 35% 95%) 100%)",
        "brand-strip":
          "linear-gradient(135deg, hsl(180 55% 28%) 0%, hsl(165 50% 38%) 45%, hsl(88 48% 58%) 100%)",
        "brand-mesh":
          "radial-gradient(ellipse 120% 80% at 100% -20%, hsl(88 45% 88% / 0.5), transparent 50%), radial-gradient(ellipse 100% 60% at 0% 100%, hsl(180 40% 85% / 0.35), transparent 45%), hsl(165 35% 98%)",
      },
      colors: {
        /** Paleta teal–hortelã (substitui o azul “sky” legado em todo o app) */
        sky: {
          50: "hsl(165 42% 97%)",
          100: "hsl(165 35% 93%)",
          200: "hsl(168 32% 86%)",
          300: "hsl(170 30% 76%)",
          400: "hsl(172 35% 58%)",
          500: "hsl(174 42% 44%)",
          600: "hsl(174 58% 36%)",
          700: "hsl(176 52% 30%)",
          800: "hsl(178 45% 24%)",
          900: "hsl(182 40% 18%)",
          950: "hsl(186 45% 11%)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        purple: {
          DEFAULT: "#6750A4",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#6750A4",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        gray: {
          50: "#F7F7F7",
          100: "#F5F5F5",
          200: "#E9E9E9",
          300: "#D4CDCD",
          400: "#AAA",
          500: "#777",
          600: "#484848",
          700: "#333",
          800: "#1D1B20",
          900: "#111",
        },
        warning: {
          DEFAULT: "#FFF3CC",
          foreground: "#000",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Tailwind plugin convention
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
