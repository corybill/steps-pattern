import fs from "fs";
import path from "path";

import { withLintDocs } from "./lint-docs-footer.js";

const RULE = "enforce-no-unused-steps";

// Map<string, { mtimeMs: number, usedSteps: Set<string> }>
const fileCache = new Map();

/** @internal Vitest / rule harness only — clears cached step-usage scan between cases. */
export function __resetNoUnusedStepsCacheForTests() {
  fileCache.clear();
}

function toPascalCase(str) {
  return str
    .replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^[a-z]/, (g) => g.toUpperCase());
}

function getUsedSteps(projectRoot) {
  const dirsToScan = [
    path.join(projectRoot, "app"),
    path.join(projectRoot, "src"),
  ];

  const foundFiles = new Set();

  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const lowerFile = file.toLowerCase();
          if (
            lowerFile === "spec" ||
            lowerFile === "specs" ||
            lowerFile === "test" ||
            lowerFile === "tests" ||
            lowerFile === "__tests__"
          ) {
            continue;
          }
          scanDir(fullPath);
        } else if (
          file.endsWith(".js") ||
          file.endsWith(".jsx") ||
          file.endsWith(".ts") ||
          file.endsWith(".tsx")
        ) {
          const relativePath = "/" + path.relative(projectRoot, fullPath).replace(/\\/g, "/").toLowerCase() + "/";
          if (
            relativePath.includes("/spec/") ||
            relativePath.includes("/specs/") ||
            relativePath.includes("/test/") ||
            relativePath.includes("/tests/") ||
            relativePath.includes("/__tests__/") ||
            file.includes(".spec.") ||
            file.includes(".test.")
          ) {
            continue;
          }
          foundFiles.add(fullPath);
          const mtimeMs = stat.mtimeMs;
          const cached = fileCache.get(fullPath);
          if (cached && cached.mtimeMs === mtimeMs) {
            continue;
          }

          const baseNameNoExt = path.basename(file, path.extname(file));
          const selfClassName = toPascalCase(baseNameNoExt);

          const content = fs.readFileSync(fullPath, "utf-8");
          const fileUsedSteps = new Set();
          // Look for any word that starts with a capital letter (likely a Step class)
          // and is used in the code. We'll filter this against the actual Step names later.
          // We exclude the class name representing the file itself to avoid self-reference matching.
          const matches = content.matchAll(/\b([A-Z]\w+)\b/g);
          for (const match of matches) {
            const word = match[1];
            if (word !== selfClassName) {
              fileUsedSteps.add(word);
            }
          }
          fileCache.set(fullPath, { mtimeMs, usedSteps: fileUsedSteps });
        }
      } catch (err) {
        // Handle files deleted/locked during concurrent scans gracefully
      }
    }
  };

  dirsToScan.forEach(scanDir);

  // Prune deleted files from cache to prevent memory leaks
  for (const cachedPath of fileCache.keys()) {
    if (!foundFiles.has(cachedPath)) {
      fileCache.delete(cachedPath);
    }
  }

  // Union all used steps across all scanned files
  const allUsedSteps = new Set();
  for (const cacheEntry of fileCache.values()) {
    for (const step of cacheEntry.usedSteps) {
      allUsedSteps.add(step);
    }
  }

  return allUsedSteps;
}

import { normalizePath } from "./maddox-before-each-shared.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Identify Steps that are not used in any Service or Module. See \`.cursor/rules/backend-steps.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-no-unused-steps.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.includes("/steps/")) return {};

    return {
      ClassDeclaration(node) {
        if (!node.id) return;
        const className = node.id.name;
        
        // Find project root by looking for package.json
        let currentDir = path.dirname(filename);
        let projectRoot = currentDir;
        while (currentDir !== path.parse(currentDir).root) {
          if (fs.existsSync(path.join(currentDir, "package.json"))) {
            projectRoot = currentDir;
            break;
          }
          currentDir = path.dirname(currentDir);
        }

        const usedSteps = getUsedSteps(projectRoot);

        if (!usedSteps.has(className)) {
          context.report({
            node: node.id,
            message: withLintDocs(
              RULE,
              `Step '${className}' is not used in any Service or Module. It should be accepted into state or removed.\n\nIntent: Identify Steps that are not used in any Service or Module. See \`.cursor/rules/backend-steps.mdc\`.`,
            ),
          });
        }
      },
    };
  },
};
