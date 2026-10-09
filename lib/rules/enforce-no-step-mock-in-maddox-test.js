/**
 * Maddox scenario tests must not mock the step layer. Mock
 * proxies, modules, and repositories so the service and steps run for real.
 */

function importPathIsStepLayer(src) {
  if (typeof src !== "string") return false;
  return src.includes("/steps/");
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid mockThisFunction targets that resolve to /steps/ imports in Maddox scenario tests — mock proxies, modules, or repositories instead.",
      url: "steps-pattern/docs/llm/rules/enforce-no-step-mock-in-maddox-test.md",
    },
  },
  create(context) {
    const importByLocal = new Map();

    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        if (typeof src !== "string") return;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportSpecifier" || spec.type === "ImportNamespaceSpecifier") {
            importByLocal.set(spec.local.name, src);
          }
        }
      },
      VariableDeclarator(node) {
        if (
          node.init &&
          node.init.type === "CallExpression" &&
          node.init.callee.type === "Identifier" &&
          node.init.callee.name === "require" &&
          node.init.arguments.length > 0 &&
          node.init.arguments[0].type === "Literal"
        ) {
          const src = node.init.arguments[0].value;
          if (typeof src === "string") {
            if (node.id.type === "Identifier") {
              importByLocal.set(node.id.name, src);
            } else if (node.id.type === "ObjectPattern") {
              node.id.properties.forEach((prop) => {
                if (prop.type === "Property" && prop.value.type === "Identifier") {
                  importByLocal.set(prop.value.name, src);
                }
              });
            }
          }
        }
      },
      CallExpression(node) {
        if (
          !node.callee.property ||
          node.callee.property.name !== "mockThisFunction" ||
          node.arguments.length < 3
        ) {
          return;
        }
        const third = node.arguments[2];
        if (!third || third.type !== "Identifier") return;

        const src = importByLocal.get(third.name);
        if (importPathIsStepLayer(src)) {
          context.report({
            node: third,
            message: `Architectural Violation: Maddox scenario tests must not mock Step classes — mock proxies, modules, or repositories so steps run for real.\n\nIntent: Forbid mockThisFunction targets that resolve to /steps/ imports in Maddox scenario tests — mock proxies, modules, or repositories instead.\nLink: steps-pattern/docs/llm/rules/enforce-no-step-mock-in-maddox-test.md`,
          });
        }
      },
    };
  },
};
