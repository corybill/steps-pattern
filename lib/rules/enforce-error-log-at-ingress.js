/**
 * @agent-dossier
 * @purpose Fail when LoggerProxy.error / console.error appear below the ingress layer.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Soft-fail continues use LoggerProxy.warn; do not allow .error in Steps.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-error-log-at-ingress";

const LOWER_LAYER =
  /\/(steps|strategies|modules|services|proxies|repositories|state)\//;

function isIngressAllowed(filename) {
  if (/logger-proxy\.[cm]?(ts|js)$/.test(filename)) return true;
  if (filename.includes("/routes/")) return true;
  if (filename.includes("/controllers/")) return true;
  if (/\/lambda\.[cm]?(ts|js)$/.test(filename)) return true;
  if (/entry\.server\.[cm]?(jsx|js|tsx|ts)$/.test(filename)) return true;
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "LoggerProxy.error and console.error belong only on the route/controller (ingress) catch.",
      url: "steps-pattern/docs/llm/rules/enforce-error-log-at-ingress.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (isIngressAllowed(filename)) return {};
    if (!LOWER_LAYER.test(filename)) return {};

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        if (callee.property.type !== "Identifier" || callee.property.name !== "error") return;

        let objectName = "";
        if (callee.object.type === "Identifier") {
          objectName = callee.object.name;
        }
        if (objectName !== "LoggerProxy" && objectName !== "console") return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            "Architectural Violation: LoggerProxy.error / console.error belong only on the " +
              "route/controller (ingress) catch so each failed request has one stack. " +
              "Lower layers wrap with Errr and rethrow (or LoggerProxy.warn for intentional swallows).\n\n" +
              "Intent: One ERROR stack per request at ingress.",
          ),
        });
      },
    };
  },
};
