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
        cream: {
          50:  "#FFFCF5",
          100: "#FDF6E8",
          200: "#F5ECD7",
          300: "#EAD9BC",
          400: "#D4B896",
        },
        brown: {
          900: "#3D2B1F",
          800: "#4A3728",
          700: "#5C4033",
          600: "#7A5A45",
          500: "#9B8878",
          400: "#B8A48A",
          300: "#D4C4B0",
          200: "#E8DDD4",
          100: "#F5EFE8",
        },
        washi: {
          pink:   "#F4B8C1",
          blue:   "#9CCEE0",
          yellow: "#F5D67E",
          green:  "#A8C8A0",
          purple: "#C4A8D4",
          peach:  "#F0A882",
          mint:   "#9ED8C8",
          red:    "#D47878",
        },
      },
      fontFamily: {
        hand: ["var(--font-caveat)", "Caveat", "cursive"],
        sans: ["var(--font-nunito)", "Nunito", "system-ui", "sans-serif"],
      },
      boxShadow: {
        polaroid: "2px 4px 14px rgba(74,55,40,0.18), 0 1px 3px rgba(74,55,40,0.10)",
        "polaroid-hover": "5px 10px 24px rgba(74,55,40,0.22), 0 2px 6px rgba(74,55,40,0.14)",
        card: "0 2px 8px rgba(74,55,40,0.08), 0 1px 2px rgba(74,55,40,0.05)",
      },
      animation: {
        "fade-up": "fadeUp 0.25s ease-out",
        "wiggle":  "wiggle 0.4s ease-in-out",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%":      { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
