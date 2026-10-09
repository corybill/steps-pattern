/**
 * @agent-dossier
 * @purpose Fail when required-value invariants use if/throw instead of Preconditions.errr().debug().test().
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Zod/Validator owns untrusted ingress (Controller / Parse* / Catalog). This rule owns HOW
 *   mid-flow required-value asserts are written (Preconditions), not WHERE they live
 *   (no-frivolous-defensive-if).
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-if-throw-use-precondition";

const MESSAGE = withLintDocs(
  RULE,
  "Architectural Violation: Required-value / invariant checks must use "
    + "`Preconditions.errr().shouldBe*(…).debug({…}).test()` — not `if (!x) throw new Error` / "
    + "`Errr.newError`.\n\n"
    + "Intent: Preconditions owns trusted-pipeline invariants. Zod/`Validator.validate` owns "
    + "untrusted structured ingress (Controller / Parse* / Catalog) only — do not replace "
    + "Preconditions with Validator here.\n\n"
    + "Do not flag: HTTP short-circuits (Response / redirect / *HttpError), catch classification, "
    + "or real domain branches (empty skip, mode/intent). Sibling `no-frivolous-defensive-if` "
    + "decides WHERE the check lives.",
);

function isTargetFilename(filename) {
  return (
    filename.includes("/steps/")
    || filename.includes("/strategies/")
    || filename.includes("/services/")
    || filename.includes("/modules/")
    || filename.includes("widget-module")
    || filename.includes("call-http-proxy")
  );
}

function isInsideCatch(node) {
  let cur = node.parent;
  while (cur) {
    if (cur.type === "CatchClause") return true;
    if (cur.type === "FunctionDeclaration" || cur.type === "FunctionExpression"
      || cur.type === "ArrowFunctionExpression" || cur.type === "Program") {
      return false;
    }
    cur = cur.parent;
  }
  return false;
}

function calleeEndsWithTest(node) {
  let cur = node;
  while (cur) {
    if (cur.type === "CallExpression") {
      const callee = cur.callee;
      if (
        callee?.type === "MemberExpression"
        && !callee.computed
        && callee.property?.type === "Identifier"
        && callee.property.name === "test"
      ) {
        return true;
      }
      cur = callee?.type === "MemberExpression" ? callee.object : null;
      continue;
    }
    if (cur.type === "MemberExpression") {
      cur = cur.object;
      continue;
    }
    break;
  }
  return false;
}

function identifierName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression" && !node.computed && node.property?.type === "Identifier") {
    return node.property.name;
  }
  return null;
}

function isHttpShortCircuitThrowArg(arg) {
  if (!arg) return false;

  if (arg.type === "CallExpression") {
    if (calleeEndsWithTest(arg)) return true;
    const name = identifierName(arg.callee);
    if (name === "redirect") return true;
    if (arg.callee?.type === "MemberExpression" && arg.callee.object?.type === "Identifier"
      && arg.callee.object.name === "Response") {
      return true;
    }
    if (arg.callee?.type === "Identifier" && arg.callee.name === "Response") return true;
  }

  if (arg.type === "NewExpression") {
    const name = identifierName(arg.callee);
    if (!name) return false;
    if (name === "Response") return true;
    if (name === "AgentChatHttpError" || /HttpError$/.test(name)) return true;
  }

  return false;
}

function isRequiredValueThrowArg(arg) {
  if (!arg) return false;
  if (isHttpShortCircuitThrowArg(arg)) return false;

  if (arg.type === "NewExpression") {
    const name = identifierName(arg.callee);
    return name === "Error";
  }

  // Errr.newError(...).debug(...).throw() / .get() / bare Errr.newError(...)
  let cur = arg;
  while (cur) {
    if (cur.type === "CallExpression") {
      const callee = cur.callee;
      if (
        callee?.type === "MemberExpression"
        && !callee.computed
        && callee.property?.type === "Identifier"
        && callee.property.name === "newError"
        && callee.object?.type === "Identifier"
        && callee.object.name === "Errr"
      ) {
        return true;
      }
      if (callee?.type === "MemberExpression") {
        cur = callee.object;
        continue;
      }
      break;
    }
    if (cur.type === "MemberExpression") {
      cur = cur.object;
      continue;
    }
    break;
  }
  return false;
}

function soleThrowStatement(consequent) {
  if (!consequent) return null;
  if (consequent.type === "ThrowStatement") return consequent;
  if (consequent.type === "BlockStatement") {
    const stmts = consequent.body.filter((s) => s.type !== "EmptyStatement");
    if (stmts.length === 1 && stmts[0].type === "ThrowStatement") {
      return stmts[0];
    }
  }
  return null;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Required-value invariants must use Preconditions.errr().debug().test(), not if/throw.",
      url: "steps-pattern/docs/llm/rules/enforce-if-throw-use-precondition.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isTargetFilename(filename)) return {};

    return {
      IfStatement(node) {
        if (isInsideCatch(node)) return;

        const throwStmt = soleThrowStatement(node.consequent);
        if (!throwStmt) return;
        if (!isRequiredValueThrowArg(throwStmt.argument)) return;

        context.report({
          node: throwStmt,
          message: MESSAGE,
        });
      },
    };
  },
};
