/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { primary: "#4F46E5" },
      fontFamily: { sans: ["'DM Sans'", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
