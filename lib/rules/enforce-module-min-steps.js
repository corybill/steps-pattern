/**
 * @agent-dossier
 * @purpose Warn when a Module method accepts fewer than two Steps (ceremony wrapper).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Keep warn-only. Promote to error only after one-step live methods are split or justified.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-module-min-steps";
const MIN_STEPS = 2;

function acceptCount(tryBody) {
  let count = 0;
  for (const stmt of tryBody) {
    if (stmt.type !== "ExpressionStatement") continue;
    let expr = stmt.expression;
    if (expr.type === "AwaitExpression") expr = expr.argument;
    if (expr.type !== "CallExpression") continue;
    const callee = expr.callee;
    if (callee.type !== "MemberExpression" || callee.computed) continue;
    if (callee.property.type !== "Identifier") continue;
    if (callee.property.name === "accept") {
      count += 1;
      continue;
    }
    if (callee.property.name === "acceptAll") {
      const list = expr.arguments[0];
      if (list?.type === "ArrayExpression") {
        count += list.elements.filter(Boolean).length;
      } else {
        count += 1;
      }
    }
  }
  return count;
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when a Module method accepts fewer than two Steps. " +
        "See `.cursor/rules/steps-pattern/backend-modules.mdc`.",
      url: "steps-pattern/docs/llm/rules/enforce-module-min-steps.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.includes("/modules/")) return {};

    return {
      MethodDefinition(node) {
        if (!node.static || !node.value.async) return;
        const methodName = node.key?.type === "Identifier" ? node.key.name : "method";
        const body = node.value.body?.body;
        if (!Array.isArray(body)) return;
        const tryStatement = body.find((stmt) => stmt.type === "TryStatement");
        if (!tryStatement) return;

        const count = acceptCount(tryStatement.block.body);
        if (count >= MIN_STEPS) return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            `A Module method should accept more than one Step (${methodName} accepts ${count}). ` +
              `A one-step Module is usually ceremony — add the sibling Steps, or keep the work in the Step.\n\n` +
              `Intent: Modules exist for multi-step sequences. See \`.cursor/rules/steps-pattern/backend-modules.mdc\`.`,
          ),
        });
      },
    };
  },
};
