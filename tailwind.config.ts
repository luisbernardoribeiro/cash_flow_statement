import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#F2F1F9",
          100: "#DEDCEF",
          200: "#B9B6DE",
          300: "#8F8CC8",
          400: "#5856A8",
          500: "#4341A8",
          600: "#2E2C7E",
          700: "#252369",
          800: "#1F1D5A",
          900: "#15143F",
        },
        gold: {
          500: "#C8A951",
          600: "#A88B3A",
        },
        success: { DEFAULT: "#2E7D32", bg: "#E8F5E9" },
        danger:  { DEFAULT: "#C62828", bg: "#FFEBEE" },
        warning: { DEFAULT: "#F9A825", bg: "#FFF8E1" },
        info:    { DEFAULT: "#0288D1", bg: "#E1F5FE" },
        ink:     "#1A1A2E",
      },
      fontFamily: {
        display: ["Inter", "Helvetica Neue", "system-ui", "sans-serif"],
        body:    ["Inter", "Helvetica Neue", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "SF Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "6px", md: "10px", lg: "14px", xl: "20px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(46, 44, 126, 0.05)",
        md: "0 4px 12px rgba(46, 44, 126, 0.08)",
        lg: "0 10px 30px rgba(46, 44, 126, 0.12)",
        xl: "0 20px 50px rgba(46, 44, 126, 0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
