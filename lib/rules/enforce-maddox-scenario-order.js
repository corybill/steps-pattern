import { normalizePath } from "./maddox-before-each-shared.js";

function enforceStrictContextInputParams(filename) {
  return (
    filename.includes("/spec/app/routes/") ||
    filename.includes("/spec/api/routes/") ||
    filename.includes("/spec/api/controllers/") ||
    filename.includes("/spec/controllers/")
  );
}

function isContextInputParamsMember(expr) {
  return (
    expr &&
    expr.type === "MemberExpression" &&
    expr.object &&
    expr.object.type === "Identifier" &&
    expr.object.name === "context" &&
    expr.property &&
    expr.property.type === "Identifier" &&
    expr.property.name === "inputParams"
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce the order and spacing of Maddox scenario declarations. Route/controller specs: withInputParams must use context.inputParams. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-scenario-order.md",
    },
    fixable: "whitespace",
  },
  create(context) {
    let usesMaddox = false;
    const filename = normalizePath(context.getFilename());

    return {
      ImportDeclaration(node) {
        if (node.source.value === "maddox") {
          usesMaddox = true;
        }
      },
      VariableDeclaration(node) {
        node.declarations.forEach(decl => {
          if (decl.init && decl.init.callee && decl.init.callee.name === "require" && decl.init.arguments[0] && decl.init.arguments[0].value === "maddox") {
            usesMaddox = true;
          }
        });
      },
      "NewExpression"(node) {
        if (!usesMaddox) return;

        const scenarioNames = ["Scenario", "RemixScenario", "FrameworkRouteScenario"];
        if (!node.callee || !scenarioNames.includes(node.callee.name)) return;

        const chain = [];
        let current = node.parent;

        // Walk up the chain of member calls
        while (current && current.type === "MemberExpression" && current.parent.type === "CallExpression") {
          const callExpr = current.parent;
          chain.push({
            name: current.property.name,
            node: current.property,
            callExpr,
            line: current.property.loc.start.line,
            endLine: current.property.loc.end.line
          });
          current = callExpr.parent;
        }

        if (chain.length === 0) return;

        const flatChain = chain;

        function getGroup(name) {
          if (name === "mockThisFunction" || name === "withMocks") return "mocks";
          if (
            name === "withEntryPoint" ||
            name === "withInputParams" ||
            name === "addStub" ||
            name === "withInitialEntries" ||
            name === "withStubAppContext" ||
            name === "withUser" ||
            name === "withParams"
          ) {
            return "entry";
          }
          if (
            name.startsWith("shouldBeCalled") ||
            name.startsWith("doesReturn") ||
            name.startsWith("doesError")
          ) {
            return "expectations";
          }
          if (
            name === "render" ||
            name === "triggerRender" ||
            name === "triggerAction" ||
            name === "triggerLoader" ||
            name === "next"
          ) {
            return "execution";
          }
          if (name === "test" || name === "catch" || name === "run") return "terminal";
          return "unknown";
        }

        if (enforceStrictContextInputParams(filename)) {
          flatChain.forEach((item) => {
            if (item.name !== "withInputParams") return;
            const arg0 = item.callExpr?.arguments?.[0];
            if (!isContextInputParamsMember(arg0)) {
              context.report({
                node: arg0 || item.callExpr || item.node,
                message: `Architectural Violation: Route/controller Maddox scenarios must use .withInputParams(context.inputParams) only — build the value in setupInputParams.\n\nIntent: Enforce the order and spacing of Maddox scenario declarations. Route/controller specs: withInputParams must use context.inputParams. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-scenario-order.md`,
              });
            }
          });
        }

        let currentGroupIndex = 0;
        const groupOrder = ["mocks", "entry", "expectations", "execution", "terminal"];

        flatChain.forEach(item => {
          const name = item.name;
          const itemGroup = getGroup(name);
          if (itemGroup === "unknown") return;

          const itemGroupIndex = groupOrder.indexOf(itemGroup);

          if (itemGroupIndex < currentGroupIndex) {
            context.report({
              node: item.node,
              message: `Architectural Violation: Maddox scenario call '${name}' is out of order. Expected order: mockThisFunction, withEntryPoint/withInputParams, expectations, execution, test/catch.\n\nIntent: Enforce the order and spacing of Maddox scenario declarations. Route/controller specs: withInputParams must use context.inputParams. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-scenario-order.md`,
            });
          }
          currentGroupIndex = Math.max(currentGroupIndex, itemGroupIndex);
        });

        // 2. Validate Spacing
        for (let i = 0; i < flatChain.length - 1; i++) {
          const currentItem = flatChain[i];
          const nextItem = flatChain[i + 1];
          const currentGroup = getGroup(currentItem.name);
          const nextGroup = getGroup(nextItem.name);

          if (currentGroup === "unknown" || nextGroup === "unknown") continue;

          const isSameGroup = currentGroup === nextGroup;
          const isTransitionBetweenExpectationPairs =
            currentItem.name.startsWith("does") && nextItem.name.startsWith("should");
          const consecutiveShouldBeCalledNeedsBlank =
            currentItem.name.startsWith("shouldBeCalled") &&
            nextItem.name.startsWith("shouldBeCalled") &&
            nextItem.line - currentItem.endLine <= 1;
          const consecutiveNextNeedsBlank =
            currentItem.name === "next" &&
            nextItem.name === "next" &&
            nextItem.line - currentItem.endLine <= 1;
          const needsSpace =
            !isSameGroup ||
            isTransitionBetweenExpectationPairs ||
            consecutiveShouldBeCalledNeedsBlank ||
            consecutiveNextNeedsBlank;

          if (needsSpace && nextItem.line - currentItem.endLine <= 1) {
            context.report({
              node: nextItem.node,
              message: `Architectural Violation: Maddox scenario chain missing an empty line before '${nextItem.name}'.\n\nIntent: Enforce the order and spacing of Maddox scenario declarations. Route/controller specs: withInputParams must use context.inputParams. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-scenario-order.md`,
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const dotToken = sourceCode.getTokenBefore(nextItem.node);
                const targetNode = (dotToken && dotToken.value === ".") ? dotToken : nextItem.node;

                // If they are on the same line, we need \n\n.
                // If they are on adjacent lines, we just need one \n.
                const newlines = (nextItem.line === currentItem.endLine) ? "\n\n          " : "\n          ";
                return fixer.insertTextBefore(targetNode, newlines);
              }
            });
          }
        }
      }
    };
  },
};
