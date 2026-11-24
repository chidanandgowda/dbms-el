import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        ink: {
          900: "#0F172A",
          600: "#475569",
          400: "#94A3B8",
        },
        cobalt: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
        },
        semantic: {
          accepted: {
            bg: "#ECFDF5",
            text: "#047857",
            border: "#A7F3D0",
          },
          pending: {
            bg: "#FFFBEB",
            text: "#B45309",
            border: "#FDE68A",
          },
          rejected: {
            bg: "#FEF2F2",
            text: "#B91C1C",
            border: "#FECACA",
          },
          blind: {
            bg: "#EEF2FF",
            text: "#4338CA",
            border: "#C7D2FE",
          },
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        editorial: ["'Newsreader'", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["'JetBrains Mono'", "Consolas", "Monaco", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
