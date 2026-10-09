/**
 * In Maddox route/controller specs, `context.setupFoo = () => { ... }` overrides must appear
 * before any `context.setup*()` calls in the same `it` / `test` block. Otherwise the first call
 * uses a stale helper from beforeEach.
 */

function isContextSetupMember(node) {
  return (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object.type === "Identifier" &&
    node.object.name === "context" &&
    node.property.type === "Identifier" &&
    /^setup/.test(node.property.name)
  );
}

function isSetupCallStmt(stmt) {
  if (stmt.type !== "ExpressionStatement") return false;
  let expr = stmt.expression;
  if (expr.type === "AwaitExpression") {
    expr = expr.argument;
  }
  if (expr.type !== "CallExpression") return false;
  return isContextSetupMember(expr.callee);
}

function isSetupOverrideStmt(stmt) {
  if (stmt.type !== "ExpressionStatement") return false;
  const ex = stmt.expression;
  if (ex.type !== "AssignmentExpression" || ex.operator !== "=") return false;
  return isContextSetupMember(ex.left);
}

function getItCallbackFunction(callNode) {
  const args = callNode.arguments;
  if (args.length === 0) return null;
  if (
    args.length === 1 &&
    (args[0].type === "FunctionExpression" || args[0].type === "ArrowFunctionExpression")
  ) {
    return args[0];
  }
  for (let i = args.length - 1; i >= 0; i--) {
    const a = args[i];
    if (a.type === "FunctionExpression" || a.type === "ArrowFunctionExpression") {
      return a;
    }
  }
  return null;
}

function getTestBodyBlock(callNode) {
  if (callNode.type !== "CallExpression") return null;
  let root = callNode.callee;
  while (root.type === "MemberExpression") {
    root = root.object;
  }
  if (root.type !== "Identifier" || (root.name !== "it" && root.name !== "test")) {
    return null;
  }
  const fn = getItCallbackFunction(callNode);
  if (!fn) return null;
  const body = fn.body;
  return body.type === "BlockStatement" ? body : null;
}

function computeReorderedBody(stmts) {
  const firstCallIdx = stmts.findIndex(isSetupCallStmt);
  if (firstCallIdx === -1) return null;

  const before = stmts.slice(0, firstCallIdx);
  const fromFirst = stmts.slice(firstCallIdx);
  const tailOverrides = fromFirst.filter(isSetupOverrideStmt);
  if (tailOverrides.length === 0) return null;

  const fromFirstRest = fromFirst.filter(s => !isSetupOverrideStmt(s));
  return [...before, ...tailOverrides, ...fromFirstRest];
}

export default {
  meta: {
    type: "layout",
    docs: {
      description: "Require context.setup* assignments (per-test overrides) before any context.setup*() calls inside each it()/test() block in Maddox specs.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-it-setup-override-order.md",
    },
    fixable: "code",
    schema: [],
    messages: {
      afterCall: "Move this context.setup… assignment above every context.setup…() call in this it()/test() block (per-test overrides must run before invoking helpers).\n\nIntent: Require context.setup* assignments (per-test overrides) before any context.setup*() calls inside each it()/test() block in Maddox specs.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-it-setup-override-order.md",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    let usesMaddox = false;

    return {
      ImportDeclaration(node) {
        if (node.source?.value === "maddox") {
          usesMaddox = true;
        }
      },
      VariableDeclaration(node) {
        for (const decl of node.declarations) {
          const init = decl.init;
          if (
            init &&
            init.type === "CallExpression" &&
            init.callee.type === "Identifier" &&
            init.callee.name === "require" &&
            init.arguments[0]?.value === "maddox"
          ) {
            usesMaddox = true;
          }
        }
      },

      CallExpression(node) {
        if (!usesMaddox) return;

        const block = getTestBodyBlock(node);
        if (!block || block.body.length === 0) return;

        const stmts = block.body;
        const firstCallIdx = stmts.findIndex(isSetupCallStmt);
        if (firstCallIdx === -1) return;

        const fromFirst = stmts.slice(firstCallIdx);
        const tailOverrides = fromFirst.filter(isSetupOverrideStmt);
        if (tailOverrides.length === 0) return;

        const firstBad = tailOverrides[0];

        context.report({
          node: firstBad,
          messageId: "afterCall",
          fix(fixer) {
            const next = computeReorderedBody(stmts);
            if (!next || next.length !== stmts.length) return null;

            const rangeStart = stmts[0].range[0];
            const rangeEnd = stmts[stmts.length - 1].range[1];
            const text = next.map(s => sourceCode.getText(s)).join("\n");
            return fixer.replaceTextRange([rangeStart, rangeEnd], text);
          },
        });
      },
    };
  },
};
