/**
 * @agent-dossier
 * @purpose Enforce real Remix addStub modules for /api/* URLs when a spec paints the route UI.
 * @conforms-to steps-pattern
 * @feature generate-remix-api-stubs
 *
 * @technical-debt
 * - [x] Empty compiler placeholders and triggerLoader-only specs tripped this rule; enforcement is now paint-gated.
 *
 * @refactoring-goals
 * - Keep findApiUrls the single discovery walk; generate maps URLs to api.*.jsx modules.
 */
import fs from "fs";
import path from "path";
import { normalizePath } from "./maddox-before-each-shared.js";

/**
 * Enforce that if a component calls an /api/ route, its spec must stub it with the real module.
 */

function getImplementationPath(specPath) {
  const normalizedPath = normalizePath(specPath);
  if (!normalizedPath.includes("/spec/app/routes/")) return null;
  const parts = normalizedPath.split("/spec/app/routes/");
  const basePath = parts[0];
  const relativeSpecPath = parts[1];
  const routeName = relativeSpecPath.replace(/\.spec\.(js|jsx)$/, "");
  return path.join(basePath, "app/routes", `${routeName}.jsx`);
}

const apiCache = new Map(); // Map<string, { mtimeMs: number, urls: Set<string>, resolvedImports: string[] }>

export function __resetApiContractCacheForTests() {
  apiCache.clear();
}

export function findApiUrls(filePath, visited = new Set()) {
  if (visited.has(filePath) || !fs.existsSync(filePath)) return new Set();
  visited.add(filePath);

  let cachedEntry = null;
  try {
    const stat = fs.statSync(filePath);
    const mtimeMs = stat.mtimeMs;
    const cached = apiCache.get(filePath);
    if (cached && cached.mtimeMs === mtimeMs) {
      cachedEntry = cached;
    } else {
      const content = fs.readFileSync(filePath, "utf8");
      const urls = new Set();
      const apiRegex = /(?:fetch\(|action:|submit\()(?:\s*)(?:"\/api\/([^"?#]+)[^"]*"|'\/api\/([^'?#]+)[^']*'|`\/api\/([^`?#]+)[^`]*`)/g;

      let match;
      while ((match = apiRegex.exec(content)) !== null) {
        const url = match[1] || match[2] || match[3];
        if (url) urls.add(`/api/${url}`);
      }

      // Find direct imports to recurse
      const resolvedImports = [];
      const importRegex = /from\s+["']([^"']+)["']/g;
      while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];
        if (importPath.startsWith("@/")) {
          importPath = importPath.replace("@/", "app/");
        }

        if (importPath.startsWith(".") || importPath.startsWith("app/")) {
          if (importPath.includes("/server/") || importPath.includes("@/server/")) continue;
          const fullImportPath = importPath.startsWith(".") 
            ? path.resolve(path.dirname(filePath), importPath)
            : path.resolve(filePath.split("/app/")[0], importPath);

          const possiblePaths = [
            fullImportPath,
            `${fullImportPath}.jsx`,
            `${fullImportPath}.js`,
            path.join(fullImportPath, "index.jsx"),
            path.join(fullImportPath, "index.js"),
          ];

          for (const p of possiblePaths) {
            if (fs.existsSync(p) && (p.endsWith(".jsx") || p.endsWith(".js"))) {
              resolvedImports.push(p);
              break;
            }
          }
        }
      }

      cachedEntry = { mtimeMs, urls, resolvedImports };
      apiCache.set(filePath, cachedEntry);
    }
  } catch (err) {
    return new Set();
  }

  // Combine local URLs with transitive URLs
  const allUrls = new Set(cachedEntry.urls);
  for (const subFilePath of cachedEntry.resolvedImports) {
    const subUrls = findApiUrls(subFilePath, visited);
    for (const u of subUrls) {
      allUrls.add(u);
    }
  }

  return allUrls;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce real stubs for /api/ routes called by components.",
      url: "steps-pattern/docs/llm/rules/enforce-api-contract-testing.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.filename || context.getFilename?.() || "");
    if (!filename.endsWith(".spec.jsx")) return {};

    const implementationPath = getImplementationPath(filename);
    if (!implementationPath || !fs.existsSync(implementationPath)) return {};

    const requiredApis = findApiUrls(implementationPath);
    if (requiredApis.size === 0) return {};

    const stubs = new Map();
    const imports = new Map();
    let paintsMountedUi = false;

    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportNamespaceSpecifier" || spec.type === "ImportDefaultSpecifier" || spec.type === "ImportSpecifier") {
            imports.set(spec.local.name, src);
          }
        }
      },
      CallExpression(node) {
        const calleeName = node.callee.property?.name;
        if (calleeName === "triggerRender" || calleeName === "render") {
          paintsMountedUi = true;
        }
        if (calleeName === "addStub") {
          const arg = node.arguments[0];
          if (arg?.type === "ObjectExpression") {
            const pathProp = arg.properties.find(p => p.key.name === "path");
            const moduleProp = arg.properties.find(p => p.key.name === "module");
            
            if (pathProp?.value.type === "Literal" && typeof pathProp.value.value === "string") {
              stubs.set(pathProp.value.value, {
                module: moduleProp?.value,
                node: node
              });
            }
          }
        }
      },
      "Program:exit"() {
        // Compiler placeholders and triggerLoader-only generate-good specs never mount
        // the leaf UI. Stubs are emit facts for triggerRender / .render() only.
        if (!paintsMountedUi) return;

        for (const apiUrl of requiredApis) {
          const stub = stubs.get(apiUrl);
          if (!stub) {
            context.report({
              loc: { line: 1, column: 0 },
              message: `Architectural Violation: The component calls '${apiUrl}', but this API is not stubbed in the spec. Every API call must be stubbed with its actual route module to ensure contractual integration.\n\nIntent: Enforce real stubs for /api/ routes called by components.\nLink: steps-pattern/docs/llm/rules/enforce-api-contract-testing.md`,
            });
            continue;
          }

          const moduleNode = stub.module;
          if (!moduleNode || moduleNode.type !== "Identifier") {
            context.report({
              node: moduleNode || stub.node,
              message: `Architectural Violation: The stub for '${apiUrl}' must use the actual route module (imported from the api. route file), not a mock object. This ensures the contract between UI and API is tested.\n\nIntent: Enforce real stubs for /api/ routes called by components.\nLink: steps-pattern/docs/llm/rules/enforce-api-contract-testing.md`,
            });
            continue;
          }

          const importPath = imports.get(moduleNode.name);
          const isApiRouteImport = importPath && (importPath.includes("/routes/api.") || importPath.includes("@/routes/api."));
          
          if (!isApiRouteImport) {
            context.report({
              node: moduleNode,
              message: `Architectural Violation: The module '${moduleNode.name}' used for stubbing '${apiUrl}' does not appear to be a real API route module. It should be imported from 'app/routes/api.*.jsx'.\n\nIntent: Enforce real stubs for /api/ routes called by components.\nLink: steps-pattern/docs/llm/rules/enforce-api-contract-testing.md`,
            });
          }
        }
      },
    };
  },
};
