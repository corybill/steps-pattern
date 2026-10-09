import fs from "fs";
import path from "path";
import { normalizePath } from "./maddox-before-each-shared.js";

/**
 * If a Remix route has a component (is a .jsx file), then its spec should be written in a .jsx file.
 */

function getImplementationPath(specPath) {
  // Convert spec path to implementation path
  // Example: .../ui/spec/app/routes/registration.spec.js -> .../ui/app/routes/registration.jsx
  // Example: .../ui/spec/app/routes/registration.spec.jsx -> .../ui/app/routes/registration.jsx
  
  const normalizedPath = normalizePath(specPath);
  if (!normalizedPath.includes("/spec/app/routes/")) return null;

  const parts = normalizedPath.split("/spec/app/routes/");
  const basePath = parts[0];
  const relativeSpecPath = parts[1];
  
  const routeName = relativeSpecPath.replace(/\.spec\.(js|jsx)$/, "");
  
  return path.join(basePath, "app/routes", `${routeName}.jsx`);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce .jsx extension for specs of routes that have UI components.",
      url: "steps-pattern/docs/llm/rules/enforce-jsx-spec-for-ui-routes.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.filename || context.getFilename?.() || "");
    if (!filename.endsWith(".spec.js")) return {};

    const implementationPath = getImplementationPath(filename);
    if (!implementationPath) return {};

    if (fs.existsSync(implementationPath)) {
      context.report({
        loc: { line: 1, column: 0 },
        message: `Architectural Violation: The route implementation '${path.basename(implementationPath)}' is a JSX file, which implies it has a UI component. Its spec must also use the .jsx extension to support React Testing Library and JSX syntax. Please rename this file to .spec.jsx.\n\nIntent: Enforce .jsx extension for specs of routes that have UI components.\nLink: steps-pattern/docs/llm/rules/enforce-jsx-spec-for-ui-routes.md`,
      });
    }

    return {};
  },
};
