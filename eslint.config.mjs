import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".git/**",
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "node_modules/**",
    "ops/**/*.csv",
    "*.log",
    "*.csv",
    "*.svg",
    "*.md",
    "*.json",
    "*.ico",
    "*.tsbuildinfo",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
