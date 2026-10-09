/**
 * @agent-dossier
 * @purpose Fail when a Step loop calls a same-file function or private method instead of *Module.method.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Keep detection to same-file callees; imported Steps/Modules stay legal.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-step-loop-internal-function";
const ARRAY_ITERATORS = new Set([
  "forEach",
  "map",
  "filter",
  "reduce",
  "some",
  "every",
  "flatMap",
]);

function getExportedClassNames(program) {
  const names = new Set();
  for (const stmt of program.body) {
    if (stmt.type === "ClassDeclaration" && stmt.id?.type === "Identifier") {
      names.add(stmt.id.name);
    }
    if (stmt.type === "ExportDefaultDeclaration") {
      const decl = stmt.declaration;
      if (decl?.type === "ClassDeclaration" && decl.id?.type === "Identifier") {
        names.add(decl.id.name);
      }
      if (decl?.type === "Identifier") names.add(decl.name);
    }
  }
  return names;
}

function collectInternalNames(program) {
  const names = new Set();

  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "FunctionDeclaration" && node.id?.type === "Identifier") {
      names.add(node.id.name);
    }
    if (
      (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression")
      && node.parent?.type === "VariableDeclarator"
      && node.parent.id?.type === "Identifier"
    ) {
      names.add(node.parent.id.name);
    }
    if (
      node.type === "MethodDefinition"
      && node.key?.type === "Identifier"
    ) {
      names.add(node.key.name);
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else visit(child);
    }
  }

  visit(program);
  return names;
}

function isOrchestrationCallee(callee) {
  if (!callee || callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.property.type !== "Identifier") return false;
  const method = callee.property.name;
  if (method === "accept" || method === "acceptAll") return true;
  if (callee.object.type === "Identifier" && /Module$/.test(callee.object.name)) return true;
  return false;
}

function isInternalMember(node, classNames, internalNames) {
  if (node.type !== "MemberExpression" || node.computed) return false;
  if (node.property.type !== "Identifier") return false;
  if (!internalNames.has(node.property.name)) return false;
  if (node.object.type === "ThisExpression") return true;
  return node.object.type === "Identifier" && classNames.has(node.object.name);
}

function isInternalRef(node, classNames, internalNames) {
  if (!node) return false;
  if (node.type === "Identifier" && internalNames.has(node.name)) return true;
  return isInternalMember(node, classNames, internalNames);
}

function isInternalCall(node, classNames, internalNames) {
  if (node.type !== "CallExpression") return false;
  if (isOrchestrationCallee(node.callee)) return false;
  return isInternalRef(node.callee, classNames, internalNames);
}

function isArrayIteratorCall(node) {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.property.type !== "Identifier") return false;
  return ARRAY_ITERATORS.has(callee.property.name);
}

function iteratorCallbackBody(callNode) {
  const arg = callNode.arguments[0];
  if (!arg) return null;
  if (arg.type === "FunctionExpression" || arg.type === "ArrowFunctionExpression") {
    return arg.body;
  }
  return null;
}

function bodyContainsInternalCall(body, classNames, internalNames, skipFn) {
  let found = false;

  function visit(node) {
    if (found || !node || typeof node !== "object") return;
    if (
      node.type === "FunctionExpression"
      || node.type === "ArrowFunctionExpression"
      || node.type === "FunctionDeclaration"
    ) {
      if (node !== skipFn) return;
    }
    if (isInternalCall(node, classNames, internalNames)) {
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

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Fail when a Step loop calls a same-file function. Loop *Module.method, or inline into next. " +
        "See `.cursor/rules/steps-pattern/backend-modules.mdc`.",
      url: "steps-pattern/docs/llm/rules/enforce-no-step-loop-internal-function.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.includes("/steps/")) return {};

    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const classNames = getExportedClassNames(sourceCode.ast);
    const internalNames = collectInternalNames(sourceCode.ast);

    function report(node) {
      context.report({
        node,
        message: withLintDocs(
          RULE,
          `Architectural Violation: A Step must not loop a same-file function. ` +
            `Loop \`*Module.method\`, or inline the work into \`next\`.\n\n` +
            `Intent: Per-item sequences belong on a Module; single-concern work belongs in next. ` +
            `See \`.cursor/rules/steps-pattern/backend-modules.mdc\`.`,
        ),
      });
    }

    function checkLoopStatement(node) {
      if (bodyContainsInternalCall(node.body, classNames, internalNames, null)) {
        report(node);
      }
    }

    function checkIteratorCall(node) {
      if (!isArrayIteratorCall(node)) return;
      const arg = node.arguments[0];
      if (isInternalRef(arg, classNames, internalNames)) {
        report(node);
        return;
      }
      const callback = (arg?.type === "FunctionExpression" || arg?.type === "ArrowFunctionExpression")
        ? arg
        : null;
      const body = iteratorCallbackBody(node);
      if (body && bodyContainsInternalCall(body, classNames, internalNames, callback)) {
        report(node);
      }
    }

    return {
      ForOfStatement: checkLoopStatement,
      ForInStatement: checkLoopStatement,
      ForStatement: checkLoopStatement,
      WhileStatement: checkLoopStatement,
      DoWhileStatement: checkLoopStatement,
      CallExpression: checkIteratorCall,
    };
  },
};
