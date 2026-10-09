/**
 * Enforces declaration order of context.setup* assignments inside beforeEach (or delegated factory)
 * for Maddox *Scenario* specs. Specs that only use Maddox.compare are out of scope.
 * Every Scenario suite must declare setupValues, setupInputParams, and setupResponse.
 * See `.cursor/rules/maddox-scenario-tests.mdc`.
 */

import {
  collectContextSetupAssignmentData,
  getBeforeEachBodyBlock,
  programUsesMaddoxScenario,
  resolveDelegatedSetupBlock,
} from "./maddox-before-each-shared.js";

function validateSequence(ctx, entries, reportNode) {
  const names = entries.map(e => e.name);

  if (names.length === 0) {
    ctx.report({
      node: reportNode,
      message: `Maddox beforeEach: declare context.setupValues, context.setupInputParams, and context.setupResponse (top-level assignments), or build them in a file-scope factory called from beforeEach. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\n\nIntent: Require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md`,
    });
    return;
  }

  const hasValues = names.includes("setupValues");
  const hasInput = names.includes("setupInputParams");
  const hasResponse = names.includes("setupResponse");

  if (!hasValues || !hasInput || !hasResponse) {
    const missing = ["setupValues", "setupInputParams", "setupResponse"].filter(
      n => !names.includes(n),
    );
    ctx.report({
      node: entries[0].propertyNode,
      message: `Maddox beforeEach: missing required context helper(s): ${missing.join(", ")}. All three are required.\n\nIntent: Require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md`,
    });
  }

  if (names[0] !== "setupValues") {
    ctx.report({
      node: entries[0].propertyNode,
      message: `Maddox beforeEach: context.setupValues must be the first context.setup… assignment (fixture data before entry-point args).\n\nIntent: Require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md`,
    });
  }

  const idxInput = names.indexOf("setupInputParams");
  if (idxInput !== -1 && idxInput !== 1) {
    ctx.report({
      node: entries[idxInput].propertyNode,
      message: `Maddox beforeEach: context.setupInputParams must be the second context.setup… assignment (immediately after context.setupValues).\n\nIntent: Require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md`,
    });
  }

  const idxResponse = names.indexOf("setupResponse");
  if (idxResponse !== -1 && idxResponse !== names.length - 1) {
    ctx.report({
      node: entries[idxResponse].propertyNode,
      message: `Maddox beforeEach: context.setupResponse must be the last context.setup… assignment (expected entry-point success shape after per-mock helpers).\n\nIntent: Require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md`,
    });
  }

  const specials = new Set(["setupValues", "setupInputParams", "setupResponse"]);
  const firstMiddleIdx = names.findIndex(n => !specials.has(n));
  if (firstMiddleIdx === -1) return;

  const boundary = 2;
  if (firstMiddleIdx < boundary) {
    ctx.report({
      node: entries[firstMiddleIdx].propertyNode,
      message: `Maddox beforeEach: per-mock helpers (context.setupGet… / context.setupSave…, etc.) must come after context.setupInputParams.\n\nIntent: Require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md`,
    });
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "For Maddox Scenario specs only: require setupValues, setupInputParams, and setupResponse in beforeEach (or delegated factory), in canonical order. Specs that only use Maddox.compare are skipped. See \`.cursor/rules/maddox-scenario-tests.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-before-each-setup-order.md",
    },
  },
  create(context) {
    let usesMaddox = false;
    let usesScenario = false;
    let programNode = null;

    return {
      Program(node) {
        programNode = node;
        usesScenario = programUsesMaddoxScenario(node);
      },
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
        if (!usesMaddox || !usesScenario || !programNode) return;
        const block = getBeforeEachBodyBlock(node);
        if (!block) return;

        const delegated = resolveDelegatedSetupBlock(programNode, block);
        const entries = delegated
          ? collectContextSetupAssignmentData(delegated)
          : collectContextSetupAssignmentData(block);

        const reportNode = entries[0]?.propertyNode ?? node;
        validateSequence(context, entries, reportNode);
      },
    };
  },
};
