import fs from "fs";
import path from "path";
import { normalizePath } from "./maddox-before-each-shared.js";

/**
 * Enforce that every test in a UI route spec uses RemixScenario (or FrameworkRouteScenario).
 */

function getImplementationPath(specPath) {
  const normalizedPath = normalizePath(specPath);
  if (!normalizedPath.includes("/spec/app/routes/")) return null;

  const parts = normalizedPath.split("/spec/app/routes/");
  const basePath = parts[0];
  const relativeSpecPath = parts[1];
  
  const routeName = relativeSpecPath.replace(/\.spec\.(js|jsx)$/, "");
  
  // Try .jsx then .tsx
  const jsxPath = path.join(basePath, "app/routes", `${routeName}.jsx`);
  if (fs.existsSync(jsxPath)) return jsxPath;
  
  const tsxPath = path.join(basePath, "app/routes", `${routeName}.tsx`);
  if (fs.existsSync(tsxPath)) return tsxPath;

  return null;
}

function hasDefaultExport(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  return /export\s+default\s+/.test(content);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce RemixScenario for UI route tests in .spec.jsx files.",
      url: "steps-pattern/docs/llm/rules/enforce-remix-scenario-for-ui-route-tests.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.endsWith(".spec.jsx") && !filename.endsWith(".spec.tsx")) return {};

    const implementationPath = getImplementationPath(filename);
    if (!implementationPath || !hasDefaultExport(implementationPath)) return {};

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
      },
      "CallExpression:exit"(node) {
        if (node.callee.name === "describe") {
          describeStack.pop();
          currentDescribe = describeStack[describeStack.length - 1] || null;
        }
      },
      "CallExpression[callee.name=/^(it|test)$/]"(node) {
        if (!currentDescribe) return;

        const testFn = node.arguments[1];
        if (!testFn || (testFn.type !== "FunctionExpression" && testFn.type !== "ArrowFunctionExpression")) return;

        const sourceCode = context.getSourceCode().getText(testFn.body);
        const hasRemixScenario = /new\s+(RemixScenario|FrameworkRouteScenario)\s*\(/.test(sourceCode);

        if (!hasRemixScenario) {
          context.report({
            node,
            message: `Architectural Violation: Tests for UI routes in '${currentDescribe.description}' describe blocks must use 'new RemixScenario(this)'.\n\nIntent: Enforce RemixScenario for UI route tests in .spec.jsx files.\nLink: steps-pattern/docs/llm/rules/enforce-remix-scenario-for-ui-route-tests.md`,
          });
        }
      },
    };
  },
};
