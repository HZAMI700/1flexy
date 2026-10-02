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
        background: "#000000",
        surface: {
          DEFAULT: "#141414",
          light: "#1F1F1F",
          dark: "#000000",
          modal: "#181818",
          border: "#282828",
        },
        primary: {
          DEFAULT: "#E50914",
          hover: "#F40612",
          dark: "#B20710",
          glow: "rgba(229, 9, 20, 0.5)",
        },
        accent: {
          DEFAULT: "#E50914",
          green: "#46D369",
          red: "#E50914",
          blue: "#0080ff",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          muted: "#808080",
        },
      },
      fontFamily: {
        sans: [
          "Netflix Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Netflix Sans",
          '"Bebas Neue"',
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(229, 9, 20, 0.5)",
        netflix: "0 10px 30px rgba(0, 0, 0, 0.8)",
        modal: "0 20px 50px rgba(0, 0, 0, 0.9)",
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fadeIn: "fadeIn 0.3s ease-in-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
