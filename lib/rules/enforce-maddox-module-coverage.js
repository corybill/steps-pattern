import fs from "fs";
import path from "path";
import { normalizePath, parseSpecToAST, traverseAST } from "./maddox-before-each-shared.js";


const specCache = new Map();

/** @internal Vitest / rule harness only — spec file reads and ASTs are cached by absolute path. */
export function __resetMaddoxModuleSpecCacheForTests() {
  specCache.clear();
}

function getSpecData(specPath) {
  if (!fs.existsSync(specPath)) return null;
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

/** `modules/foo.spec.{ts,js}`, or split siblings `modules/foo.*.spec.{ts,js}`. */
function resolveModuleSpecPaths(specBasePath) {
  const preferredSpecs = [`${specBasePath}.spec.ts`, `${specBasePath}.spec.js`];
  const existingPreferredSpecs = preferredSpecs.filter((specPath) => fs.existsSync(specPath));
  if (existingPreferredSpecs.length) return existingPreferredSpecs;

  const dir = path.dirname(specBasePath);
  const base = path.basename(specBasePath);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`${base}.`) && /\.spec\.[cm]?(ts|js)$/.test(f))
    .sort()
    .map((f) => path.join(dir, f));
}

function collectStaticMethodNames(classBody) {
  // Each public static method on an exported module class is treated as an
  // independent entry point (mirrors how the controller-coverage rule treats
  // each public static method as an incoming "route" handler).
  const methodNames = new Set();
  if (!classBody || !Array.isArray(classBody.body)) return methodNames;

  for (const member of classBody.body) {
    if (member.type !== "MethodDefinition") continue;
    if (!member.static) continue;
    if (member.kind !== "method") continue;
    if (member.accessibility === "private" || member.accessibility === "protected") continue;

    const key = member.key;
    if (!key || key.type !== "Identifier") continue;
    if (key.name.startsWith("_")) continue;

    methodNames.add(key.name);
  }

  return methodNames;
}

function getExportedModuleMethods(programNode) {
  // Modules use several export shapes:
  //   1) `export class Foo { ... }`
  //   2) `export default class Foo { ... }`
  //   3) `class Foo { ... } export default Foo;` (declaration + default-by-identifier)
  //   4) `class Foo { ... } export { Foo };`     (declaration + named-by-identifier)
  // All four need to flow into the same per-method `.withEntryPoint` coverage check.
  const classDeclarations = new Map();
  const exportedClassNames = new Set();
  const methodsByClass = new Map();

  for (const stmt of programNode.body) {
    if (stmt.type === "ClassDeclaration" && stmt.id?.name) {
      classDeclarations.set(stmt.id.name, stmt);
      continue;
    }

    if (stmt.type === "ExportNamedDeclaration") {
      if (stmt.declaration?.type === "ClassDeclaration") {
        const name = stmt.declaration.id?.name;
        if (name) {
          methodsByClass.set(name, collectStaticMethodNames(stmt.declaration.body));
        }
        continue;
      }
      if (Array.isArray(stmt.specifiers)) {
        for (const spec of stmt.specifiers) {
          const local = spec.local?.name;
          if (local) exportedClassNames.add(local);
        }
      }
      continue;
    }

    if (stmt.type === "ExportDefaultDeclaration") {
      if (stmt.declaration?.type === "ClassDeclaration") {
        const name = stmt.declaration.id?.name || "default";
        methodsByClass.set(name, collectStaticMethodNames(stmt.declaration.body));
      } else if (stmt.declaration?.type === "Identifier") {
        exportedClassNames.add(stmt.declaration.name);
      }
    }
  }

  exportedClassNames.forEach((className) => {
    if (methodsByClass.has(className)) return;
    const decl = classDeclarations.get(className);
    if (!decl) return;
    methodsByClass.set(className, collectStaticMethodNames(decl.body));
  });

  return methodsByClass;
}

function hasEntryPointSpec(specContent, entryPointName) {
  // Require explicit Maddox entry-point coverage for each exported module method.
  // Supports `.withEntryPoint(Subject, "name")` and `.withEntryPoint(Subject, 'name')`.
  const entryPointRegex = new RegExp(`\\.withEntryPoint\\s*\\([^)]*["']${entryPointName}["']\\s*\\)`);
  return entryPointRegex.test(specContent);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          modulePathMappings: {
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
    const fileBasename = path.basename(filename);
    // Modules only. A Service is never a Maddox entry point — the Route/Controller
    // above it is (`enforce-no-service-entry-point-in-maddox-spec`).
    if (!filename.includes("/modules/") ||
        filename.includes("/services/") ||
        /\.spec\.[cm]?(ts|js)$/.test(fileBasename) ||
        filename.includes(".agent-tool.js") ||
        /\/index\.[cm]?(ts|js)$/.test(filename) ||
        filename.includes("/types/") ||
        /-types\.[cm]?(ts|js)$/.test(fileBasename)) return {};

    const options = context.options[0] || {};
    const modulePathMappings = options.modulePathMappings;

    return {
      Program(node) {
        let specPaths = [];

        if (modulePathMappings && modulePathMappings.length) {
          for (const mapping of modulePathMappings) {
            if (filename.includes(mapping.match)) {
              let candidate = filename.replace(mapping.match, mapping.replace);
              if (mapping.withExt) {
                candidate = candidate.replace(/\.[cm]?(js|ts)$/, mapping.withExt);
              } else {
                candidate = candidate.replace(/\.[cm]?(js|ts)$/, "");
              }
              const foundSpecs = resolveModuleSpecPaths(candidate);
              if (foundSpecs.length) {
                specPaths = foundSpecs;
                break;
              }
            }
          }
        }

        if (!specPaths.length) {
          // Cwd-relative conventions (no package-name snowflakes).
          if (filename.includes("/src/modules/")) {
            const specBasePath = filename
              .replace("/src/modules/", "/spec/modules/")
              .replace(/\.[cm]?(js|ts)$/, "");
            specPaths = resolveModuleSpecPaths(specBasePath);
          } else if (filename.includes("/app/server/modules/")) {
            // Nested modules (e.g. app/server/modules/partner/partner.js)
            // → spec/app/server/modules/<basename>.spec.{js,ts}
            const baseNameWithoutExt = path.basename(filename).replace(/\.[cm]?(js|ts)$/, "");
            const projectRoot = filename.split("/app/")[0];
            specPaths = resolveModuleSpecPaths(
              path.join(projectRoot, "spec/app/server/modules", baseNameWithoutExt),
            );
          }
        }


        if (!specPaths.length) {
          context.report({
            node,
            message: `Architectural Violation: Module '${path.basename(filename)}' is missing a Maddox test suite.\n\nIntent: Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md`,
          });
          return;
        }

        const specsData = [];
        for (const specPath of specPaths) {
          const specData = getSpecData(specPath);
          if (specData) {
            specsData.push({
              path: specPath,
              content: specData.content,
              ast: specData.ast,
            });
          }
        }
        const specSuiteLabel = specPaths.map((p) => path.basename(p)).join(", ");

        let hasMaddox = false;
        for (const spec of specsData) {
          if (spec.ast) {
            traverseAST(spec.ast, {
              ImportDeclaration(importNode) {
                if (importNode.source.value === "maddox") {
                  hasMaddox = true;
                }
              }
            });
          } else if (spec.content.toLowerCase().includes("maddox")) {
            hasMaddox = true;
          }
        }

        if (!hasMaddox) {
          context.report({
            node,
            message: `Architectural Violation: Module '${path.basename(filename)}' is missing a Maddox test suite in '${specSuiteLabel}'.\n\nIntent: Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md`,
          });
          return;
        }

        // Per-method `.withEntryPoint` coverage: every public static method on an
        // exported module class needs its own Maddox suite. This catches the case
        // where one split-file spec is emptied (or never written) but other split
        // siblings still contain the word "maddox".
        const exportedModuleMethods = getExportedModuleMethods(node);
        exportedModuleMethods.forEach((methodNames, className) => {
          methodNames.forEach((methodName) => {
            let foundEntryPoint = false;
            for (const spec of specsData) {
              if (spec.ast) {
                traverseAST(spec.ast, {
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
                        if (secondArg.type === "Literal" && secondArg.value === methodName) {
                          foundEntryPoint = true;
                        } else if (
                          secondArg.type === "TemplateLiteral" &&
                          secondArg.quasis.length === 1 &&
                          secondArg.quasis[0].value.cooked === methodName
                        ) {
                          foundEntryPoint = true;
                        }
                      }
                    }
                  }
                });
              } else {
                if (hasEntryPointSpec(spec.content, methodName)) {
                  foundEntryPoint = true;
                }
              }
            }

            if (!foundEntryPoint) {
              context.report({
                node,
                message: `Architectural Violation: Module '${path.basename(filename)}' exports '${className}.${methodName}' but '${specSuiteLabel}' is missing a Maddox '.withEntryPoint(..., "${methodName}")' suite.\n\nIntent: Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md`,
              });
            }
          });
        });

        // Read the source file to see what it imports
        const sourceContent = fs.readFileSync(filename, "utf-8");
        const sourceImports = [...sourceContent.matchAll(/import\s+.*?\s+from\s+["'](.+?)["']/g)].map(m => m[1]);
        const hasProxyImport = sourceImports.some(i => i.includes("/proxies/"));
        const hasRepositoryImport = sourceImports.some(i => i.includes("/repositories/"));
        const hasModuleImport = sourceImports.some(i => i.includes("/modules/"));

        // Build import map and mocked objects using AST or regex fallbacks
        const importMap = new Map();
        const mockedObjects = new Set();

        for (const spec of specsData) {
          if (spec.ast) {
            traverseAST(spec.ast, {
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
          } else {
            // fallback: parse imports using regex
            const importMatches = [...spec.content.matchAll(/import\s+(\w+)\s+from\s+["'](.+?)["']/g)];
            importMatches.forEach(m => importMap.set(m[1], m[2]));

            const mockMatches = [...spec.content.matchAll(/mockThisFunction\s*\(\s*["'](\w+)["']\s*,\s*["'](\w+)["']\s*,\s*(\w+)\s*\)/g)];
            mockMatches.forEach(m => mockedObjects.add(m[3]));
          }
        }

        let mocksProxy = false;
        let mocksRepository = false;
        let mocksModule = false;

        mockedObjects.forEach(obj => {
          const importPath = importMap.get(obj);
          if (importPath) {
            if (importPath.includes("/proxies/")) mocksProxy = true;
            if (importPath.includes("/repositories/")) mocksRepository = true;
            if (importPath.includes("/modules/")) mocksModule = true;
          }
        });

        if (hasProxyImport && !mocksProxy) {
          context.report({
            node,
            message: `Architectural Violation: Module tests in '${specSuiteLabel}' must mock at the proxy layer because the module imports a proxy.\n\nIntent: Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md`,
          });
        }
        if (hasRepositoryImport && !mocksRepository) {
          context.report({
            node,
            message: `Architectural Violation: Module tests in '${specSuiteLabel}' must mock at the repository layer because the module imports a repository.\n\nIntent: Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md`,
          });
        }
        if (hasModuleImport && !mocksModule) {
          context.report({
            node,
            message: `Architectural Violation: Module tests in '${specSuiteLabel}' must mock at the module layer because the module imports a module.\n\nIntent: Ensure each public static method on a module class has a Maddox \`.withEntryPoint(Module, \"<methodName>\")\` suite (split spec files allowed), and that module tests mock at the proxy/repository/module layers when the module imports them. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-coverage.md`,
          });
        }
      },
    };
  },
};
