/**
 * Step files may define non-exported helpers (e.g. strategy classes). Only enforce structure on
 * classes that are part of the module's public API.
 */
function isExportedClassDeclaration(classNode, program) {
  const parent = classNode.parent;

  if (parent?.type === "ExportNamedDeclaration" && parent.declaration === classNode) {
    return true;
  }

  if (parent?.type === "ExportDefaultDeclaration" && parent.declaration === classNode) {
    return true;
  }

  if (!classNode.id) {
    return false;
  }

  const name = classNode.id.name;
  for (const stmt of program.body) {
    if (
      stmt.type === "ExportDefaultDeclaration" &&
      stmt.declaration.type === "Identifier" &&
      stmt.declaration.name === name
    ) {
      return true;
    }
    if (stmt.type !== "ExportNamedDeclaration" || stmt.declaration) {
      continue;
    }
    for (const spec of stmt.specifiers || []) {
      if (
        spec.type === "ExportSpecifier" &&
        spec.local.type === "Identifier" &&
        spec.local.name === name
      ) {
        return true;
      }
    }
  }

  return false;
}

function pascalToKebab(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-step-structure.md",
    },
  },
  create(context) {
    const program = context.getSourceCode().ast;

    return {
      ClassDeclaration(node) {
        if (!isExportedClassDeclaration(node, program)) {
          return;
        }

        // We are in a Step file (checked by globs in config)
        
        // 0. Class name must not contain the word "Step"
        let hasClassNameError = false;
        if (node.id && node.id.name.includes("Step")) {
          hasClassNameError = true;
          context.report({
            node: node.id,
            message: `Architectural Violation: Step class names must not contain the word "Step" (e.g. GetPlayersStep should be named GetPlayers).\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
          });
        }

        const rawFilename = context.filename || context.getFilename?.() || "";
        if (rawFilename && !hasClassNameError) {
          const parts = rawFilename.split("/");
          const baseNameWithExt = parts[parts.length - 1] || "";
          const baseName = baseNameWithExt.replace(/\.[cm]?(ts|js|jsx|tsx)$/, "");
          const className = node.id ? node.id.name : "";

          if (baseName.toLowerCase().includes("step")) {
            context.report({
              node: node.id || node,
              message: `Architectural Violation: Step file names must not contain the word "step" (e.g. get-players-step.js should be named get-players.js).\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
            });
          } else if (className) {
            const expectedKebab = pascalToKebab(className);
            if (baseName !== expectedKebab) {
              context.report({
                node: node.id || node,
                message: `Architectural Violation: Step file name '${baseName}' must match the kebab-case version of the class name '${className}' (expected '${expectedKebab}').\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
              });
            }
          }
        }

        const methods = node.body.body.filter(m => m.type === "MethodDefinition");
        
        // 1. Must have a static async next(state) method
        const nextMethod = methods.find(m => 
          m.key.name === "next" && 
          m.static && 
          m.value.async && 
          m.value.params.length === 1 && 
          (m.value.params[0].name === "state" || m.value.params[0].name === "_state")
        );

        if (!nextMethod) {
          context.report({
            node,
            message: `Step classes must have a 'static async next(state)' method.\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
          });
          return;
        }

        // 2. Enforce try/catch with Errr in next()
        const nextBody = nextMethod.value.body.body;
        const tryStatement = nextBody.find(stmt => stmt.type === "TryStatement");

        if (!tryStatement) {
          context.report({
            node: nextMethod,
            message: `Step 'next(state)' method must be wrapped in a try/catch block.\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
          });
        } else {
          const catchClause = tryStatement.handler;
          if (!catchClause) {
            context.report({
              node: tryStatement,
              message: `Try block must have a catch block.\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
            });
          } else {
            const catchBody = catchClause.body.body;
            const hasErrr = catchBody.some(stmt => {
              const code = context.getSourceCode().getText(stmt);
              return code.includes("Errr.newError") && (code.includes(".throw()") || code.includes(".get()"));
            });

            if (!hasErrr) {
              context.report({
                node: catchClause,
                message: `Catch block must use Errr to wrap and throw the error.\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
              });
            }
          }
        }

        // 3. Should not have other public methods (private methods starting with _ are okay)
        methods.forEach(m => {
          if (m !== nextMethod && !m.key.name.startsWith("_")) {
            context.report({
              node: m,
              message: `Steps should not have public methods other than 'next(state)'.\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
            });
          }
        });
      },
      ReturnStatement(node) {
        // Find the nearest function/method parent
        let parent = node.parent;
        while (parent &&
               parent.type !== "FunctionExpression" &&
               parent.type !== "ArrowFunctionExpression" &&
               parent.type !== "FunctionDeclaration" &&
               parent.type !== "MethodDefinition") {
          parent = parent.parent;
        }

        if (!parent || node.argument === null) {
          return;
        }

        const method =
          parent.type === "MethodDefinition"
            ? parent
            : parent.parent?.type === "MethodDefinition"
              ? parent.parent
              : null;

        if (!method || method.key.name !== "next") {
          return;
        }

        let classNode = method.parent;
        while (classNode && classNode.type !== "ClassDeclaration") {
          classNode = classNode.parent;
        }
        if (!classNode || !isExportedClassDeclaration(classNode, program)) {
          return;
        }

        context.report({
          node,
          message: `Architectural Violation: Steps must never return values. They should only write to state to remain reusable and composable. Use state setters instead.\n\nIntent: Enforce the structure of Step classes, including try/catch with Errr. See \`.cursor/rules/steps-pattern.mdc\` and \`.cursor/rules/backend-steps.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-step-structure.md`,
        });
      }
    };
  },
};
