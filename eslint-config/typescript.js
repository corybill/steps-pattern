/**
 * @agent-dossier
 * @purpose TypeScript ESLint recommended rules scoped to *.ts files only.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */

/**
 * Scope typescript-eslint recommended configs to TS files so @typescript-eslint
 * rules do not apply to .js sources.
 *
 * @returns {Promise<import('eslint').Linter.Config[]>}
 */
export async function typescript() {
  const tseslint = (await import("typescript-eslint")).default;
  return [
    ...tseslint.configs.recommended.map((c) =>
      "files" in c && Array.isArray(c.files)
        ? c
        : { ...c, files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"] },
    ),
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
        "@typescript-eslint/no-extra-non-null-assertion": "off",
      },
    },
  ];
}

/**
 * Synchronous variant for packages that already resolve typescript-eslint.
 * Prefer this when the consumer can import typescript-eslint at config load time.
 *
 * @param {typeof import("typescript-eslint")} tseslint
 * @returns {import('eslint').Linter.Config[]}
 */
export function typescriptWith(tseslint) {
  return [
    ...tseslint.configs.recommended.map((c) =>
      "files" in c && Array.isArray(c.files)
        ? c
        : { ...c, files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"] },
    ),
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
        "@typescript-eslint/no-extra-non-null-assertion": "off",
      },
    },
  ];
}
