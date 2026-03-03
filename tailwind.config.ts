import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F4B400",
        lightBg: "#F9FAFB",
        lightText: "#111111",
        darkBg: "#0E0E0E",
        darkText: "#F5F5F5",
        bgPrimary: "var(--bg-primary)",
        bgSecondary: "var(--bg-secondary)",
        accent: "var(--accent)",
        textColor: "var(--text)",
      },
    },
  },
  plugins: [],
};

export default config;
