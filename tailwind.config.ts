import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./client/**/*.{ts,tsx}"],
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
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        elevated: "var(--shadow-soft)",
        "brand-glow": "0 8px 32px -8px hsl(191 55% 38% / 0.28)",
      },
      backgroundImage: {
        "brand-hero":
          "linear-gradient(160deg, hsl(214 38% 94%) 0%, hsl(210 40% 97%) 45%, hsl(205 42% 96%) 100%)",
        "brand-strip":
          "linear-gradient(135deg, hsl(222 48% 24%) 0%, hsl(210 48% 40%) 45%, hsl(191 78% 48%) 100%)",
        "brand-mesh":
          "radial-gradient(ellipse 120% 80% at 100% -20%, hsl(205 50% 88% / 0.55), transparent 50%), radial-gradient(ellipse 100% 60% at 0% 100%, hsl(215 45% 86% / 0.4), transparent 45%), hsl(210 42% 98%)",
      },
      colors: {
        sky: {
          50: "hsl(210 45% 97%)",
          100: "hsl(214 38% 93%)",
          200: "hsl(213 32% 86%)",
          300: "hsl(215 30% 76%)",
          400: "hsl(210 38% 58%)",
          500: "hsl(208 42% 46%)",
          600: "hsl(215 52% 38%)",
          700: "hsl(220 48% 30%)",
          800: "hsl(222 42% 24%)",
          900: "hsl(224 38% 16%)",
          950: "hsl(226 42% 10%)",
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
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
          7: "hsl(var(--chart-7))",
          8: "hsl(var(--chart-8))",
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
  plugins: [tailwindcssAnimate],
} satisfies Config;
