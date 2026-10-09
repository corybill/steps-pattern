import fs from "fs";
import path from "path";
import { normalizePath } from "./maddox-before-each-shared.js";

/**
 * Enforce a single hand-authored .spec.jsx per UI route.
 * Rejects .spec.js siblings and legacy .ai-driven.spec.jsx remainder files.
 */

function getImplementationPath(specPath) {
  const normalizedPath = normalizePath(specPath);
  if (!normalizedPath.includes("/spec/app/routes/")) return null;

  const parts = normalizedPath.split("/spec/app/routes/");
  const basePath = parts[0];
  let relativeSpecPath = parts[1];

  relativeSpecPath = relativeSpecPath
    .replace(/\.ai-driven\.spec\.jsx$/, "")
    .replace(/\.spec\.js$/, "")
    .replace(/\.spec\.jsx$/, "");

  const jsxPath = path.join(basePath, "app/routes", `${relativeSpecPath}.jsx`);
  if (fs.existsSync(jsxPath)) return jsxPath;

  const tsxPath = path.join(basePath, "app/routes", `${relativeSpecPath}.tsx`);
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
      description:
        "Enforce a single hand-authored .spec.jsx file for UI routes (no .spec.js or .ai-driven.spec.jsx).",
      url: "steps-pattern/docs/llm/rules/enforce-ui-route-spec-singleton.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename());

    if (filename.endsWith(".ai-driven.spec.jsx")) {
      const implementationPath = getImplementationPath(filename);
      if (implementationPath && hasDefaultExport(implementationPath)) {
        context.report({
          loc: { line: 1, column: 0 },
          message: `Architectural Violation: UI route '${path.basename(implementationPath)}' must have a single '${path.basename(implementationPath).replace(/\.(jsx|tsx)$/, "")}.spec.jsx'. Merge this legacy '.ai-driven.spec.jsx' into that file and delete this sibling (see work/app/collapse-spec-pairs/). Do not create new ai-driven specs.\n\nIntent: One hand-authored Maddox route spec per route.\nLink: steps-pattern/docs/llm/rules/enforce-ui-route-spec-singleton.md`,
        });
      }
      return {};
    }

    if (!filename.endsWith(".spec.js")) return {};

    const implementationPath = getImplementationPath(filename);
    if (!implementationPath || !hasDefaultExport(implementationPath)) return {};

    context.report({
      loc: { line: 1, column: 0 },
      message: `Architectural Violation: UI route '${path.basename(implementationPath)}' should only have a '.spec.jsx' file. Please migrate tests from this '.spec.js' file to the '.spec.jsx' file and delete this file.\n\nIntent: Enforce a single .spec.jsx file for UI routes.\nLink: steps-pattern/docs/llm/rules/enforce-ui-route-spec-singleton.md`,
    });

    return {};
  },
};
