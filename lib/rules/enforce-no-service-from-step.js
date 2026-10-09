/**
 * @agent-dossier
 * @purpose Fail when a Step imports a Service (static or dynamic).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Dynamic import() is the evasion static ImportDeclaration alone misses.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-service-from-step";

function isServiceSource(source) {
  if (typeof source !== "string") return false;
  const normalized = source.replace(/\\/g, "/");
  return (
    normalized.includes("/services/") ||
    /(?:^|\/)[^/]+-service(?:\.[^/]+)?$/.test(normalized)
  );
}

function report(context, node) {
  context.report({
    node,
    message: withLintDocs(
      RULE,
      "Architectural Violation: A Step must not import a Service. Services orchestrate Steps, " +
        "never the reverse. Accept a Step from the Service instead.\n\n" +
        "Intent: Enforce one-way Service → Step orchestration.",
    ),
  });
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "A Step must not import or dynamically import a Service.",
      url: "steps-pattern/docs/llm/rules/enforce-no-service-from-step.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.includes("/steps/")) return {};

    return {
      ImportDeclaration(node) {
        if (!isServiceSource(node.source.value)) return;
        report(context, node);
      },
      ImportExpression(node) {
        const arg = node.source;
        if (!arg || arg.type !== "Literal" || !isServiceSource(arg.value)) return;
        report(context, node);
      },
      VariableDeclarator(node) {
        if (
          !node.init ||
          node.init.type !== "CallExpression" ||
          node.init.callee.type !== "Identifier" ||
          node.init.callee.name !== "require"
        ) {
          return;
        }
        const arg = node.init.arguments[0];
        if (!arg || arg.type !== "Literal" || !isServiceSource(arg.value)) return;
        report(context, node);
      },
    };
  },
};
