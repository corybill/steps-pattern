/**
 * Module Maddox specs: outer describe is a grouping shell only; each inner describe
 * owns `beforeEach` + tests. See `.cursor/rules/maddox-module-scenario-tests.mdc`.
 */

const HOOK_NAMES = new Set(["beforeEach", "afterEach", "beforeAll", "afterAll"]);
const IT_NAMES = new Set(["it", "test"]);

function getDescribeBodyBlock(node) {
  const fn = node.arguments && node.arguments[1];
  if (!fn || (fn.type !== "FunctionExpression" && fn.type !== "ArrowFunctionExpression")) {
    return null;
  }
  const body = fn.body;
  if (body.type === "BlockStatement") return body;
  return null;
}

function callBaseName(expr) {
  if (expr.type !== "CallExpression") return null;
  const c = expr.callee;
  if (c.type === "Identifier") return c.name;
  if (c.type === "MemberExpression" && !c.computed && c.property.type === "Identifier") {
    return c.property.name;
  }
  return null;
}

function isDescribeCall(expr) {
  const name = callBaseName(expr);
  if (name === "describe") return true;
  if (expr.type === "CallExpression" && expr.callee.type === "MemberExpression") {
    const obj = expr.callee.object;
    if (obj.type === "Identifier" && obj.name === "describe") return true;
  }
  return false;
}

function calleeRootName(expr) {
  if (expr.type !== "CallExpression") return null;
  const c = expr.callee;
  if (c.type === "Identifier") return c.name;
  if (c.type === "MemberExpression" && c.object.type === "Identifier") {
    return c.object.name;
  }
  return null;
}

function isVitestHookStatement(stmt) {
  if (stmt.type !== "ExpressionStatement") return false;
  const root = calleeRootName(stmt.expression);
  return root && HOOK_NAMES.has(root);
}

function isItStatement(stmt) {
  if (stmt.type !== "ExpressionStatement") return false;
  const root = calleeRootName(stmt.expression);
  return root && IT_NAMES.has(root);
}

function isDescribeStatement(stmt) {
  return stmt.type === "ExpressionStatement" && isDescribeCall(stmt.expression);
}

/** beforeEach in this suite block, excluding nested describe(...) subtrees */
function suiteBlockHasBeforeEach(block) {
  if (!block || block.type !== "BlockStatement") return false;

  for (const stmt of block.body) {
    if (stmt.type === "ExpressionStatement") {
      if (isDescribeCall(stmt.expression)) continue;
      if (calleeRootName(stmt.expression) === "beforeEach") return true;
    }
    if (stmt.type === "BlockStatement" && suiteBlockHasBeforeEach(stmt)) return true;
    if (stmt.type === "IfStatement") {
      if (stmt.consequent.type === "BlockStatement" && suiteBlockHasBeforeEach(stmt.consequent)) return true;
      if (stmt.alternate && stmt.alternate.type === "BlockStatement" && suiteBlockHasBeforeEach(stmt.alternate)) {
        return true;
      }
    }
  }
  return false;
}

function reportForbiddenInRootDescribe(context, stmt) {
  if (isVitestHookStatement(stmt)) {
    context.report({
      node: stmt,
      message: `Maddox module specs: the outer \`describe\` must not use \`beforeEach\` / \`afterEach\` / \`beforeAll\` / \`afterAll\`. Move hooks into each inner \`describe\`.\n\nIntent: Enforce two-level describe nesting for module Maddox specs: no hooks/tests on the outer describe; every inner describe has beforeEach. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-describe-structure.md`,
    });
    return;
  }
  if (isItStatement(stmt)) {
    context.report({
      node: stmt,
      message: `Maddox module specs: tests must live inside the inner \`describe\` (two-level \`describe\` nesting). Move this \`it\`/\`test\` into a nested suite.\n\nIntent: Enforce two-level describe nesting for module Maddox specs: no hooks/tests on the outer describe; every inner describe has beforeEach. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-describe-structure.md`,
    });
  }
}

function validateRootDescribe(context, describeNode) {
  const block = getDescribeBodyBlock(describeNode);
  if (!block) return;

  let innerDescribeCount = 0;
  for (const stmt of block.body) {
    if (isDescribeStatement(stmt)) {
      innerDescribeCount++;
      continue;
    }
    reportForbiddenInRootDescribe(context, stmt);
  }

  if (innerDescribeCount === 0) {
    context.report({
      node: describeNode,
      message: `Maddox module specs: add at least one inner \`describe\` (e.g. \`calling runMethod, it\`) under the outer \`Given the … module, when\` block.\n\nIntent: Enforce two-level describe nesting for module Maddox specs: no hooks/tests on the outer describe; every inner describe has beforeEach. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-describe-structure.md`,
    });
  }
}

function validateInnerDescribe(context, describeNode) {
  const block = getDescribeBodyBlock(describeNode);
  if (!block) return;
  if (!suiteBlockHasBeforeEach(block)) {
    context.report({
      node: describeNode,
      message: `Maddox module specs: each inner \`describe\` must define a \`beforeEach\` (shared context reset and \`context.setup…\` attachments).\n\nIntent: Enforce two-level describe nesting for module Maddox specs: no hooks/tests on the outer describe; every inner describe has beforeEach. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-module-describe-structure.md`,
    });
  }
}

function isDescribeCallNode(node) {
  if (node.type !== "CallExpression") return false;
  const c = node.callee;
  if (c.type === "Identifier" && c.name === "describe") return true;
  if (c.type === "MemberExpression" && c.object.type === "Identifier" && c.object.name === "describe") {
    return true;
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce two-level describe nesting for module Maddox specs: no hooks/tests on the outer describe; every inner describe has beforeEach. See \`.cursor/rules/maddox-module-scenario-tests.mdc\` and \`maddox-scenario-tests.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-module-describe-structure.md",
    },
  },
  create(context) {
    let usesMaddox = false;
    const describeStack = [];

    return {
      ImportDeclaration(node) {
        if (node.source.value === "maddox") {
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
            init.arguments[0] &&
            init.arguments[0].value === "maddox"
          ) {
            usesMaddox = true;
          }
        }
      },
      CallExpression(node) {
        if (!usesMaddox || !isDescribeCallNode(node)) return;
        describeStack.push(node);
      },
      "CallExpression:exit"(node) {
        if (!usesMaddox || !isDescribeCallNode(node)) return;
        if (describeStack.length === 0 || describeStack[describeStack.length - 1] !== node) {
          return;
        }
        const depth = describeStack.length - 1;
        describeStack.pop();

        if (depth === 0) {
          validateRootDescribe(context, node);
        } else if (depth === 1) {
          validateInnerDescribe(context, node);
        }
      },
    };
  },
};
