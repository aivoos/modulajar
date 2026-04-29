import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin,
  {
    ignores: ["node_modules", ".next", "dist"],
  },
];
