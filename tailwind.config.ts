import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: {
          DEFAULT: "#14141f",
          light: "#1e1e2f",
          dark: "#0d0d15",
          border: "#232338",
        },
        primary: {
          DEFAULT: "#16A085",
          hover: "#1abc9c",
          dark: "#117a65",
          glow: "rgba(22, 160, 133, 0.4)",
        },
        accent: {
          DEFAULT: "#1abc9c",
          purple: "#8b5cf6",
          red: "#ef4444",
          amber: "#f59e0b",
        },
        text: {
          primary: "#ffffff",
          secondary: "#9ca3af",
          muted: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-poppins)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(22, 160, 133, 0.4)",
        "glow-lg": "0 0 35px -5px rgba(22, 160, 133, 0.6)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.7)",
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fadeIn: "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
