/**
 * @agent-dossier
 * @purpose Enforce Controller try/Service orchestration and thin Remix Router → Controller delegation.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - UI routes migrate to thin Controller delegation; legacy State+Service try bodies stay legal until each route migrates.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-controller-orchestration";

function calleeEndsWith(callee, suffix) {
  return (
    callee &&
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object?.type === "Identifier" &&
    typeof callee.object.name === "string" &&
    callee.object.name.endsWith(suffix)
  );
}

function isControllerCallExpression(expr) {
  if (!expr || expr.type !== "CallExpression") return false;
  return calleeEndsWith(expr.callee, "Controller");
}

function isServiceCallExpression(expr) {
  if (!expr || expr.type !== "CallExpression") return false;
  return calleeEndsWith(expr.callee, "Service");
}

function unwrapAwait(expr) {
  if (expr && expr.type === "AwaitExpression") return expr.argument;
  return expr;
}

function isResponseLikeCall(expr) {
  if (!expr) return false;
  if (expr.type === "NewExpression" && expr.callee?.type === "Identifier" && expr.callee.name === "Response") {
    return true;
  }
  if (
    expr.type === "CallExpression" &&
    expr.callee?.type === "MemberExpression" &&
    expr.callee.object?.type === "Identifier" &&
    expr.callee.object.name === "Response"
  ) {
    return true;
  }
  return false;
}

function isThinRouterBody(body) {
  if (!body || body.length === 0) return false;
  if (body.some((stmt) => stmt.type === "TryStatement")) return false;
  return body.every((stmt) => {
    if (stmt.type === "IfStatement") return true;
    if (stmt.type === "ReturnStatement") {
      const arg = unwrapAwait(stmt.argument);
      return (
        isControllerCallExpression(arg) ||
        isServiceCallExpression(arg) ||
        isResponseLikeCall(arg)
      );
    }
    if (stmt.type === "ExpressionStatement") {
      const expr = unwrapAwait(stmt.expression);
      return isControllerCallExpression(expr) || isServiceCallExpression(expr);
    }
    return false;
  });
}

function visitThinRouterStatements(stmts, context, report) {
  for (const stmt of stmts) {
    if (!stmt) continue;
    if (stmt.type === "BlockStatement") {
      visitThinRouterStatements(stmt.body, context, report);
      continue;
    }
    if (stmt.type === "IfStatement") {
      // Verb/path guards only — still walk consequent/alternate for illegal Service/State.
      visitThinRouterStatements(
        stmt.consequent?.type === "BlockStatement" ? stmt.consequent.body : [stmt.consequent],
        context,
        report,
      );
      if (stmt.alternate) {
        visitThinRouterStatements(
          stmt.alternate.type === "BlockStatement" ? stmt.alternate.body : [stmt.alternate],
          context,
          report,
        );
      }
      continue;
    }
    if (stmt.type === "ReturnStatement") {
      const arg = unwrapAwait(stmt.argument);
      if (isServiceCallExpression(arg)) {
        report(stmt, "thin-service");
        continue;
      }
      if (arg && !isControllerCallExpression(arg) && arg.type === "CallExpression") {
        // Returning Response.json(...) etc. inside verb guards is OK.
        continue;
      }
      if (arg && isControllerCallExpression(arg)) continue;
      if (arg && (arg.type === "CallExpression" || arg.type === "NewExpression" || arg.type === "ObjectExpression")) {
        continue;
      }
      continue;
    }
    if (stmt.type === "ExpressionStatement") {
      const expr = unwrapAwait(stmt.expression);
      if (isServiceCallExpression(expr)) {
        report(stmt, "thin-service");
      } else if (expr && !isControllerCallExpression(expr)) {
        report(stmt, "thin-other");
      }
      continue;
    }
    if (stmt.type === "VariableDeclaration") {
      report(stmt, "thin-state");
    }
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Controllers orchestrate one Service call; Remix routes either thin-delegate to a Controller or keep a legacy State+Service try body.",
      url: "steps-pattern/docs/llm/rules/enforce-controller-orchestration.md",
    },
  },
  create(context) {
    return {
      "MethodDefinition, FunctionDeclaration"(node) {
        const filename = normalizePath(context.getFilename());
        const isController = filename.includes("/controllers/");
        const isRoute = filename.includes("/routes/");

        if (!isController && !isRoute) return;

        let targetNode = node;
        let methodName = "";

        if (node.type === "MethodDefinition") {
          if (!node.static || !node.value.async) return;
          methodName = node.key.name;
          targetNode = node.value;
        } else if (node.type === "FunctionDeclaration") {
          methodName = node.id ? node.id.name : "";
        }

        if (isRoute && methodName !== "loader" && methodName !== "action") return;
        if (!targetNode || !targetNode.async) return;
        if (!targetNode.body || targetNode.body.type !== "BlockStatement") return;

        const body = targetNode.body.body;

        // Remix thin Router: no try — verb/path ifs + return Controller.method(args)
        if (isRoute && isThinRouterBody(body)) {
          let controllerCalls = 0;
          visitThinRouterStatements(body, context, (stmt, kind) => {
            if (kind === "thin-service") {
              context.report({
                node: stmt,
                message: withLintDocs(
                  RULE,
                  "Architectural Violation: Thin Remix Routers must not call Services. Delegate to a Controller (e.g. return ActionsHubController.getActionsHub(args)).\n\nIntent: Route = HTTP verb/path only; Controller owns State + Service + catch.",
                ),
              });
              return;
            }
            if (kind === "thin-state") {
              context.report({
                node: stmt,
                message: withLintDocs(
                  RULE,
                  "Architectural Violation: Thin Remix Routers must not construct State. Instantiate State inside the Controller.\n\nIntent: Route = HTTP verb/path only; Controller owns State + Service + catch.",
                ),
              });
              return;
            }
            context.report({
              node: stmt,
              message: withLintDocs(
                RULE,
                "Architectural Violation: Thin Remix Routers may only use verb/path guards and return/await *Controller.*(args).\n\nIntent: Route = HTTP verb/path only; Controller owns State + Service + catch.",
              ),
            });
          });

          const countCalls = (stmts) => {
            for (const stmt of stmts) {
              if (!stmt) continue;
              if (stmt.type === "BlockStatement") {
                countCalls(stmt.body);
                continue;
              }
              if (stmt.type === "IfStatement") {
                countCalls(
                  stmt.consequent?.type === "BlockStatement"
                    ? stmt.consequent.body
                    : [stmt.consequent],
                );
                if (stmt.alternate) {
                  countCalls(
                    stmt.alternate.type === "BlockStatement"
                      ? stmt.alternate.body
                      : [stmt.alternate],
                  );
                }
                continue;
              }
              if (stmt.type === "ReturnStatement" && isControllerCallExpression(unwrapAwait(stmt.argument))) {
                controllerCalls += 1;
              }
              if (
                stmt.type === "ExpressionStatement" &&
                isControllerCallExpression(unwrapAwait(stmt.expression))
              ) {
                controllerCalls += 1;
              }
            }
          };
          countCalls(body);

          if (controllerCalls === 0) {
            context.report({
              node: targetNode,
              message: withLintDocs(
                RULE,
                "Architectural Violation: Thin Remix loader/action must return a *Controller.* call (after optional verb/path guards).\n\nIntent: Route = HTTP verb/path only; Controller owns State + Service + catch.",
              ),
            });
          }
          return;
        }

        // 1. Must have a try/catch block (Controllers + legacy Routes)
        const tryStatement = body.find((stmt) => stmt.type === "TryStatement");
        if (!tryStatement) {
          context.report({
            node: targetNode,
            message: withLintDocs(
              RULE,
              `Architectural Violation: ${isController ? "Controller" : "Route"} methods must be wrapped in a try/catch block (or a thin Route may only return *Controller.*(args)).\n\nIntent: Enforce that Controller methods only contain try/catch blocks orchestrating a Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
            ),
          });
          return;
        }

        const tryBody = tryStatement.block.body;

        // 2. Check for business logic in try body
        let serviceCallCount = 0;

        function isStateConstruction(stmt) {
          if (stmt.type !== "VariableDeclaration" || stmt.declarations.length !== 1) {
            return false;
          }
          const init = stmt.declarations[0].init;
          if (!init || init.type !== "NewExpression") return false;
          const callee = init.callee;
          const name = callee && callee.type === "Identifier" ? callee.name : "";
          return name.endsWith("State");
        }

        function checkStatement(stmt) {
          if (stmt.type === "BlockStatement") {
            stmt.body.forEach(checkStatement);
            return;
          }

          if (isRoute && stmt.type === "IfStatement") {
            context.report({
              node: stmt,
              message: withLintDocs(
                RULE,
                `Architectural Violation: Route loaders/actions cannot branch. Path checks, empty groups, and redirects belong in a Step. One service call, then return from state.\n\nIntent: Enforce that Route methods only contain try/catch blocks orchestrating a single Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
              ),
            });
            return;
          }

          if (stmt.type === "IfStatement") {
            if (stmt.consequent) checkStatement(stmt.consequent);
            if (stmt.alternate) checkStatement(stmt.alternate);
            return;
          }

          let expr = stmt.type === "ExpressionStatement" ? stmt.expression : null;
          let isAwait = false;
          if (expr && expr.type === "AwaitExpression") {
            expr = expr.argument;
            isAwait = true;
          }

          const isCall = expr && expr.type === "CallExpression";
          const callee = isCall ? expr.callee : null;

          const isServiceCall =
            isCall &&
            isAwait &&
            (isController
              ? callee.property && callee.property.name === methodName
              : (callee.property &&
                  callee.object &&
                  callee.object.name &&
                  callee.object.name.endsWith("Service")) ||
                (callee.property &&
                  callee.object &&
                  callee.object.name === "state" &&
                  (callee.property.name === "accept" || callee.property.name === "acceptAll")) ||
                (callee.type === "Identifier" &&
                  (callee.name === "serviceFn" || callee.name.endsWith("Fn"))));

          const stmtText = context.getSourceCode().getText(stmt);
          const isIngressValidation =
            /\bValidator\.validate(?:Parsed)?\s*\(/.test(stmtText) ||
            (/\bpreconditions\b|\bPreconditions\b/.test(stmtText) &&
              (/\.test\s*\(/.test(stmtText) || /\.shouldBe/.test(stmtText))) ||
            (/\.safeParse\s*\(/.test(stmtText) ||
              (/\.parse\s*\(/.test(stmtText) && !/\bJSON\.parse\s*\(/.test(stmtText))) ||
            (isCall &&
              isAwait &&
              callee?.property?.name === "accept" &&
              /Assert|Validate/.test(stmtText));

          const isAllowed =
            (stmt.type === "ExpressionStatement" &&
              (isServiceCall ||
                isIngressValidation ||
                (isCall &&
                  callee.property &&
                  callee.object &&
                  callee.object.name === "state" &&
                  (callee.property.name.startsWith("set") ||
                    callee.property.name.startsWith("get"))) ||
                (isCall &&
                  !isAwait &&
                  callee.property &&
                  (callee.property.name.startsWith("set") ||
                    callee.property.name.startsWith("get"))) ||
                (isCall &&
                  callee.object &&
                  (callee.object.name === "console" || callee.object.name === "LoggerProxy")))) ||
            (stmt.type === "VariableDeclaration" &&
              ((!isRoute || isStateConstruction(stmt)) || isIngressValidation)) ||
            stmt.type === "ReturnStatement" ||
            stmt.type === "ThrowStatement";

          if (!isAllowed) {
            context.report({
              node: stmt,
              message: withLintDocs(
                RULE,
                `Architectural Violation: ${isController ? "Controllers" : "Routes"} are orchestrators. Business logic must be moved into a Service and called here. Only service calls, state set/get, console, and return/throw are allowed.\n\nIntent: Enforce that Controller methods only contain try/catch blocks orchestrating a Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
              ),
            });
          }

          if (isServiceCall) {
            serviceCallCount += 1;
            if (isRoute && serviceCallCount > 1) {
              context.report({
                node: stmt,
                message: withLintDocs(
                  RULE,
                  `Architectural Violation: Route loaders/actions may call exactly one Service method. Extra service calls belong in that one method's acceptAll chain.\n\nIntent: Enforce that Route methods only contain try/catch blocks orchestrating a single Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
                ),
              });
            }
          }
        }

        tryBody.forEach(checkStatement);

        if (!serviceCallCount && isController) {
          context.report({
            node: tryStatement,
            message: withLintDocs(
              RULE,
              `Architectural Violation: Controller method '${methodName}' must call a Service method with the same name.\n\nIntent: Enforce that Controller methods only contain try/catch blocks orchestrating a Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
            ),
          });
        }

        // 3. Check Catch Block for Errr
        const catchClause = tryStatement.handler;
        if (!catchClause) {
          context.report({
            node: tryStatement,
            message: withLintDocs(
              RULE,
              `Try block must have a catch block.\n\nIntent: Enforce that Controller methods only contain try/catch blocks orchestrating a Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
            ),
          });
        } else {
          const catchBody = catchClause.body.body;
          const hasErrrOrResponse = catchBody.some((stmt) => {
            const code = context.getSourceCode().getText(stmt);
            return (
              (code.includes("Errr.newError") &&
                (code.includes(".throw()") || code.includes(".get()"))) ||
              code.includes("return jsonResponse") ||
              code.includes("return {") ||
              code.includes("return new Response") ||
              code.includes("return Response.") ||
              code.includes("throw err") ||
              code.includes("throw redirect")
            );
          });

          if (!hasErrrOrResponse) {
            context.report({
              node: catchClause,
              message: withLintDocs(
                RULE,
                `Catch block must use Errr, return a valid route response, or throw/re-throw.\n\nIntent: Enforce that Controller methods only contain try/catch blocks orchestrating a Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
              ),
            });
          }
        }

        // 4. Ensure logic outside try/catch is only context/state setup
        body.forEach((stmt) => {
          if (stmt === tryStatement) return;

          const isAllowedOutside =
            stmt.type === "VariableDeclaration" ||
            stmt.type === "IfStatement" ||
            stmt.type === "ReturnStatement";

          if (!isAllowedOutside) {
            context.report({
              node: stmt,
              message: withLintDocs(
                RULE,
                `Architectural Violation: Only variable declarations (for context/state), simple guard clauses, or final returns are allowed outside the try/catch block.\n\nIntent: Enforce that Controller methods only contain try/catch blocks orchestrating a Service call and use Errr for error handling. See \`.cursor/rules/routes.mdc\` and \`backend-services.mdc\`.`,
              ),
            });
          }
        });
      },
    };
  },
};
