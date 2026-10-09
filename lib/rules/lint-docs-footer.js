import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MANIFEST_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/llm/manifest.json",
);

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

/**
 * @param {string} ruleShortId e.g. enforce-controller-orchestration
 * @returns {{ ruleId: string, link: string, fixes: string | null }}
 */
export function lintDocsForRule(ruleShortId) {
  const ruleId = `steps-pattern/${ruleShortId}`;
  const entry = MANIFEST.rules[ruleId];
  const rulePath = entry?.path || `rules/${ruleShortId}.md`;
  const lintFixes = entry?.lintFixes || null;
  return {
    ruleId,
    link: `steps-pattern/docs/llm/${rulePath}`,
    fixes: lintFixes ? `steps-pattern/docs/llm/${lintFixes}` : null,
  };
}

/**
 * Append Link (and Fixes when the rule has recipes) to an ESLint report body.
 * Existing Link/Fixes lines are left as-is so callers can still inline them.
 * @param {string} ruleShortId
 * @param {string} body
 * @returns {string}
 */
export function withLintDocs(ruleShortId, body) {
  const docs = lintDocsForRule(ruleShortId);
  const parts = [body.replace(/\n+$/, "")];
  if (!/\nLink: /.test(body) && !/^Link: /.test(body)) {
    parts.push(`Link: ${docs.link}`);
  }
  if (docs.fixes && !/\nFixes: /.test(body) && !/^Fixes: /.test(body)) {
    parts.push(`Fixes: ${docs.fixes}`);
  }
  return parts.join("\n");
}
