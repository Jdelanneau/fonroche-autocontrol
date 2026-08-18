import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: "#14181C",
        "night-2": "#191E23",
        panel: "#1E252B",
        "panel-2": "#262E35",
        "panel-3": "#2E3740",
        line: "#333C44",
        "line-soft": "#262E35",
        text: "#F4F6F7",
        "text-dim": "#9FAAB2",
        "text-faint": "#6B767D",
        sun1: "#FFB238",
        sun2: "#FF7A3D",
        teal: "#22C7A9",
        "teal-dim": "#1A9C86",
        ok: "#3FCB72",
        danger: "#FF5C5C",
        paper: "#F3EFE6",
        ink: "#1C2126"
      },
      fontFamily: {
        display: ["var(--font-barlow)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        sun: "linear-gradient(135deg, #FFB238, #FF7A3D)",
        tealgrad: "linear-gradient(135deg, #22C7A9, #1A9C86)"
      }
    }
  },
  plugins: []
};

export default config;
