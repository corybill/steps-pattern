/**
 * @agent-dossier
 * @purpose Shared ESLint base preset: style, import hygiene, and cross-workspace import bans.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Keep style rules as source of truth (no eslint-config-prettier).
 */

import pluginJs from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import stepsPatternPlugin from "../index.js";
import {
  crossWorkspaceImportPatterns,
  postgresProxySpecImportPatterns,
} from "../lib/cross-workspace-import-patterns.js";

const importOrderRule = [
  "error",
  {
    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
    pathGroups: [
      {
        pattern: "@/**",
        group: "internal",
        position: "before",
      },
    ],
    pathGroupsExcludedImportTypes: ["builtin"],
    alphabetize: {
      order: "asc",
      caseInsensitive: true,
    },
    "newlines-between": "always",
  },
];

/**
 * Style + import hygiene. Steps Pattern globals are optional for thin libraries.
 *
 * @param {object} [options]
 * @param {boolean} [options.withStepsGlobals=true] Enable forbidden-words / process-env globals.
 * @returns {import('eslint').Linter.Config[]}
 */
export function base(options = {}) {
  const withStepsGlobals = options.withStepsGlobals !== false;

  /** @type {import('eslint').Linter.Config[]} */
  const configs = [
    {
      plugins: {
        ...(withStepsGlobals ? { "steps-pattern": stepsPatternPlugin } : {}),
        import: importPlugin,
      },
    },
  ];

  if (withStepsGlobals) {
    configs.push({
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      rules: {
        "steps-pattern/enforce-no-forbidden-words": "error",
        "steps-pattern/enforce-no-process-env-except-global": "error",
      },
    });
  }

  configs.push(
    pluginJs.configs.recommended,
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      rules: {
        "no-console": "error",
        "object-curly-spacing": ["error", "always"],
        quotes: ["error", "double"],
        indent: ["error", 2],
        "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
        "padding-line-between-statements": [
          "error",
          { blankLine: "always", prev: "*", next: "class" },
          { blankLine: "always", prev: "class", next: "*" },
        ],
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "import/order": importOrderRule,
        "import/no-relative-packages": "error",
        "no-restricted-imports": [
          "error",
          { patterns: crossWorkspaceImportPatterns },
        ],
      },
    },
    {
      files: ["**/logger-proxy.js", "**/events-proxy.js", "spec/**/*.{js,jsx,ts,tsx}", "scripts/**/*.{js,jsx,mjs,ts}", "evals/**/*.js", "**/reproduce.js"],
      rules: {
        "no-console": "off",
      },
    },
    {
      // Spec files: keep cross-workspace bans AND add PostgresProxy ban (concat, never replace).
      files: ["spec/**/*.spec.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              ...postgresProxySpecImportPatterns,
              ...crossWorkspaceImportPatterns,
            ],
          },
        ],
      },
    },
  );

  return configs;
}
