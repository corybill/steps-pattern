import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-architectural-layer-access";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce architectural layer access: Steps call Repositories for persistence; only Repositories use PostgresProxy/Prisma. See \`.cursor/rules/backend-steps.mdc\` and \`backend-repositories.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-architectural-layer-access.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          backendPathIndicators: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = normalizePath(context.filename || context.getFilename?.() || "");
    const options = context.options[0] || {};
    const backendPathIndicators = options.backendPathIndicators || [
      "/app/server/",
      "/app/routes/",
      "/src/",
    ];

    const isBackend = backendPathIndicators.some(indicator => filename.includes(indicator));

    if (!isBackend) return {};

    const isStep = filename.includes("/steps/");
    const isProxyFile = filename.includes("/proxies/");
    const isRepositoryFile = filename.includes("/repositories/");
    const isModuleFile = filename.includes("/modules/");
    const isStrategyFile = filename.includes("/strategies/");
    const isSpec = filename.includes("/spec/") || /\.spec\.[cm]?(ts|js)$/.test(filename);
    const isServiceFile = filename.includes("/services/");

    function checkStepImport(importPath, node) {
      if (typeof importPath !== "string") return;
      const isStepImport =
        importPath.includes("/steps/") ||
        importPath.includes("-step") ||
        importPath.includes("Step") ||
        /^[./].*\/steps\//.test(importPath);
      if (isStepImport && !isServiceFile && !isModuleFile && !isSpec) {
        context.report({
          node,
          message: withLintDocs(RULE, `Architectural Violation: Step classes can only be imported inside Services, Modules, or Spec files. '${filename}' is not permitted to import Step files directly.\n\nIntent: Enforce architectural layer access: Steps must only be orchestrated by Services or Modules. See \`.cursor/rules/backend-steps.mdc\`.`),
        });
      }
    }

    const forbiddenImports = new Set();

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        checkStepImport(importPath, node);

        const isPostgresProxyImport = importPath.includes("postgres-proxy");
        const isPrismaImport = importPath.includes("@prisma/client") || importPath.includes(".prisma/client");

        if ((isPostgresProxyImport || isPrismaImport) && !isRepositoryFile && !isSpec && !isProxyFile) {
          context.report({
            node,
            message: withLintDocs(RULE, `Architectural Violation: Only Repositories are allowed to import PostgresProxy or Prisma. '${filename}' is not under repositories/.\n\nIntent: Enforce architectural layer access: Steps call Repositories for persistence; only Repositories use PostgresProxy/Prisma. See \`.cursor/rules/backend-steps.mdc\` and \`backend-repositories.mdc\`.`),
          });
        }

        const isAllowedOutboundImportFile =
          isStep || isProxyFile || isRepositoryFile || isSpec || isModuleFile || isStrategyFile;
        // Services may import Modules for flat await Module.method(state) orchestration.
        // Proxies / repositories / strategies remain Step-only (or Module/Strategy layer).
        if (!isAllowedOutboundImportFile && !isServiceFile) {
          const isForbiddenSource = importPath.includes("/proxies/") ||
                                  importPath.includes("/repositories/") ||
                                  importPath.includes("/modules/") ||
                                  importPath.includes("/strategies/") ||
                                  importPath.startsWith("../proxies/") ||
                                  importPath.startsWith("../repositories/") ||
                                  importPath.startsWith("../modules/") ||
                                  importPath.startsWith("../strategies/");

          if (isForbiddenSource) {
            node.specifiers.forEach(specifier => {
              if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportSpecifier") {
                // Observability entry-point proxies are allowed outside Steps (Lambda, SSR, etc.).
                if (specifier.local.name !== "LoggerProxy" && specifier.local.name !== "MetricsProxy") {
                  forbiddenImports.add(specifier.local.name);
                }
              }
            });
          }
        }

        if (isServiceFile) {
          const isProxyOrRepoOrStrategy =
            importPath.includes("/proxies/") ||
            importPath.includes("/repositories/") ||
            importPath.includes("/strategies/") ||
            importPath.startsWith("../proxies/") ||
            importPath.startsWith("../repositories/") ||
            importPath.startsWith("../strategies/");
          if (isProxyOrRepoOrStrategy) {
            node.specifiers.forEach(specifier => {
              if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportSpecifier") {
                if (specifier.local.name !== "LoggerProxy" && specifier.local.name !== "MetricsProxy") {
                  forbiddenImports.add(specifier.local.name);
                }
              }
            });
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
          const importPath = node.init.arguments[0].value;
          checkStepImport(importPath, node);
        }
      },
      CallExpression(node) {
        let objectName = "";
        if (node.callee.type === "MemberExpression") {
          if (node.callee.object.type === "Identifier") {
            objectName = node.callee.object.name;
          } else if (node.callee.object.type === "MemberExpression" && node.callee.object.property.type === "Identifier") {
            objectName = node.callee.object.property.name;
          }
        }

        if (!objectName) return;

        const isPostgresProxyCall = objectName === "PostgresProxy";

        if (isPostgresProxyCall && !isRepositoryFile && !isSpec && !/postgres-proxy\.[cm]?(ts|js)$/.test(filename)) {
          context.report({
            node,
            message: withLintDocs(RULE, `Architectural Violation: Direct call to 'PostgresProxy' is only allowed in Repositories (and specs).\n\nIntent: Enforce architectural layer access: Steps call Repositories for persistence; only Repositories use PostgresProxy/Prisma. See \`.cursor/rules/backend-steps.mdc\` and \`backend-repositories.mdc\`.`),
          });
        }

        const isAllowedCallFile =
          isStep || isProxyFile || isRepositoryFile || isSpec || isModuleFile || isStrategyFile;
        if (isAllowedCallFile) return;

        const isProxyCall = objectName.endsWith("Proxy")
          && objectName !== "LoggerProxy"
          && objectName !== "MetricsProxy";
        const isModuleCall = objectName.endsWith("Module");
        const isStrategyCall = objectName.endsWith("Strategy");
        const isForbiddenImport = forbiddenImports.has(objectName);

        const knownProxies = ["HttpProxy", "PrismaProxy"];
        const isKnownProxy = knownProxies.includes(objectName);

        // Services may call Module.* for flat orchestration; still ban Proxy/Strategy/repo from Services.
        if (isServiceFile && isModuleCall && !isProxyCall && !isStrategyCall && !isKnownProxy && !isForbiddenImport) {
          return;
        }

        if (isProxyCall || isModuleCall || isStrategyCall || isKnownProxy || isForbiddenImport) {
          context.report({
            node,
            message: withLintDocs(RULE, `Architectural Violation: Direct call to '${objectName}' is not allowed in this file. Proxy, Repository, Module, and Strategy calls must be made from a Step, Proxy, Repository, Module, Strategy, or spec.\n\nIntent: Enforce architectural layer access: Steps call Repositories for persistence; only Repositories use PostgresProxy/Prisma. See \`.cursor/rules/backend-steps.mdc\` and \`backend-repositories.mdc\`.`),
          });
        }
      },
    };
  },
};
