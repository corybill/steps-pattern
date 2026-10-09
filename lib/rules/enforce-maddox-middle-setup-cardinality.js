/**
 * Each `shouldBeCalledWith` / `shouldBeCalledWithSubset` in a Scenario chain is one outbound
 * call assertion; `beforeEach` must expose that many middle setup helpers (plus setupValues,
 * setupInputParams, setupResponse). Count is the maximum across `it` blocks that contain
 * `new Scenario` (same mock may appear multiple times — e.g. two HttpProxy.get calls ⇒ two
 * helpers).
 *
 * See `.cursor/rules/maddox-scenario-tests.mdc` and sync controller specs.
 */

import {
  collectContextSetupAssignmentData,
  getBeforeEachBodyBlock,
  resolveDelegatedSetupBlock,
} from "./maddox-before-each-shared.js";

const SPECIAL_SETUPS = new Set(["setupValues", "setupInputParams", "setupResponse"]);

const ASSERTION_CHAIN_METHODS = new Set([
  "shouldBeCalledWith",
  "shouldBeCalledWithSubset",
]);

function usesMaddoxImport(programNode) {
  if (!programNode?.body) return false;
  for (const stmt of programNode.body) {
    if (stmt.type === "ImportDeclaration" && stmt.source.value === "maddox") return true;
    if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        const init = decl.init;
        if (
          init?.type === "CallExpression" &&
          init.callee?.name === "require" &&
          init.arguments[0]?.value === "maddox"
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function functionContainsNewScenario(fnNode) {
  if (!fnNode) return false;
  let found = false;
  function walk(n) {
    if (!n || typeof n !== "object" || found) return;
    if (
      n.type === "NewExpression" &&
      n.callee?.type === "Identifier" &&
      n.callee.name === "Scenario"
    ) {
      found = true;
      return;
    }
    for (const key of Object.keys(n)) {
      if (key === "parent") continue;
      const v = n[key];
      if (Array.isArray(v)) v.forEach(walk);
      else walk(v);
    }
  }
  walk(fnNode);
  return found;
}

/** Count Scenario assertion starters (each pairs with doesReturn/doesError in Maddox chains). */
function countShouldBeCalledAssertionsInNode(root) {
  let count = 0;
  function visit(n) {
    if (!n || typeof n !== "object") return;
    if (
      n.type === "CallExpression" &&
      n.callee?.type === "MemberExpression" &&
      !n.callee.computed &&
      n.callee.property?.type === "Identifier" &&
      ASSERTION_CHAIN_METHODS.has(n.callee.property.name)
    ) {
      count += 1;
    }
    for (const key of Object.keys(n)) {
      if (key === "parent") continue;
      const v = n[key];
      if (Array.isArray(v)) v.forEach(visit);
      else visit(v);
    }
  }
  visit(root);
  return count;
}

function analyzeDescribeCallback(describeCall, programNode, context) {
  const cb = describeCall.arguments[1];
  if (!cb || cb.body?.type !== "BlockStatement") return;

  const body = cb.body.body;

  let beforeEachNode = null;
  const itNodes = [];

  for (const stmt of body) {
    if (stmt.type !== "ExpressionStatement") continue;
    const ex = stmt.expression;
    if (ex.type !== "CallExpression") continue;
    const callee = ex.callee;
    const name = callee.type === "Identifier" ? callee.name : null;
    if (name === "beforeEach") beforeEachNode = ex;
    else if (name === "it") itNodes.push(ex);
  }

  if (!beforeEachNode || itNodes.length === 0) return;

  const anyScenario = itNodes.some((it) => {
    const testFn = it.arguments[1];
    return testFn && functionContainsNewScenario(testFn);
  });
  if (!anyScenario) return;

  let expectedMiddle = 0;
  for (const it of itNodes) {
    const testFn = it.arguments[1];
    if (!testFn || !functionContainsNewScenario(testFn)) continue;
    expectedMiddle = Math.max(
      expectedMiddle,
      countShouldBeCalledAssertionsInNode(testFn),
    );
  }

  const beBlock = getBeforeEachBodyBlock(beforeEachNode);
  if (!beBlock) return;

  const delegated = resolveDelegatedSetupBlock(programNode, beBlock);
  const entries = collectContextSetupAssignmentData(delegated || beBlock);
  const middle = entries.filter((e) => !SPECIAL_SETUPS.has(e.name));

  if (middle.length !== expectedMiddle) {
    const explain =
      expectedMiddle === 0
        ? "(no shouldBeCalledWith / shouldBeCalledWithSubset in any Scenario)"
        : `max ${expectedMiddle} shouldBeCalledWith / shouldBeCalledWithSubset per \`it\` with Scenario`;
    context.report({
      node: beforeEachNode,
      message: `Maddox beforeEach: expected exactly ${expectedMiddle} middle setup helper(s) (${explain}), plus setupValues, setupInputParams, and setupResponse (3 + ${expectedMiddle} total setup assignments). Found ${middle.length} middle helper(s): ${middle.map((m) => m.name).join(", ") || "none"}. Define one context.setup… per Scenario assertion chain entry.\n\nIntent: Require one context.setup* helper per shouldBeCalledWith / shouldBeCalledWithSubset in Scenario chains (max count across it blocks), plus setupValues, setupInputParams, setupResponse.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-middle-setup-cardinality.md`,
    });
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require one context.setup* helper per shouldBeCalledWith / shouldBeCalledWithSubset in Scenario chains (max count across it blocks), plus setupValues, setupInputParams, setupResponse.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-middle-setup-cardinality.md",
    },
  },
  create(context) {
    let programNode = null;
    let usesMaddox = false;

    return {
      Program(node) {
        programNode = node;
        usesMaddox = usesMaddoxImport(node);
      },
      CallExpression(node) {
        if (!usesMaddox || !programNode) return;
        if (node.callee?.type !== "Identifier" || node.callee.name !== "describe") return;
        if (node.arguments.length < 2) return;
        analyzeDescribeCallback(node, programNode, context);
      },
    };
  },
};
