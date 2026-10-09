/**
 * @agent-dossier
 * @purpose Fail when Remix loader/action answers OPTIONS (CORS preflight belongs in rootAuthMiddleware).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-route-options-preflight";

function isOptionsLiteral(node) {
  return (
    node &&
    node.type === "Literal" &&
    typeof node.value === "string" &&
    node.value.toUpperCase() === "OPTIONS"
  );
}

function isMethodMember(node) {
  return (
    node &&
    node.type === "MemberExpression" &&
    !node.computed &&
    node.property.type === "Identifier" &&
    node.property.name === "method"
  );
}

/** args.request.method / request.method / *.method compared to "OPTIONS" */
function isOptionsMethodCompare(node) {
  if (!node || node.type !== "BinaryExpression") return false;
  if (node.operator !== "===" && node.operator !== "==" && node.operator !== "!==" && node.operator !== "!=") {
    return false;
  }
  const { left, right } = node;
  if (isMethodMember(left) && isOptionsLiteral(right)) return true;
  if (isMethodMember(right) && isOptionsLiteral(left)) return true;
  return false;
}

function testMentionsOptionsMethod(test) {
  if (!test) return false;
  if (isOptionsMethodCompare(test)) return true;
  if (test.type === "LogicalExpression") {
    return testMentionsOptionsMethod(test.left) || testMentionsOptionsMethod(test.right);
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Remix loader/action must not handle OPTIONS; rootAuthMiddleware answers /api CORS preflight.",
      url: "steps-pattern/docs/llm/rules/enforce-no-route-options-preflight.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isRoute =
      filename.includes("/routes/") ||
      /\/app\/routes\//.test(filename) ||
      filename.includes("widget-route");
    if (!isRoute) return {};

    return {
      "FunctionDeclaration, FunctionExpression, ArrowFunctionExpression"(node) {
        let methodName = null;
        const parent = node.parent;
        if (node.type === "FunctionDeclaration" && node.id) {
          methodName = node.id.name;
        } else if (
          parent &&
          parent.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
        ) {
          methodName = parent.id.name;
        } else if (
          parent &&
          parent.type === "ExportNamedDeclaration" &&
          parent.declaration === node &&
          node.type === "FunctionDeclaration" &&
          node.id
        ) {
          methodName = node.id.name;
        }

        // export async function loader / action
        if (node.type === "FunctionDeclaration" && node.id) {
          methodName = node.id.name;
        }

        if (methodName !== "loader" && methodName !== "action") return;
        if (!node.async) return;

        const visit = (stmt) => {
          if (!stmt) return;
          if (stmt.type === "BlockStatement") {
            stmt.body.forEach(visit);
            return;
          }
          if (stmt.type === "TryStatement") {
            visit(stmt.block);
            if (stmt.handler) visit(stmt.handler.body);
            if (stmt.finalizer) visit(stmt.finalizer);
            return;
          }
          if (stmt.type === "IfStatement") {
            if (testMentionsOptionsMethod(stmt.test)) {
              context.report({
                node: stmt,
                message: withLintDocs(
                  RULE,
                  "Architectural Violation: Remix loader/action must not answer OPTIONS. " +
                    "CORS preflight for /api/* is handled by rootAuthMiddleware (HandleOptionsRequests). " +
                    "Remove the OPTIONS branch from the route.\n\n" +
                    "Intent: One place owns preflight; routes trust middleware.",
                ),
              });
            }
            visit(stmt.consequent);
            visit(stmt.alternate);
          }
        };

        if (node.body && node.body.type === "BlockStatement") {
          node.body.body.forEach(visit);
        }
      },
    };
  },
};
