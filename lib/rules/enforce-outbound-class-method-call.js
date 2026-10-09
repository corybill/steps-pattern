/**
 * @agent-dossier
 * @purpose Fail when Steps call free functions imported from proxies/repos/modules.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Class.method is required so Maddox can mockThisFunction("Class", "method").
 * - Never hoist in-process policy onto a Proxy to satisfy this rule (hoist-in-process-onto-proxy).
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-outbound-class-method-call";

function isOutboundImportSource(source) {
  if (typeof source !== "string") return false;
  const normalized = source.replace(/\\/g, "/");
  return (
    normalized.includes("/proxies/") ||
    normalized.includes("/repositories/") ||
    normalized.includes("/entities/") ||
    normalized.includes("/modules/") ||
    /(?:^|\/)[^/]+-proxy(?:\.[^/]+)?$/.test(normalized) ||
    /(?:^|\/)[^/]+-repo(?:\.[^/]+)?$/.test(normalized) ||
    /(?:^|\/)[^/]+-module(?:\.[^/]+)?$/.test(normalized)
  );
}

function isTargetFilename(filename) {
  return (
    filename.includes("/steps/") ||
    filename.includes("/strategies/") ||
    filename.includes("/modules/")
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Outbound collaborators (Proxy, Repo/Entity, Module) must be called as Class.method.",
      url: "steps-pattern/docs/llm/rules/enforce-outbound-class-method-call.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isTargetFilename(filename)) return {};

    /** @type {Set<string>} */
    const freeOutboundNames = new Set();

    return {
      ImportDeclaration(node) {
        if (!isOutboundImportSource(node.source.value)) return;
        for (const spec of node.specifiers || []) {
          if (spec.type === "ImportSpecifier" || spec.type === "ImportDefaultSpecifier") {
            // Default imports of a Proxy class are fine when called as Class.method.
            // Free named imports (reportClientEvent) are the smell — track all locals;
            // only report when used as Identifier callee (not MemberExpression object).
            freeOutboundNames.add(spec.local.name);
          }
        }
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        if (!freeOutboundNames.has(node.callee.name)) return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: Outbound '${node.callee.name}' must be called as Class.method ` +
              "(e.g. ClientEventsProxy.reportClientEvent) so Maddox can mockThisFunction(\"Class\", \"method\"). " +
              "Do not import a free function from proxies/repositories/modules.\n\n" +
              "If this callee does not leave the process (Errr flag, retry cap, delay math), " +
              "do NOT add Class.method on the Proxy — that is hoist-in-process-onto-proxy (never). " +
              "Keep the Command on the Step (in-process-in-step). " +
              "class-method-call is only for outbound I/O or DateProxy.\n\n" +
              "Intent: Mockable Class.method outbounds only.",
          ),
        });
      },
    };
  },
};
