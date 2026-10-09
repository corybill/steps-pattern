/**
 * @agent-dossier
 * @purpose Fail when Remix loader/action gates on auth (rootAuthMiddleware already requires it).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-route-auth-check";

function isGetAuthCall(node) {
  return (
    node &&
    node.type === "CallExpression" &&
    node.callee?.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property?.type === "Identifier" &&
    node.callee.property.name === "getAuth"
  );
}

function mentionsGetAuth(node) {
  if (!node || typeof node !== "object") return false;
  if (isGetAuthCall(node)) return true;
  if (node.type === "Identifier" && (node.name === "auth" || node.name === "userId")) return true;
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      if (child.some(mentionsGetAuth)) return true;
    } else if (child && typeof child === "object" && child.type) {
      if (mentionsGetAuth(child)) return true;
    }
  }
  return false;
}

function responseLooksUnauthorized(node) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "Literal") {
    if (node.value === 401) return true;
    if (typeof node.value === "string" && /unauthorized/i.test(node.value)) return true;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      if (child.some(responseLooksUnauthorized)) return true;
    } else if (child && typeof child === "object" && child.type) {
      if (responseLooksUnauthorized(child)) return true;
    }
  }
  return false;
}

function consequentLooksLikeAuthReject(consequent) {
  if (!consequent) return false;
  if (consequent.type === "BlockStatement") {
    return consequent.body.some((stmt) => {
      if (stmt.type === "ReturnStatement") return responseLooksUnauthorized(stmt.argument);
      if (stmt.type === "ThrowStatement") return responseLooksUnauthorized(stmt.argument);
      return false;
    });
  }
  if (consequent.type === "ReturnStatement") return responseLooksUnauthorized(consequent.argument);
  if (consequent.type === "ThrowStatement") return responseLooksUnauthorized(consequent.argument);
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Remix loader/action must not gate on auth; rootAuthMiddleware RequireAuthenticated already runs.",
      url: "steps-pattern/docs/llm/rules/enforce-no-route-auth-check.md",
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
        if (node.type === "FunctionDeclaration" && node.id) {
          methodName = node.id.name;
        } else if (
          node.parent &&
          node.parent.type === "VariableDeclarator" &&
          node.parent.id.type === "Identifier"
        ) {
          methodName = node.parent.id.name;
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
            if (mentionsGetAuth(stmt.test) && consequentLooksLikeAuthReject(stmt.consequent)) {
              context.report({
                node: stmt,
                message: withLintDocs(
                  RULE,
                  "Architectural Violation: Remix loader/action must not gate on auth (getAuth / userId → 401 Unauthorized). " +
                    "rootAuthMiddleware already runs RequireAuthenticated. Remove the auth branch and trust middleware.\n\n" +
                    "Intent: One place owns auth short-circuit; routes trust ingress middleware.",
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
