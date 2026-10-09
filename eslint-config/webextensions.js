/**
 * @agent-dossier
 * @purpose Browser + WebExtensions globals for the Chrome plugin package.
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
export function webextensions() {
  return [
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.webextensions,
          process: "readonly",
          chrome: "readonly",
        },
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      },
    },
  ];
}
