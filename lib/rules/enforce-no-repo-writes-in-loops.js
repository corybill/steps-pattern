/**
 * @agent-dossier
 * @purpose Fail when Steps or Strategies perform repository writes inside any loop (including same-file helpers called from loops).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Keep write detection name-based; do not expand into N+1 read detection.
 * - Repository parameterized-SQL contract lives in backend-repositories.mdc (this rule cannot parse SQL).
 */
import { normalizePath } from "./maddox-before-each-shared.js";

const WRITE_METHOD_RE = /^(upsert|insert|update|delete|create|save|replace|write|remove)/i;
const ARRAY_ITERATORS = new Set([
  "forEach",
  "map",
  "filter",
  "reduce",
  "some",
  "every",
  "flatMap",
]);
function isRepoImportSource(source) {
  if (typeof source !== "string") return false;
  const normalized = source.replace(/\\/g, "/");
  return normalized.includes("/repositories/") || /(?:^|\/)[^/]+-repo(?:\.[^/]+)?$/.test(normalized);
}

function getImportedRepoNames(program) {
  const names = new Set();
  for (const stmt of program.body) {
    if (stmt.type !== "ImportDeclaration") continue;
    if (!isRepoImportSource(stmt.source.value)) continue;
    for (const spec of stmt.specifiers || []) {
      if (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportSpecifier" || spec.type === "ImportNamespaceSpecifier") {
        names.add(spec.local.name);
      }
    }
  }
  return names;
}

function getCalleeMethodName(node) {
  if (node.type !== "CallExpression") return null;
  const callee = node.callee;
  if (callee.type === "MemberExpression" && !callee.computed && callee.property.type === "Identifier") {
    return callee.property.name;
  }
  return null;
}

function getCalleeObjectName(node) {
  if (node.type !== "CallExpression") return null;
  const callee = node.callee;
  if (callee.type === "MemberExpression" && callee.object.type === "Identifier") {
    return callee.object.name;
  }
  return null;
}

function isRepoWriteCall(node, repoNames) {
  const objectName = getCalleeObjectName(node);
  const methodName = getCalleeMethodName(node);
  if (!objectName || !methodName) return false;
  if (!repoNames.has(objectName)) return false;
  return WRITE_METHOD_RE.test(methodName);
}

function isLoopStatement(node) {
  return (
    node.type === "ForStatement" ||
    node.type === "ForOfStatement" ||
    node.type === "ForInStatement" ||
    node.type === "WhileStatement" ||
    node.type === "DoWhileStatement"
  );
}

function isArrayIteratorCall(node) {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.property.type !== "Identifier") return false;
  return ARRAY_ITERATORS.has(callee.property.name);
}

function getFunctionName(node) {
  if (!node) return null;
  if (node.type === "FunctionDeclaration" && node.id?.type === "Identifier") {
    return node.id.name;
  }
  if (
    (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") &&
    node.parent?.type === "VariableDeclarator" &&
    node.parent.id?.type === "Identifier"
  ) {
    return node.parent.id.name;
  }
  if (
    node.type === "FunctionExpression" &&
    node.parent?.type === "MethodDefinition" &&
    node.parent.key?.type === "Identifier"
  ) {
    return node.parent.key.name;
  }
  return null;
}

function collectSameFileFunctions(program) {
  /** @type {Map<string, import('estree').Node>} */
  const functions = new Map();

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      const name = getFunctionName(node);
      if (name) functions.set(name, node);
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }

  visit(program);
  return functions;
}

function collectDirectCalleeNames(fnNode) {
  const names = new Set();
  const body = fnNode.body;
  if (!body) return names;

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      if (node !== fnNode) return;
    }
    if (node.type === "CallExpression" && node.callee.type === "Identifier") {
      names.add(node.callee.name);
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }

  visit(body);
  return names;
}

function buildWritersViaHelpers(functions, repoNames) {
  /** @type {Map<string, boolean>} */
  const writesDirectly = new Map();
  for (const [name, fnNode] of functions.entries()) {
    writesDirectly.set(name, functionContainsRepoWrite(fnNode, repoNames));
  }

  /** @type {Map<string, Set<string>>} */
  const callees = new Map();
  for (const [name, fnNode] of functions.entries()) {
    callees.set(name, collectDirectCalleeNames(fnNode));
  }

  /** @type {Map<string, boolean>} */
  const writesTransitively = new Map(writesDirectly);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, calleeSet] of callees.entries()) {
      if (writesTransitively.get(name)) continue;
      for (const callee of calleeSet) {
        if (writesTransitively.get(callee)) {
          writesTransitively.set(name, true);
          changed = true;
          break;
        }
      }
    }
  }
  return writesTransitively;
}

function functionContainsRepoWrite(fnNode, repoNames) {
  const body = fnNode.body;
  if (!body) return false;
  let found = false;

  function visit(node) {
    if (found || !node || typeof node !== "object") return;
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      if (node !== fnNode) return;
    }
    if (isRepoWriteCall(node, repoNames)) {
      found = true;
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }

  visit(body);
  return found;
}

function isInsideLoopContext(node) {
  let parent = node.parent;
  while (parent) {
    if (isLoopStatement(parent)) return true;

    if (
      (parent.type === "FunctionExpression" || parent.type === "ArrowFunctionExpression") &&
      parent.parent?.type === "CallExpression"
    ) {
      const call = parent.parent;
      // Promise.all(items.map(...)) is covered by the map iterator callback.
      if (isArrayIteratorCall(call)) return true;
    }

    // Stop at enclosing named function / method — caller graph handles those.
    if (
      parent.type === "FunctionDeclaration" ||
      parent.type === "FunctionExpression" ||
      parent.type === "ArrowFunctionExpression"
    ) {
      const name = getFunctionName(parent);
      if (name) return false;
    }

    parent = parent.parent;
  }
  return false;
}

function reportWrite(context, node, methodName) {
  context.report({
    node,
    message:
      `Architectural Violation: Repository write '${methodName}' must not run inside a loop ` +
      `(for/while/map/forEach/Promise.all, or a same-file helper called from a loop). ` +
      `Collect rows in memory, then call one bulk repository method outside the loop.\n\n` +
      `Intent: Ban N+1 repository writes in Steps/Strategies. Collect rows, then one bulk repo method ` +
      `implemented as parameterized SQL (unnest/$1 binds), not a Prisma upsert loop.\n` +
      `Link: steps-pattern/docs/llm/rules/enforce-no-repo-writes-in-loops.md`,
  });
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid repository write calls inside loops in Steps and Strategies. Collect-then-bulk; repo must use parameterized SQL, not a Prisma upsert loop.",
      url: "steps-pattern/docs/llm/rules/enforce-no-repo-writes-in-loops.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isTarget =
      filename.includes("/steps/") || filename.includes("/strategies/");
    if (!isTarget) return {};

    const sourceCode = context.getSourceCode();
    const program = sourceCode.ast;
    const repoNames = getImportedRepoNames(program);
    if (repoNames.size === 0) return {};

    const functions = collectSameFileFunctions(program);
    const writersViaHelpers = buildWritersViaHelpers(functions, repoNames);

    /** @type {Set<import('estree').Node>} */
    const reported = new Set();

    function maybeReport(node) {
      if (reported.has(node)) return;
      reported.add(node);
      reportWrite(context, node, getCalleeMethodName(node) || "write");
    }

    function checkCallExpression(node) {
      if (isRepoWriteCall(node, repoNames) && isInsideLoopContext(node)) {
        maybeReport(node);
        return;
      }

      // Same-file helper invoked from a loop: helper transitively writes.
      if (
        node.callee.type === "Identifier" &&
        writersViaHelpers.get(node.callee.name) &&
        isInsideLoopContext(node)
      ) {
        if (reported.has(node)) return;
        reported.add(node);
        context.report({
          node,
          message:
            `Architectural Violation: '${node.callee.name}' performs a repository write and is called from a loop. ` +
            `Collect rows in memory, then call one bulk repository method outside the loop.\n\n` +
            `Intent: Ban N+1 repository writes in Steps/Strategies. Collect rows, then one bulk repo method ` +
            `implemented as parameterized SQL (unnest/$1 binds), not a Prisma upsert loop.\n` +
            `Link: steps-pattern/docs/llm/rules/enforce-no-repo-writes-in-loops.md`,
        });
      }
    }

    return {
      CallExpression: checkCallExpression,
    };
  },
};
