/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5",
          dark:   "#4338ca",
          light:  "#eef2ff",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'DM Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)",
        "card-hover": "0 0 0 1px rgba(79,70,229,0.15), 0 4px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(79,70,229,0.3)" },
          "50%":       { boxShadow: "0 0 0 12px rgba(79,70,229,0)" },
        },
      },
      animation: {
        "fade-in":   "fade-in 0.5s ease-out",
        "float":     "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};