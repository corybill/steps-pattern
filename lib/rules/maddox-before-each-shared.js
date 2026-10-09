import * as espree from "espree";

/**
 * Shared helpers for Maddox beforeEach ESLint rules.
 */

export function isBeforeEachCall(node) {
  if (node.type !== "CallExpression") return false;
  const c = node.callee;
  if (c.type === "Identifier" && c.name === "beforeEach") return true;
  if (c.type === "MemberExpression" && c.object.type === "Identifier" && c.object.name === "beforeEach") {
    return true;
  }
  return false;
}

export function getBeforeEachBodyBlock(node) {
  if (!isBeforeEachCall(node)) return null;
  const fn = node.arguments[0];
  if (!fn || (fn.type !== "FunctionExpression" && fn.type !== "ArrowFunctionExpression")) return null;
  const body = fn.body;
  if (body.type === "BlockStatement") return body;
  return null;
}

export function getFunctionBodyBlockFromDeclaration(node) {
  if (!node) return null;
  if (node.type === "FunctionDeclaration") {
    const body = node.body;
    return body.type === "BlockStatement" ? body : null;
  }
  if (node.type === "VariableDeclarator" && node.id.type === "Identifier") {
    const init = node.init;
    if (!init) return null;
    if (init.type === "FunctionExpression" || init.type === "ArrowFunctionExpression") {
      const body = init.body;
      return body.type === "BlockStatement" ? body : null;
    }
  }
  return null;
}

/** Resolve `async function name` or `const name = async () =>` in program body */
export function findNamedFunctionBlock(program, name) {
  for (const stmt of program.body) {
    if (stmt.type === "FunctionDeclaration" && stmt.id && stmt.id.name === name) {
      return getFunctionBodyBlockFromDeclaration(stmt);
    }
    if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        if (decl.id.type === "Identifier" && decl.id.name === name) {
          const b = getFunctionBodyBlockFromDeclaration(decl);
          if (b) return b;
        }
      }
    }
  }
  return null;
}

/**
 * If beforeEach only assigns context from `await Foo()`, return Foo's body block.
 */
export function resolveDelegatedSetupBlock(program, beforeEachBlock) {
  if (!beforeEachBlock || beforeEachBlock.type !== "BlockStatement") return null;

  for (const stmt of beforeEachBlock.body) {
    if (stmt.type !== "ExpressionStatement") continue;
    const ex = stmt.expression;
    if (ex.type !== "AssignmentExpression") continue;
    const left = ex.left;
    if (left.type !== "Identifier" || left.name !== "context") continue;

    let right = ex.right;
    if (right.type === "AwaitExpression") {
      right = right.argument;
    }
    if (right.type !== "CallExpression") continue;
    if (right.callee.type !== "Identifier") continue;
    const factoryName = right.callee.name;
    return findNamedFunctionBlock(program, factoryName);
  }
  return null;
}

/** Top-level ExpressionStatements only: context.setupFoo = … */
export function collectContextSetupAssignmentData(block) {
  const out = [];
  if (!block || block.type !== "BlockStatement") return out;

  for (const stmt of block.body) {
    if (stmt.type !== "ExpressionStatement") continue;
    const expr = stmt.expression;
    if (expr.type !== "AssignmentExpression") continue;
    const left = expr.left;
    if (
      left.type !== "MemberExpression" ||
      left.computed ||
      left.object.type !== "Identifier" ||
      left.object.name !== "context" ||
      left.property.type !== "Identifier" ||
      !left.property.name.startsWith("setup")
    ) {
      continue;
    }
    out.push({
      name: left.property.name,
      propertyNode: left.property,
      assignmentNode: expr,
    });
  }
  return out;
}

export function normalizePath(filepath) {
  if (typeof filepath !== "string") return "";
  let normalized = filepath.replace(/\\/g, "/");
  // Remove Windows drive letters (e.g., C:)
  normalized = normalized.replace(/^[a-zA-Z]:/, "");
  return normalized;
}

const SCENARIO_CALLEE_NAMES = new Set([
  "Scenario",
  "FromPromiseScenario",
  "RemixScenario",
  "FrameworkRouteScenario",
  "ReactRouterFrameworkScenario",
]);

/**
 * True when the file constructs a Maddox Scenario (FromPromise / Remix / Framework).
 * Specs that only import Maddox for `Maddox.compare` return false.
 * @param {import('estree').Program | null | undefined} programNode
 * @returns {boolean}
 */
export function programUsesMaddoxScenario(programNode) {
  if (!programNode) return false;
  let found = false;
  traverseAST(programNode, {
    NewExpression(node) {
      if (found) return;
      const callee = node.callee;
      if (callee?.type === "Identifier" && SCENARIO_CALLEE_NAMES.has(callee.name)) {
        found = true;
        return;
      }
      if (
        callee?.type === "MemberExpression" &&
        !callee.computed &&
        callee.property?.type === "Identifier" &&
        SCENARIO_CALLEE_NAMES.has(callee.property.name)
      ) {
        found = true;
      }
    },
  });
  return found;
}

export function parseSpecToAST(content) {
  try {
    return espree.parse(content, {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true }
    });
  } catch {
    return null;
  }
}

export function traverseAST(node, visitors) {
  if (!node || typeof node !== "object") return;
  if (node.type && visitors[node.type]) {
    visitors[node.type](node);
  }
  for (const key in node) {
    if (key === "parent") continue;
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => traverseAST(item, visitors));
      } else if (child && typeof child === "object" && typeof child.type === "string") {
        traverseAST(child, visitors);
      }
    }
  }
}

