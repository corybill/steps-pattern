import fs from "fs";
import path from "path";
import { normalizePath, parseSpecToAST, traverseAST } from "./maddox-before-each-shared.js";


const specCache = new Map();

/** @internal Vitest / rule harness only — spec file reads and ASTs are cached by absolute path. */
export function __resetMaddoxControllerSpecCacheForTests() {
  specCache.clear();
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

const SPEC_EXTENSIONS = [".spec.ts", ".spec.js", ".spec.jsx", ".spec.tsx"];

function resolveExistingSpecPath(candidates) {
  return candidates.find(fileExists) || "";
}

function resolveSpecPathFromBase(specBasePath) {
  return resolveExistingSpecPath(
    SPEC_EXTENSIONS.map((ext) => `${specBasePath}${ext}`),
  );
}

/** Preferred spec path in "missing suite" messages when no spec file exists yet. */
function preferredMissingSpecPath(specBasePath, sourceFilename) {
  if (sourceFilename.endsWith(".jsx")) return `${specBasePath}.spec.jsx`;
  if (sourceFilename.endsWith(".tsx")) return `${specBasePath}.spec.tsx`;
  if (sourceFilename.endsWith(".ts")) return `${specBasePath}.spec.ts`;
  return `${specBasePath}.spec.js`;
}

function getSpecData(specPath) {
  if (!fileExists(specPath)) return null;
  try {
    const stat = fs.statSync(specPath);
    const mtimeMs = stat.mtimeMs;
    const cached = specCache.get(specPath);
    if (cached && cached.mtimeMs === mtimeMs) {
      return cached;
    }

    const content = fs.readFileSync(specPath, "utf-8");
    const ast = parseSpecToAST(content);
    const entry = { mtimeMs, content, ast };
    specCache.set(specPath, entry);
    return entry;
  } catch (err) {
    return null;
  }
}

function getExportedRouteHandlers(programNode) {
  const exportedHandlers = new Set();
  let hasDefaultExport = false;

  for (const stmt of programNode.body) {
    if (stmt.type === "ExportDefaultDeclaration") {
      hasDefaultExport = true;
      continue;
    }

    if (stmt.type !== "ExportNamedDeclaration" || !stmt.declaration) continue;

    if (stmt.declaration.type === "FunctionDeclaration") {
      const name = stmt.declaration.id?.name;
      if (name === "loader" || name === "action") {
        exportedHandlers.add(name);
      }
      continue;
    }

    if (stmt.declaration.type === "VariableDeclaration") {
      for (const decl of stmt.declaration.declarations) {
        const name = decl.id?.name;
        if (name === "loader" || name === "action") {
          exportedHandlers.add(name);
        }
      }
    }
  }

  return { exportedHandlers, hasDefaultExport };
}

function collectStaticMethodNames(classBody) {
  const methodNames = new Set();
  if (!classBody || !Array.isArray(classBody.body)) return methodNames;

  for (const member of classBody.body) {
    if (member.type !== "MethodDefinition") continue;
    if (!member.static) continue;
    // Each public static method on a controller class is treated as an incoming
    // "route" (e.g. SQS message-type handler) and must have its own Maddox suite.
    if (member.kind !== "method") continue;
    if (member.accessibility === "private" || member.accessibility === "protected") continue;

    const key = member.key;
    if (!key || key.type !== "Identifier") continue;
    if (key.name.startsWith("_")) continue;

    methodNames.add(key.name);
  }

  return methodNames;
}

function getExportedControllerMethods(programNode) {
  const methodsByClass = new Map();

  for (const stmt of programNode.body) {
    if (stmt.type === "ExportNamedDeclaration" && stmt.declaration?.type === "ClassDeclaration") {
      const className = stmt.declaration.id?.name;
      if (!className) continue;
      methodsByClass.set(className, collectStaticMethodNames(stmt.declaration.body));
      continue;
    }

    if (stmt.type === "ExportDefaultDeclaration" && stmt.declaration?.type === "ClassDeclaration") {
      const className = stmt.declaration.id?.name || "default";
      methodsByClass.set(className, collectStaticMethodNames(stmt.declaration.body));
    }
  }

  return methodsByClass;
}

function hasEntryPointSpec(specContent, entryPointName) {
  // Require explicit Maddox entry-point coverage for each exported handler / controller method.
  // Supports `.withEntryPoint(Subject, "name")` and `.withEntryPoint(Subject, 'name')`.
  const entryPointRegex = new RegExp(`\\.withEntryPoint\\s*\\([^)]*["']${entryPointName}["']\\s*\\)`);
  return entryPointRegex.test(specContent);
}

function hasRemixScenarioCoverage(specContent, handlerName) {
  // For UI routes, we accept coverage if the handler name (loader or action)
  // appears in a describe block title and the spec uses RemixScenario or FrameworkRouteScenario.
  const scenarioRegex = /new\s+(RemixScenario|FrameworkRouteScenario)\s*\(/;
  if (!scenarioRegex.test(specContent)) return false;

  const describeRegex = new RegExp(`describe\\s*\\(\\s*["'][^"']*${handlerName}[^"']*["']`, "i");
  return describeRegex.test(specContent);
}

function hasEntryPointSpecAST(ast, entryPointName) {
  let found = false;
  traverseAST(ast, {
    CallExpression(callNode) {
      const callee = callNode.callee;
      if (
        callee.type === "MemberExpression" &&
        callee.property.type === "Identifier" &&
        callee.property.name === "withEntryPoint"
      ) {
        const args = callNode.arguments;
        if (args && args.length >= 2) {
          const secondArg = args[1];
          if (secondArg.type === "Literal" && secondArg.value === entryPointName) {
            found = true;
          } else if (
            secondArg.type === "TemplateLiteral" &&
            secondArg.quasis.length === 1 &&
            secondArg.quasis[0].value.cooked === entryPointName
          ) {
            found = true;
          }
        }
      }
    }
  });
  return found;
}

function hasRemixScenarioCoverageAST(ast, handlerName) {
  let hasScenario = false;
  let hasDescribe = false;

  traverseAST(ast, {
    NewExpression(newNode) {
      const callee = newNode.callee;
      if (
        callee.type === "Identifier" &&
        (callee.name === "RemixScenario" || callee.name === "FrameworkRouteScenario")
      ) {
        hasScenario = true;
      }
    },
    CallExpression(callNode) {
      const callee = callNode.callee;
      if (callee.type === "Identifier" && callee.name === "describe") {
        const args = callNode.arguments;
        if (args && args.length >= 1) {
          const firstArg = args[0];
          let title = "";
          if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
            title = firstArg.value;
          } else if (firstArg.type === "TemplateLiteral" && firstArg.quasis.length === 1) {
            title = firstArg.quasis[0].value.cooked;
          }
          if (title.toLowerCase().includes(handlerName.toLowerCase())) {
            hasDescribe = true;
          }
        }
      }
    }
  });

  return hasScenario && hasDescribe;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          controllerPathMappings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match: { type: "string" },
                replace: { type: "string" },
                withExt: { type: "string" },
              },
              required: ["match", "replace"],
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isController = filename.includes("/controllers/");
    const isRoute = filename.includes("/routes/");

    if (!isController && !isRoute) return {};

    const options = context.options[0] || {};
    const controllerPathMappings = options.controllerPathMappings;

    return {
      Program(node) {
        // Only report for routes if they actually have a loader or action
        let exportedRouteHandlers = new Set();
        let isUiRoute = false;
        if (isRoute) {
          const result = getExportedRouteHandlers(node);
          exportedRouteHandlers = result.exportedHandlers;
          isUiRoute = result.hasDefaultExport;
          if (exportedRouteHandlers.size === 0) return;
        }

        // For controllers, every public static method on an exported controller class
        // is treated as an incoming "route" (e.g. SQS message-type handler) and must
        // have its own Maddox `.withEntryPoint(..., "<methodName>")` suite.
        let exportedControllerMethods = new Map();
        if (isController) {
          exportedControllerMethods = getExportedControllerMethods(node);
        }

        let specPath = "";
        let expectedSpecPath = "";

        if (controllerPathMappings && controllerPathMappings.length) {
          for (const mapping of controllerPathMappings) {
            if (filename.includes(mapping.match)) {
              let candidate = filename.replace(mapping.match, mapping.replace);
              if (mapping.withExt) {
                candidate = candidate.replace(/\.[cm]?(js|ts|jsx|tsx)$/, mapping.withExt);
              } else {
                candidate = candidate.replace(/\.[cm]?(js|ts|jsx|tsx)$/, "");
              }
              const foundSpec = resolveSpecPathFromBase(candidate);
              if (foundSpec && fileExists(foundSpec)) {
                specPath = foundSpec;
                expectedSpecPath = preferredMissingSpecPath(candidate, filename);
                break;
              }
            }
          }
        }

        if (!specPath) {
          // Cwd-relative conventions (no package-name snowflakes).
          if (filename.includes("/src/controllers/")) {
            const specBasePath = filename.replace("/src/controllers/", "/spec/controllers/").replace(/\.(ts|js)$/, "");
            expectedSpecPath = preferredMissingSpecPath(specBasePath, filename);
            specPath = resolveSpecPathFromBase(specBasePath);
          } else if (isController && filename.includes("/app/server/controllers/")) {
            const specBasePath = filename
              .replace("/app/server/controllers/", "/spec/app/server/controllers/")
              .replace(/\.(ts|js)$/, "");
            expectedSpecPath = preferredMissingSpecPath(specBasePath, filename);
            specPath = resolveSpecPathFromBase(specBasePath);
          } else if (isRoute && filename.includes("/app/routes/")) {
            const specBasePath = filename
              .replace("/app/routes/", "/spec/app/routes/")
              .replace(/\.jsx$|\.js$|\.ts$|\.tsx$/, "");
            expectedSpecPath = preferredMissingSpecPath(specBasePath, filename);
            specPath = resolveSpecPathFromBase(specBasePath);
          }
        }


        if (!specPath || !fileExists(specPath)) {
          context.report({
            node,
            message: `Architectural Violation: ${isController ? "Controller" : "Route"} '${path.basename(filename)}' is missing a Maddox test suite in '${expectedSpecPath || specPath}'.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
          });
          return;
        }

        const specData = getSpecData(specPath);
        const content = specData ? specData.content : null;
        const ast = specData ? specData.ast : null;

        let hasMaddox = false;
        if (ast) {
          traverseAST(ast, {
            ImportDeclaration(importNode) {
              if (importNode.source.value === "maddox") {
                hasMaddox = true;
              }
            }
          });
        } else if (content && content.toLowerCase().includes("maddox")) {
          hasMaddox = true;
        }

        if (!hasMaddox) {
          context.report({
            node,
            message: `Architectural Violation: ${isController ? "Controller" : "Route"} '${path.basename(filename)}' is missing a Maddox test suite in '${specPath}'.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
          });
          return;
        }

        if (isRoute) {
          exportedRouteHandlers.forEach((handlerName) => {
            let hasCoverage = false;
            if (ast) {
              hasCoverage = hasRemixScenarioCoverageAST(ast, handlerName) || hasEntryPointSpecAST(ast, handlerName);
            } else if (content) {
              hasCoverage = hasRemixScenarioCoverage(content, handlerName) || hasEntryPointSpec(content, handlerName);
            }

            if (!hasCoverage) {
              const expectedDescribe = handlerName === "loader" ? "calling the loader (generated|AI-driven), it" : "calling the action (generated|AI-driven), it";
              const expectedCoverage = `a Maddox '.withEntryPoint(..., "${handlerName}")' suite or a '${expectedDescribe}' describe block using RemixScenario`;
              context.report({
                node,
                message: `Architectural Violation: Route '${path.basename(filename)}' exports '${handlerName}' but '${path.basename(specPath)}' is missing ${expectedCoverage}.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
              });
            }
          });
        }

        if (isController) {
          exportedControllerMethods.forEach((methodNames, className) => {
            methodNames.forEach((methodName) => {
              let hasCoverage = false;
              if (ast) {
                hasCoverage = hasEntryPointSpecAST(ast, methodName);
              } else if (content) {
                hasCoverage = hasEntryPointSpec(content, methodName);
              }

              if (!hasCoverage) {
                context.report({
                  node,
                  message: `Architectural Violation: Controller '${path.basename(filename)}' exports '${className}.${methodName}' but '${path.basename(specPath)}' is missing a Maddox '.withEntryPoint(..., "${methodName}")' suite.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
                });
              }
            });
          });
        }

        // Read the source file to see what it imports
        const sourceCode = context.getSourceCode();
        const sourceContent = sourceCode.getText();
        const sourceImports = [...sourceContent.matchAll(/import\s+.*?\s+from\s+["'](.+?)["']/g)].map(m => m[1]);
        const hasProxyImport = sourceImports.some(i => i.includes("/proxies/") && !i.includes("logger-proxy"));
        const hasModuleImport = sourceImports.some(i => i.includes("/modules/"));
        const hasRepositoryImport = sourceImports.some(i => i.includes("/repositories/"));

        // Build import map and mocked objects using AST or regex fallbacks
        const importMap = new Map();
        const mockedObjects = new Set();

        if (ast) {
          traverseAST(ast, {
            ImportDeclaration(importNode) {
              const importPath = importNode.source.value;
              for (const specifier of importNode.specifiers) {
                if (
                  specifier.type === "ImportDefaultSpecifier" ||
                  specifier.type === "ImportSpecifier" ||
                  specifier.type === "ImportNamespaceSpecifier"
                ) {
                  importMap.set(specifier.local.name, importPath);
                }
              }
            },
            CallExpression(callNode) {
              const callee = callNode.callee;
              if (
                callee.type === "MemberExpression" &&
                callee.property.type === "Identifier" &&
                callee.property.name === "mockThisFunction"
              ) {
                const args = callNode.arguments;
                if (args && args.length >= 3) {
                  const thirdArg = args[2];
                  if (thirdArg.type === "Identifier") {
                    mockedObjects.add(thirdArg.name);
                  }
                }
              }
            }
          });
        } else if (content) {
          // fallback: parse imports and mocks using regex
          const importMatches = [...content.matchAll(/import\s+(\w+)\s+from\s+["'](.+?)["']/g)];
          importMatches.forEach(m => importMap.set(m[1], m[2]));

          const mockMatches = [...content.matchAll(/mockThisFunction\s*\(\s*["'](\w+)["']\s*,\s*["'](\w+)["']\s*,\s*(\w+)\s*\)/g)];
          mockMatches.forEach(m => mockedObjects.add(m[3]));
        }

        let mocksProxy = false;
        let mocksModule = false;
        let mocksRepository = false;

        mockedObjects.forEach(obj => {
          const importPath = importMap.get(obj);
          if (importPath) {
            if (importPath.includes("/proxies/")) mocksProxy = true;
            if (importPath.includes("/modules/")) mocksModule = true;
            if (importPath.includes("/repositories/")) mocksRepository = true;
          }
        });

        if (hasProxyImport && !mocksProxy) {
          context.report({
            node,
            message: `Architectural Violation: Controller tests in '${path.basename(specPath)}' must mock at the proxy layer because the controller imports a proxy.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
          });
        }
        if (hasModuleImport && !mocksModule) {
          context.report({
            node,
            message: `Architectural Violation: Controller tests in '${path.basename(specPath)}' must mock at the module layer because the controller imports a module.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
          });
        }
        if (hasRepositoryImport && !mocksRepository) {
          context.report({
            node,
            message: `Architectural Violation: Controller tests in '${path.basename(specPath)}' must mock at the repository layer because the controller imports a repository.\n\nIntent: Ensure controllers/routes have Maddox tests; require proxy mocks when source imports proxies, module mocks when source imports modules (not services — services run for real). See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-controller-coverage.md`,
          });
        }
      },
    };
  },
};
