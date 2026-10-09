import fs from "fs";
import path from "path";
import { normalizePath } from "./maddox-before-each-shared.js";

/**
 * Forbid FromPromiseScenario in UI route specs (.spec.jsx).
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
      description: "Forbid FromPromiseScenario in UI route specs.",
      url: "steps-pattern/docs/llm/rules/enforce-no-from-promise-in-ui-spec.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.endsWith(".spec.jsx") && !filename.endsWith(".spec.tsx")) return {};

    const implementationPath = getImplementationPath(filename);
    if (!implementationPath || !hasDefaultExport(implementationPath)) return {};

    return {
      MemberExpression(node) {
        if (
          node.object.name === "Maddox" &&
          node.property.name === "scenarios" &&
          node.parent.type === "MemberExpression" &&
          node.parent.property.name === "FromPromiseScenario"
        ) {
          context.report({
            node: node.parent,
            message: `Architectural Violation: UI route specs must not use FromPromiseScenario. Use RemixScenario (FrameworkRouteScenario) instead.\n\nIntent: Forbid FromPromiseScenario in UI route specs.\nLink: steps-pattern/docs/llm/rules/enforce-no-from-promise-in-ui-spec.md`,
          });
        }
      },
      Identifier(node) {
        // Also check for direct usage if it was aliased
        if (node.name === "FromPromiseScenario" && node.parent.type !== "MemberExpression") {
          context.report({
            node,
            message: `Architectural Violation: UI route specs must not use FromPromiseScenario. Use RemixScenario (FrameworkRouteScenario) instead.\n\nIntent: Forbid FromPromiseScenario in UI route specs.\nLink: steps-pattern/docs/llm/rules/enforce-no-from-promise-in-ui-spec.md`,
          });
        }
      },
    };
  },
};
