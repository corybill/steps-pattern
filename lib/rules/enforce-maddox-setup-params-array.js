/**
 * Enforces that all "Params" properties in Maddox test setup functions are defined as Arrays.
 * This prevents tests from manually wrapping params as arrays in the test scenario.
 * See `.cursor/rules/maddox-scenario-tests.mdc`.
 */

import { RESERVED_OBJECT_PARAMS_KEYS } from "../maddox-reserved-context-keys.js";
import {
  collectContextSetupAssignmentData,
  getBeforeEachBodyBlock,
  resolveDelegatedSetupBlock,
} from "./maddox-before-each-shared.js";

function validateParamsAsArray(ctx, entries) {
  for (const entry of entries) {
    const assignment = entry.assignmentNode;
    if (assignment.right.type !== "ArrowFunctionExpression" && assignment.right.type !== "FunctionExpression") {
      continue;
    }

    const body = assignment.right.body;
    if (body.type !== "BlockStatement") continue;

    for (const stmt of body.body) {
      if (stmt.type !== "ExpressionStatement") continue;
      const expr = stmt.expression;
      if (expr.type !== "AssignmentExpression") continue;

      const left = expr.left;
      if (
        left.type === "MemberExpression" &&
        !left.computed &&
        left.object.type === "Identifier" &&
        left.object.name === "context" &&
        left.property.type === "Identifier" &&
        left.property.name.endsWith("Params") &&
        !RESERVED_OBJECT_PARAMS_KEYS.has(left.property.name)
      ) {
        const right = expr.right;
        const isArray = right.type === "ArrayExpression";

        if (!isArray) {
          ctx.report({
            node: left.property,
            message: `Maddox setup: context.${left.property.name} must be an Array. This avoids wrapping it in the Scenario chain.\n\nIntent: Enforce that all 'Params' in Maddox setup functions are Arrays.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-setup-params-array.md`,
          });
        }
      }
    }
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that all 'Params' in Maddox setup functions are Arrays.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-setup-params-array.md",
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

        validateParamsAsArray(context, entries);
      },
    };
  },
};
