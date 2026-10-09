/**
 * @agent-dossier
 * @purpose Fail when LoggerProxy level methods use a non-static first argument.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Keep detection to CallExpression first arg; do not require demote level.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-logger-static-message";
const LEVELS = new Set(["debug", "info", "warn", "error"]);

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "LoggerProxy first argument must be a static string; runtime values go in the attributes object.",
      url: "steps-pattern/docs/llm/rules/enforce-logger-static-message.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (/logger-proxy\.[cm]?(ts|js)$/.test(filename)) return {};

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        if (callee.object.type !== "Identifier" || callee.object.name !== "LoggerProxy") return;
        if (callee.property.type !== "Identifier" || !LEVELS.has(callee.property.name)) return;

        const first = node.arguments[0];
        if (!first) return;
        if (first.type === "Literal" && typeof first.value === "string") return;

        context.report({
          node: first,
          message: withLintDocs(
            RULE,
            "Architectural Violation: LoggerProxy first argument must be a static string Literal. " +
              "Put runtime values in the attributes object (second arg).\n\n" +
              "Intent: Searchable static log messages; structured attributes for variables.",
          ),
        });
      },
    };
  },
};
