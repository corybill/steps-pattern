/**
 * Shared ESLint no-restricted-imports patterns.
 * Bans relative escapes into a sibling package. Package-name imports stay allowed.
 * Edit the group list for the repo you install this into.
 */
export const crossWorkspaceImportPatterns = [
  {
    group: ["**/../../*/**"],
    message:
      "Cross-workspace relative imports are banned. Use package exports only.",
  },
];

export const postgresProxySpecImportPatterns = [
  {
    group: ["**/*postgres-proxy*", "**/postgres-proxy*"],
    message:
      "Spec files must not import PostgresProxy; mock repository classes in Maddox tests instead.",
  },
];
