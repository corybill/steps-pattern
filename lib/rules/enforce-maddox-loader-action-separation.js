/**
 * Enforce separation of concerns between loader and action tests in Maddox FrameworkRouteScenario tests.
 */

function sourceHasLoaderMock(source) {
  return (
    source.includes(".loader =") ||
    source.includes("setupStubModule") ||
    source.includes("setupLoaderMock")
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce separation of concerns between loader and action tests.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-loader-action-separation.md",
    },
  },
  create(context) {
    let currentDescribe = null;
    const describeStack = [];

    return {
      CallExpression(node) {
        if (node.callee.name === "describe") {
          const description = node.arguments[0]?.value;
          if (typeof description === "string") {
            const lowerDesc = description.toLowerCase();
            let type = null;
            if (/\bloader\b/.test(lowerDesc)) type = "loader";
            else if (/\baction\b/.test(lowerDesc)) type = "action";
            
            currentDescribe = { type, description, node };
            describeStack.push(currentDescribe);
          }
        }

        if (!currentDescribe) return;

        // Check for UI interactions in loader tests
        if (currentDescribe.type === "loader") {
          const callee = node.callee;
          const isUiInteraction = 
            (callee.type === "MemberExpression" && 
             (callee.object.name === "userEvent" || callee.object.name === "fireEvent")) ||
            (callee.name === "userEvent" || callee.name === "fireEvent");

          if (isUiInteraction) {
            context.report({
              node,
              message: `Architectural Violation: Loader tests should only verify data loading and initial render. UI interactions like '${context.getSourceCode().getText(callee)}' are forbidden in loader tests. Move this test to a 'calling the action, it' describe block.\n\nIntent: Enforce separation of concerns between loader and action tests.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-loader-action-separation.md`,
            });
          }
        }
      },
      "CallExpression:exit"(node) {
        if (node.callee.name === "describe") {
          describeStack.pop();
          currentDescribe = describeStack[describeStack.length - 1] || null;
        }
      },
      // For action tests, we need to ensure loader is mocked and action is triggered.
      ":function:exit"(node) {
        if (currentDescribe?.type === "action" && 
            node.parent.type === "CallExpression" && 
            (node.parent.callee.name === "it" || node.parent.callee.name === "test")) {
          const sourceCode = context.getSourceCode();
          const itSource = sourceCode.getText(node);
          // Generate (and house style) assign stubModule.loader in
          // setupInputParams / beforeEach, not inline in the it body.
          const describeSource = sourceCode.getText(currentDescribe.node);
          
          if (!sourceHasLoaderMock(describeSource)) {
            context.report({
              node: node.parent,
              message: `Architectural Violation: Action tests must mock the loader response to ensure isolation. Assign 'stubModule.loader = ...' in setupInputParams (or a setupLoaderMock* helper) so the action describe does not run the real loader.\n\nIntent: Enforce separation of concerns between loader and action tests.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-loader-action-separation.md`,
            });
          }

          // 2. Check for UI interaction OR triggerAction (API / generated specs)
          const hasUiInteraction = 
            itSource.includes("userEvent.") || 
            itSource.includes("fireEvent.");
          const hasTriggerAction = itSource.includes(".triggerAction(");

          if (!hasUiInteraction && !hasTriggerAction) {
            context.report({
              node: node.parent,
              message: `Architectural Violation: Action tests must trigger the action via a UI interaction (e.g., userEvent.click) or .triggerAction(descriptor, params).\n\nIntent: Enforce separation of concerns between loader and action tests.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-loader-action-separation.md`,
            });
          }
        }
      },
    };
  },
};
