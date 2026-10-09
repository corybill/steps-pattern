/**
 * @agent-dossier
 * @purpose Browser languageOptions globals for Remix/UI packages.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */

import globals from "globals";

/**
 * @returns {import('eslint').Linter.Config[]}
 */
export function browser() {
  return [
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      languageOptions: {
        globals: { ...globals.browser, sst: "readonly", process: "readonly" },
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
  ];
}
