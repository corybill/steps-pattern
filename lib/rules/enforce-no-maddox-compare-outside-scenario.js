/**
 * @agent-dossier
 * @purpose Fail when Maddox.compare is used outside a Maddox Scenario suite.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */
import { withLintDocs } from "./lint-docs-footer.js";

const RULE = "enforce-no-maddox-compare-outside-scenario";

const SCENARIO_NAMES = new Set([
  "Scenario",
  "FromPromiseScenario",
  "RemixScenario",
  "FrameworkRouteScenario",
  "ReactRouterFrameworkScenario",
]);

function isScenarioNewExpression(node) {
  if (!node || node.type !== "NewExpression") return false;
  const callee = node.callee;
  if (callee?.type === "Identifier" && SCENARIO_NAMES.has(callee.name)) return true;
  if (
    callee?.type === "MemberExpression" &&
    !callee.computed &&
    callee.property?.type === "Identifier" &&
    SCENARIO_NAMES.has(callee.property.name)
  ) {
    return true;
  }
  return false;
}

function isMaddoxCompare(node) {
  return (
    node &&
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object?.type === "MemberExpression" &&
    !node.object.computed &&
    node.object.object?.type === "Identifier" &&
    node.object.object.name === "Maddox" &&
    node.object.property?.type === "Identifier" &&
    node.object.property.name === "compare"
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Maddox.compare belongs only in files that construct a Maddox Scenario; otherwise use Vitest expect.",
      url: "steps-pattern/docs/llm/rules/enforce-no-maddox-compare-outside-scenario.md",
    },
    schema: [],
  },
  create(context) {
    let hasScenario = false;
    const compareNodes = [];

    return {
      NewExpression(node) {
        if (isScenarioNewExpression(node)) hasScenario = true;
      },
      MemberExpression(node) {
        if (isMaddoxCompare(node)) compareNodes.push(node);
      },
      "Program:exit"() {
        if (hasScenario || compareNodes.length === 0) return;
        for (const node of compareNodes) {
          context.report({
            node,
            message: withLintDocs(
              RULE,
              "Architectural Violation: Maddox.compare is only for Maddox Scenario suites " +
                "(FromPromiseScenario / RemixScenario / FrameworkRouteScenario / ReactRouterFrameworkScenario / new Scenario). " +
                "This file has no Scenario construction — use Vitest expect (and Testing Library matchers) instead.\n\n" +
                "Intent: Keep Maddox.compare tied to Scenario contracts; component/unit specs use expect.",
            ),
          });
        }
      },
    };
  },
};
