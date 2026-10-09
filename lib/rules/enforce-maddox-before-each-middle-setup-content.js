/**
 * Warn when a *middle* context.setup* helper (between setupInputParams and setupResponse)
 * assigns entry-point input or expected outcome fields that belong in setupInputParams / setupResponse.
 *
 * Mock shapes like context.getByUserIdParams / context.getByUserIdResponse are intentional in the middle.
 * Helpers named with "Args" (e.g. setupLoaderArgsWithoutPartner) may assign context.inputParams.
 * See `.cursor/rules/maddox-scenario-tests.mdc`.
 */

import {
  collectContextSetupAssignmentData,
  getBeforeEachBodyBlock,
  resolveDelegatedSetupBlock,
} from "./maddox-before-each-shared.js";

/** context.expectedResponse, context.expectedLoaderError, etc. */
const EXPECTED_OUTCOME = /^expected\w*(Response|Result|Error)$/;

function getSetupFunctionBlock(assignmentNode) {
  const rhs = assignmentNode.right;
  if (!rhs) return null;
  if (rhs.type !== "ArrowFunctionExpression" && rhs.type !== "FunctionExpression") return null;
  if (rhs.body.type !== "BlockStatement") return null;
  return rhs.body;
}

/** Depth-first walk (skips `parent` if present) — catches assignments in nested blocks. */
function walkAst(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const child of v) {
        if (child && typeof child === "object" && typeof child.type === "string") walkAst(child, visitor);
      }
    } else if (v && typeof v === "object" && typeof v.type === "string") {
      walkAst(v, visitor);
    }
  }
}

function reportAssignmentToContext(left, ctx, middleSetupName) {
  if (
    left.type !== "MemberExpression" ||
    left.computed ||
    left.object.type !== "Identifier" ||
    left.object.name !== "context" ||
    left.property.type !== "Identifier"
  ) {
    return;
  }

  const prop = left.property.name;

  if (prop === "inputParams" && !/Args/i.test(middleSetupName)) {
    ctx.report({
      node: left,
      message: `Maddox middle setup helper: assign context.inputParams inside context.setupInputParams, or use a helper whose name includes \"Args\" (e.g. setupLoaderArgs…) and call it after setupInputParams in each test.\n\nIntent: Discourage assigning context.inputParams or context.expected* outcomes inside middle Maddox setup helpers. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-middle-setup-content.md`,
    });
    return;
  }

  if (EXPECTED_OUTCOME.test(prop)) {
    ctx.report({
      node: left,
      message: `Maddox middle setup helper: expected entry-point outcomes (context.expected…Response / …Result / …Error) belong in context.setupResponse, not in a per-mock helper between setupInputParams and setupResponse.\n\nIntent: Discourage assigning context.inputParams or context.expected* outcomes inside middle Maddox setup helpers. See \`.cursor/rules/maddox-scenario-tests.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-before-each-middle-setup-content.md`,
    });
  }
}

function validateMiddleSetupBodies(ctx, entries) {
  const names = entries.map(e => e.name);
  if (names.length < 4) return;

  if (
    names[0] !== "setupValues" ||
    names[1] !== "setupInputParams" ||
    names[names.length - 1] !== "setupResponse"
  ) {
    return;
  }

  for (let i = 2; i < entries.length - 1; i++) {
    const { name: middleSetupName, assignmentNode } = entries[i];
    const fnBlock = getSetupFunctionBlock(assignmentNode);
    if (!fnBlock) continue;

    const match = /^setup([A-Z].*)$/.exec(middleSetupName);
    if (match && !/Args/i.test(middleSetupName)) {
      const baseName = match[1];
      const camelBaseName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
      const expectedParams = `${camelBaseName}Params`;
      const expectedResponse = `${camelBaseName}Response`;
      const expectedError = `${camelBaseName}Error`;

      const assignedProperties = new Set();
      walkAst(fnBlock, n => {
        if (n.type === "AssignmentExpression" && n.operator === "=") {
          const left = n.left;
          if (
            left.type === "MemberExpression" &&
            !left.computed &&
            left.object.type === "Identifier" &&
            left.object.name === "context" &&
            left.property.type === "Identifier"
          ) {
            assignedProperties.add(left.property.name);
          }
        }
      });

      const missing = [];
      if (!assignedProperties.has(expectedParams)) missing.push(`context.${expectedParams}`);
      if (!assignedProperties.has(expectedResponse)) missing.push(`context.${expectedResponse}`);
      if (!assignedProperties.has(expectedError)) missing.push(`context.${expectedError}`);

      if (missing.length > 0) {
        ctx.report({
          node: assignmentNode.left,
          message: `Maddox mock setup: '${middleSetupName}' is missing required variable assignment(s): ${missing.join(", ")}.\n\nIntent: Every mock setup function must define its associated Params, Response, and Error variables to support full Scenario chain capabilities.`,
        });
      }
    }

    walkAst(fnBlock, n => {
      if (n.type !== "AssignmentExpression" || n.operator !== "=") return;
      reportAssignmentToContext(n.left, ctx, middleSetupName);
    });
  }
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage assigning context.inputParams or context.expected* outcomes inside middle Maddox setup helpers. See \`.cursor/rules/maddox-scenario-tests.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-before-each-middle-setup-content.md",
    },
  },
  create(context) {
    let usesMaddox = false;
    let programNode = null;

    return {
      Program(node) {
        programNode = node;
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
        if (!usesMaddox || !programNode) return;
        const block = getBeforeEachBodyBlock(node);
        if (!block) return;

        const delegated = resolveDelegatedSetupBlock(programNode, block);
        const entries = delegated
          ? collectContextSetupAssignmentData(delegated)
          : collectContextSetupAssignmentData(block);

        validateMiddleSetupBodies(context, entries);
      },
    };
  },
};
