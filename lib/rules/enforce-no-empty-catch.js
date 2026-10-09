/**
 * @agent-dossier
 * @purpose Fail when a catch body is empty or comments-only.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Log-only LoggerProxy.warn is a valid body (workload-deny swallow).
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-empty-catch";

function isTargetFilename(filename) {
  return (
    filename.includes("/steps/") ||
    filename.includes("/strategies/") ||
    filename.includes("/proxies/")
  );
}

function hasRealStatement(body) {
  if (!body || body.type !== "BlockStatement") return false;
  for (const stmt of body.body) {
    if (stmt.type === "EmptyStatement") continue;
    return true;
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "A catch body must not be empty; swallows hide failures.",
      url: "steps-pattern/docs/llm/rules/enforce-no-empty-catch.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isTargetFilename(filename)) return {};

    return {
      CatchClause(node) {
        if (hasRealStatement(node.body)) return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            "Architectural Violation: A catch body must not be empty or comments-only. " +
              "Rethrow via Errr, or LoggerProxy.warn with why when continuing intentionally.\n\n" +
              "Intent: Empty catches hide failures.",
          ),
        });
      },
    };
  },
};
