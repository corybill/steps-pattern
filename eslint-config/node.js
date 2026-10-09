/**
 * @agent-dossier
 * @purpose Node.js languageOptions globals for backend packages.
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
export function node() {
  return [
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      languageOptions: {
        globals: { ...globals.node, process: "readonly" },
        parserOptions: {
          ecmaVersion: "latest",
          sourceType: "module",
        },
      },
    },
  ];
}
