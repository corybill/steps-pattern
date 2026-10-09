/**
 * @agent-dossier
 * @purpose Warn when a Module calls Step.next(state) instead of state.accept(Step).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Walk whole AST including traced() callbacks; keep warn-only.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-module-accept-not-step-next";

function isStepNextCall(node) {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.property.type !== "Identifier" || callee.property.name !== "next") return false;
  if (node.arguments.length === 0) return false;
  const first = node.arguments[0];
  return first.type === "Identifier" && first.name === "state";
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Modules must orchestrate Steps via state.accept / acceptAll; never call Step.next(state).",
      url: "steps-pattern/docs/llm/rules/enforce-module-accept-not-step-next.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.includes("/modules/")) return {};

    return {
      CallExpression(node) {
        if (!isStepNextCall(node)) return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            "A Module should orchestrate Steps via state.accept(Step) / acceptAll, not Step.next(state). " +
              "Direct next bypasses accept hooks and hides the accept chain from flatten.\n\n" +
              "Intent: Modules are orchestrators; Steps run through state.accept.",
          ),
        });
      },
    };
  },
};
