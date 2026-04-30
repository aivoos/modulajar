import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Allow CommonJS in config files and service worker files
    ignores: [
      "node_modules",
      ".next/**",
      ".next/types/**",
      "dist/**",
      "tailwind.config.js",
      "next-env.d.ts",
      "postcss.config.js",
      "next.config.mjs",
      "public/sw.js",
      "public/*.js",
    ],
  },
];
