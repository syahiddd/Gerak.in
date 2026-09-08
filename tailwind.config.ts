import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0E0E10",
        surface: "#1A1A1F",
        surfaceAlt: "#24242B",
        border: "#2A2A33",
        primary: "#FFFFFF",
        secondary: "#A1A1AA",
        muted: "#6B6B75",
        accent: "#39FF14",
        accentAlt: "#00C2FF",
        danger: "#FF4D6D",
      },
      borderRadius: {
        md: "12px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
