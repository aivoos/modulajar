import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
    },
  },
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
