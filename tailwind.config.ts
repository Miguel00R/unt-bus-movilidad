import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        unt: {
          blue: "#002B66",
          dark: "#081b33",
          navy: "#0f2038",
          gold: "#D4AF37",
          amber: "#F59E0B",
          accent: "#2563EB",
          light: "#F0F4F8"
        }
      },
      animation: {
        "pulse-quick": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-short": "bounce 0.6s ease-in-out 1",
      }
    },
  },
  plugins: [],
};
export default config;
