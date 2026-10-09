import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-step-iterator-simplicity";

function isProxyOrRepoCallee(callee) {
  if (!callee || callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.object.type !== "Identifier") return false;
  const name = callee.object.name;
  return /Proxy$/.test(name) || /Repo$/.test(name) || /Repository$/.test(name);
}

function isModuleMethodAwait(awaitNode) {
  const arg = awaitNode.argument;
  if (!arg || arg.type !== "CallExpression") return false;
  const callee = arg.callee;
  // Module.staticMethod(...) direct call
  if (callee.type === "MemberExpression" && !callee.computed
    && callee.object.type === "Identifier"
    && /Module$/.test(callee.object.name)) {
    return true;
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Fail when a Step next loop awaits a Proxy/Repo outbound, or contains 2+ awaits. " +
        "Move per-item outbound into a Module; batch Steps may loop Module.method only. " +
        "See `.cursor/rules/steps-pattern/backend-modules.mdc`.",
      url: "steps-pattern/docs/llm/rules/enforce-step-iterator-simplicity.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isStepFile = filename.includes("/steps/");

    if (!isStepFile) return {};

    function checkLoop(node) {
      let parent = node.parent;
      let isInsideNext = false;
      while (parent) {
        if (parent.type === "MethodDefinition" && parent.key.name === "next" && parent.static) {
          isInsideNext = true;
          break;
        }
        parent = parent.parent;
      }

      if (!isInsideNext) return;

      let awaitCount = 0;
      let hasProxyOrRepoAwait = false;

      const body = node.body || (node.arguments && node.arguments[0] && node.arguments[0].body);
      if (!body) return;

      const traverse = (n) => {
        if (!n || typeof n !== "object") return;
        if (n.type === "AwaitExpression") {
          if (!isModuleMethodAwait(n)) {
            awaitCount++;
          }
          if (n.argument && n.argument.type === "CallExpression"
            && isProxyOrRepoCallee(n.argument.callee)) {
            hasProxyOrRepoAwait = true;
          }
        }
        if (n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression" || n.type === "FunctionDeclaration") {
          return;
        }

        for (const key in n) {
          if (key === "parent") continue;
          const child = n[key];
          if (Array.isArray(child)) {
            child.forEach(traverse);
          } else {
            traverse(child);
          }
        }
      };

      traverse(body);

      if (hasProxyOrRepoAwait) {
        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: Step loops must not await Proxy/Repository outbounds. ` +
              `Move the per-item outbound sequence into a Module; the batch Step may loop ` +
              `await Module.method(...) only.\n\n` +
              `Intent: Fan-out outbound belongs in a Module. See \`.cursor/rules/steps-pattern/backend-modules.mdc\`.`,
          ),
        });
        return;
      }

      if (awaitCount >= 2) {
        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: This loop contains 2 or more 'await' expressions. ` +
              `Move this logic into a Module with sub-steps to keep the Step focused and simple.\n\n` +
              `Intent: Complex iterators belong in Modules. See \`.cursor/rules/steps-pattern/backend-modules.mdc\`.`,
          ),
        });
      }
    }

    return {
      ForOfStatement: checkLoop,
      ForInStatement: checkLoop,
      ForStatement: checkLoop,
      WhileStatement: checkLoop,
      DoWhileStatement: checkLoop,
      CallExpression(node) {
        const iterators = ["forEach", "map", "filter", "reduce", "some", "every"];
        if (node.callee.type === "MemberExpression" &&
            node.callee.property.type === "Identifier" &&
            iterators.includes(node.callee.property.name)) {
          checkLoop(node);
        }
      },
    };
  },
};
