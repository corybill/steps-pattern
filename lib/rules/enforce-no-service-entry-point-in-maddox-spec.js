/**
 * Maddox scenario tests must not use a Service class as their entry point.
 * Scenarios should target Controllers/Routes or Modules instead.
 * See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.
 */

function importPathIsServiceLayer(src) {
  if (typeof src !== "string") return false;
  return src.includes("/services/");
}

/** Service-as-ingress specs (agent-tools) may withEntryPoint the Service. */
function specAllowsServiceEntryPoint(filename) {
  if (typeof filename !== "string") return false;
  const n = filename.replace(/\\/g, "/");
  return /\/spec\/(?:generated\/)?services\//.test(n);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid Service classes from being used as entry points in Maddox scenario tests.",
      url: "steps-pattern/docs/llm/rules/enforce-no-service-entry-point-in-maddox-spec.md",
    },
  },
  create(context) {
    if (specAllowsServiceEntryPoint(context.getFilename())) {
      return {};
    }
    const importByLocal = new Map();

    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        if (typeof src !== "string") return;
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportDefaultSpecifier" ||
            spec.type === "ImportSpecifier" ||
            spec.type === "ImportNamespaceSpecifier"
          ) {
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
          node.callee.property.name !== "withEntryPoint" ||
          node.arguments.length === 0
        ) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== "Identifier") return;

        const src = importByLocal.get(firstArg.name);
        if (importPathIsServiceLayer(src)) {
          context.report({
            node: firstArg,
            message: `Architectural Violation: Maddox scenario tests must not use a Service class as their entry point. Scenarios should target Controllers/Routes or Modules instead.\n\nIntent: Ensure Maddox Scenario tests have entry points at Routes/Controllers, and modules. Services must not be used as entry points directly.\nLink: steps-pattern/docs/llm/rules/enforce-no-service-entry-point-in-maddox-spec.md`,
          });
        }
      },
    };
  },
};
