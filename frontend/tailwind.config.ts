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
        navy: {
          DEFAULT: "#1A2B5E",
          light:   "#2D3E7A",
          muted:   "#6474A8",
          subtle:  "rgba(26, 43, 94, 0.08)",
          border:  "rgba(26, 43, 94, 0.14)",
        },
        ivory: {
          50:  "#FFFDF9",
          100: "#FAF4EE",
          200: "#F2E9DC",
          300: "#E4D4C0",
          400: "#CEB99A",
        },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        sans:    ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card:  "0 2px 12px rgba(26, 43, 94, 0.07), 0 1px 3px rgba(26, 43, 94, 0.05)",
        lift:  "0 6px 24px rgba(26, 43, 94, 0.12), 0 2px 6px rgba(26, 43, 94, 0.07)",
        inner: "inset 0 2px 6px rgba(26, 43, 94, 0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.22s ease-out",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
