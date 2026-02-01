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
        // Core
        background: "#F0F0F0",
        foreground: "#121212",

        // Bauhaus Primaries
        "primary-red": "#D02020",
        "primary-blue": "#1040C0",
        "primary-yellow": "#F0C020",

        // Neutral
        muted: "#E0E0E0",
        border: "#121212",

        // Semantic
        success: "#2E7D32",
        warning: "#F0C020",
        error: "#D02020",
        info: "#1040C0",

        // Healthcare Specific
        verified: "#2E7D32",
        doctor: "#1040C0",
        dentist: "#D02020",
        pharmacist: "#F0C020",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Hard offset shadows - NEVER blurred (Bauhaus style)
        sm: "3px 3px 0 0 #121212",
        md: "4px 4px 0 0 #121212",
        lg: "6px 6px 0 0 #121212",
        xl: "8px 8px 0 0 #121212",
        // Colored shadows for accents
        "red": "4px 4px 0 0 #D02020",
        "blue": "4px 4px 0 0 #1040C0",
        "yellow": "4px 4px 0 0 #F0C020",
      },
      borderWidth: {
        "3": "3px",
      },
      fontSize: {
        display: ["clamp(2.5rem, 8vw, 6rem)", { lineHeight: "0.9" }],
        h1: ["clamp(2rem, 5vw, 4rem)", { lineHeight: "1" }],
        h2: ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.1" }],
        h3: ["clamp(1.25rem, 2vw, 1.75rem)", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};

export default config;
