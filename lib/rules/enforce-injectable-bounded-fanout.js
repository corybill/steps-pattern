/**
 * @agent-dossier
 * @purpose Fail when outbound fan-out `for` loops use a hard-coded numeric iteration bound.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Keep detection to ForStatement + proxy-like calls; Array.from({ length: N }) deferred.
 */
import { normalizePath } from "./maddox-before-each-shared.js";

const COMPARE_OPS = new Set(["<", "<=", ">", ">="]);
/** Bounds 1–3 are trivial; flag only hard-coded N above 3 (N >= 4). */
const HARD_CODED_BOUND_MIN = 4;

function isProxyImportSource(source) {
  if (typeof source !== "string") return false;
  const normalized = source.replace(/\\/g, "/");
  return normalized.includes("/proxies/") || /(?:^|\/)[^/]+-proxy(?:\.[^/]+)?$/.test(normalized);
}

function getImportedProxyNames(program) {
  const names = setWithHttpProxyDefault();
  for (const stmt of program.body) {
    if (stmt.type !== "ImportDeclaration") continue;
    if (!isProxyImportSource(stmt.source.value)) continue;
    for (const spec of stmt.specifiers || []) {
      if (
        spec.type === "ImportDefaultSpecifier" ||
        spec.type === "ImportSpecifier" ||
        spec.type === "ImportNamespaceSpecifier"
      ) {
        names.add(spec.local.name);
      }
    }
  }
  return names;
}

function setWithHttpProxyDefault() {
  return new Set(["HttpProxy"]);
}

function collectModuleConstInits(program) {
  /** @type {Map<string, import('estree').Node>} */
  const inits = new Map();
  for (const stmt of program.body) {
    if (stmt.type !== "VariableDeclaration" || stmt.kind !== "const") continue;
    for (const decl of stmt.declarations) {
      if (decl.id?.type === "Identifier" && decl.init) {
        inits.set(decl.id.name, decl.init);
      }
    }
  }
  return inits;
}

function getLoopBoundExpression(forNode) {
  const test = forNode.test;
  if (!test || test.type !== "BinaryExpression") return null;
  if (!COMPARE_OPS.has(test.operator)) return null;
  if (test.operator === "<" || test.operator === "<=") return test.right;
  return test.left;
}

function isNumericLiteral(node) {
  return node?.type === "Literal" && typeof node.value === "number";
}

function numericLiteralValue(node) {
  if (isNumericLiteral(node)) return node.value;
  if (node?.type === "UnaryExpression" && node.operator === "-" && isNumericLiteral(node.argument)) {
    return -node.argument.value;
  }
  return null;
}

function isHardCodedBoundAboveThreshold(node) {
  const value = numericLiteralValue(node);
  return value != null && value >= HARD_CODED_BOUND_MIN;
}

function initIsInjectable(init) {
  if (!init) return false;
  if (init.type === "CallExpression") return true;
  if (init.type === "MemberExpression") return true;
  if (init.type === "UnaryExpression") return initIsInjectable(init.argument);
  if (init.type === "LogicalExpression" || init.type === "BinaryExpression") {
    return initIsInjectable(init.left) || initIsInjectable(init.right);
  }
  if (init.type === "ConditionalExpression") {
    return (
      initIsInjectable(init.test) ||
      initIsInjectable(init.consequent) ||
      initIsInjectable(init.alternate)
    );
  }
  return false;
}

function isHardCodedBound(bound, constInits) {
  if (!bound) return false;
  if (isHardCodedBoundAboveThreshold(bound)) return true;
  if (bound.type === "Identifier") {
    const init = constInits.get(bound.name);
    if (!init) return false;
    if (isHardCodedBoundAboveThreshold(init)) return true;
    if (initIsInjectable(init)) return false;
    return false;
  }
  return false;
}

function isOutboundLikeCall(node, proxyNames) {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.object.type !== "Identifier") return false;
  const objectName = callee.object.name;
  if (proxyNames.has(objectName)) return true;
  return /Proxy$/.test(objectName);
}

function forBodyHasOutbound(forNode, proxyNames) {
  let found = false;

  function visit(node) {
    if (found || !node || typeof node !== "object") return;
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "FunctionExpression" ||
      node.type === "ArrowFunctionExpression"
    ) {
      // Still search callbacks inside the loop (e.g. .then(() => HttpProxy.get)).
    }
    if (isOutboundLikeCall(node, proxyNames)) {
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

  visit(forNode.body);
  return found;
}

function isTargetFilename(filename) {
  return (
    filename.includes("/proxies/") ||
    filename.includes("/steps/") ||
    filename.includes("/modules/") ||
    filename.includes("/services/")
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require injectable (Global/config) bounds for outbound fan-out for-loops; forbid hard-coded numeric N.",
      url: "steps-pattern/docs/llm/rules/enforce-injectable-bounded-fanout.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isTargetFilename(filename)) return {};

    const sourceCode = context.getSourceCode();
    const program = sourceCode.ast;
    const proxyNames = getImportedProxyNames(program);
    const constInits = collectModuleConstInits(program);

    return {
      ForStatement(node) {
        const bound = getLoopBoundExpression(node);
        if (!isHardCodedBound(bound, constInits)) return;
        if (!forBodyHasOutbound(node, proxyNames)) return;

        context.report({
          node: bound,
          message:
            "Architectural Violation: Outbound fan-out for-loops must not use a hard-coded numeric iteration bound " +
            "(literal or module `const N = <number>` with N >= 4). Read the bound from Global/config (e.g. Global.getPartnerPageLimit()) " +
            "so Maddox can inject a small N and assert call cardinality. Bounds 1–3 are allowed as trivial.\n\n" +
            "Intent: Injectable bounded fan-out for proxy/step/module outbound loops.\n" +
            "Link: steps-pattern/docs/llm/rules/enforce-injectable-bounded-fanout.md",
        });
      },
    };
  },
};
