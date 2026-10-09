import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-service-orchestration";

/**
 * Flat sequential Module orchestration:
 *   await SomeModule.someMethod(state)
 *   return await SomeModule.someMethod(state)
 * Object must be an Identifier other than `state` (accept/acceptAll stay on the existing branch).
 * Conditionals, loops, and Promise.all([...]) remain forbidden in the try body.
 */
function isAwaitModuleMethodCall(expr) {
  if (!expr || expr.type !== "AwaitExpression") return false;
  const call = expr.argument;
  if (!call || call.type !== "CallExpression") return false;
  const callee = call.callee;
  if (!callee || callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.object?.type !== "Identifier") return false;
  if (callee.object.name === "state") return false;
  if (callee.property?.type !== "Identifier") return false;
  // Ban Promise.all / Promise.race fan-out of Module calls at this layer.
  if (callee.object.name === "Promise") return false;
  return true;
}

function isAllowedTryStatement(stmt, context, { isModule, isService }) {
  if (
    stmt.type === "ExpressionStatement" &&
    stmt.expression.type === "AwaitExpression" &&
    stmt.expression.argument.type === "CallExpression" &&
    stmt.expression.argument.callee.property &&
    (stmt.expression.argument.callee.property.name === "accept" ||
      stmt.expression.argument.callee.property.name === "acceptAll")
  ) {
    return true;
  }

  if (
    stmt.type === "ExpressionStatement" &&
    isAwaitModuleMethodCall(stmt.expression)
  ) {
    return true;
  }

  if (
    stmt.type === "ExpressionStatement" &&
    stmt.expression.type === "CallExpression" &&
    stmt.expression.callee.property &&
    stmt.expression.callee.property.name.startsWith("set")
  ) {
    return true;
  }

  if (
    stmt.type === "ExpressionStatement" &&
    stmt.expression.type === "CallExpression" &&
    stmt.expression.callee?.type === "MemberExpression" &&
    !stmt.expression.callee.computed &&
    stmt.expression.callee.object?.type === "Identifier" &&
    stmt.expression.callee.object.name === "Validator" &&
    stmt.expression.callee.property?.type === "Identifier" &&
    stmt.expression.callee.property.name === "validate"
  ) {
    return true;
  }

  if (stmt.type === "VariableDeclaration") return true;

  if (
    stmt.type === "ExpressionStatement" &&
    stmt.expression.type === "CallExpression" &&
    stmt.expression.callee.object &&
    (stmt.expression.callee.object.name === "console" ||
      stmt.expression.callee.object.name === "LoggerProxy")
  ) {
    return true;
  }

  if (
    stmt.type === "ExpressionStatement" &&
    context.getSourceCode().getText(stmt).includes("preconditions")
  ) {
    return true;
  }

  if ((isModule || isService) && stmt.type === "ReturnStatement") {
    if (!stmt.argument) return true;
    if (isAwaitModuleMethodCall(stmt.argument)) return true;
    // return state / return state.getX() already allowed historically via bare ReturnStatement
    return true;
  }

  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See `.cursor/rules/backend-services.mdc` and `backend-modules.mdc`.",
      url: "steps-pattern/docs/llm/rules/enforce-service-orchestration.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isModule = filename.includes("/modules/");
    const isService = filename.includes("/services/");

    return {
      MethodDefinition(node) {
        // Only target static async methods in Services/Modules
        if (!node.static || !node.value.async) return;

        // 0. Check parameters (Services only)
        if (isService) {
          const params = node.value.params;
          if (params.length === 0 || params[0].name !== "state") {
            context.report({
              node,
              message: withLintDocs(
                RULE,
                `Architectural Violation: Service methods must receive 'state' as the first argument. Instantiate state in the route, controller, or thin tool wrapper and pass it in.\n\nIntent: Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See \`.cursor/rules/backend-services.mdc\` and \`backend-modules.mdc\`.`,
              ),
            });
          }
        }

        const body = node.value.body.body;

        const tryStatement = body.find((stmt) => stmt.type === "TryStatement");

        if (!tryStatement) {
          context.report({
            node,
            message: withLintDocs(
              RULE,
              `Service/Module methods must be wrapped in a try/catch block.\n\nIntent: Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See \`.cursor/rules/backend-services.mdc\` and \`backend-modules.mdc\`.`,
            ),
          });
          return;
        }

        const tryBody = tryStatement.block.body;

        tryBody.forEach((stmt) => {
          // User-facing interaction payloads belong in Map*Result Steps — not Service/Module try bodies.
          if (
            stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "CallExpression" &&
            stmt.expression.callee?.type === "MemberExpression" &&
            !stmt.expression.callee.computed &&
            stmt.expression.callee.property?.type === "Identifier" &&
            stmt.expression.callee.property.name === "setInteractionResult"
          ) {
            context.report({
              node: stmt,
              message: withLintDocs(
                RULE,
                `Architectural Violation: Services/Modules must not call state.setInteractionResult. Map the user-facing payload in a Map*Result Step and accept it (e.g. MapGenericDismissResult).\n\nIntent: Keep Service/Module try bodies as flat orchestrators; response shaping is Step work.`,
              ),
            });
            return;
          }

          if (isAllowedTryStatement(stmt, context, { isModule, isService })) return;

          context.report({
            node: stmt,
            message: withLintDocs(
              RULE,
              `Architectural Violation: Services and Modules are orchestrators. Business logic must be moved into a Step and accepted via state.accept(). Only flat orchestration is allowed here: state.accept / acceptAll, await Module.method(state), set*, logging, preconditions, variable declarations, and return. Conditionals, loops, and Promise.all fan-out of Module calls belong in a Step.\n\nIntent: Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See \`.cursor/rules/backend-services.mdc\` and \`backend-modules.mdc\`.`,
            ),
          });
        });

        // 3. Check Catch Block for Errr
        const catchClause = tryStatement.handler;
        if (!catchClause) {
          context.report({
            node: tryStatement,
            message: withLintDocs(
              RULE,
              `Try block must have a catch block.\n\nIntent: Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See \`.cursor/rules/backend-services.mdc\` and \`backend-modules.mdc\`.`,
            ),
          });
        } else {
          const catchBody = catchClause.body.body;
          const hasErrr = catchBody.some((stmt) => {
            const code = context.getSourceCode().getText(stmt);
            return (
              code.includes("Errr.newError") &&
              (code.includes(".throw()") || code.includes(".get()"))
            );
          });

          if (!hasErrr) {
            context.report({
              node: catchClause,
              message: withLintDocs(
                RULE,
                `Catch block must use Errr to wrap and throw/return the error.\n\nIntent: Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See \`.cursor/rules/backend-services.mdc\` and \`backend-modules.mdc\`.`,
              ),
            });
          }
        }

        // 4. Ensure no logic exists outside the try/catch (except state initialization and return)
        body.forEach((stmt) => {
          if (stmt === tryStatement) return;

          const isAllowedOutside =
            stmt.type === "VariableDeclaration" ||
            ((isModule || isService) && stmt.type === "ReturnStatement") ||
            (stmt.type === "ExpressionStatement" &&
              context.getSourceCode().getText(stmt).includes("preconditions")) ||
            (stmt.type === "ReturnStatement" &&
              stmt.argument &&
              stmt.argument.type === "CallExpression" &&
              stmt.argument.callee.property &&
              stmt.argument.callee.property.name.startsWith("get"));

          if (!isAllowedOutside) {
            context.report({
              node: stmt,
              message: withLintDocs(
                RULE,
                `Logic is not allowed outside the try/catch block in a Service/Module method.\n\nIntent: Enforce that Service/Module methods only contain try/catch blocks orchestrating steps and use Errr for error handling. See \`.cursor/rules/backend-services.mdc\` and \`backend-modules.mdc\`.`,
              ),
            });
          }
        });
      },
    };
  },
};
