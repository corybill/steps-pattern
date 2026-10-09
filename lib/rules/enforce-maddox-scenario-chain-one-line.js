/**
 * Maddox scenario chains: each mock / expectation call must use argument parens on a single line
 * (the opening `(` and closing `)` for that call are on the same line). Chained calls each
 * start on their own line with `.method(...)`.
 *
 * Note: `CallExpression.loc` for member chains starts at the root (`new`), so we match parens
 * by walking tokens from the `(` after the method name.
 */

const SCENARIO_CHAIN_METHODS = new Set([
  "mockThisFunction",
  "withEntryPoint",
  "withInputParams",
  "shouldBeCalled",
  "shouldBeCalledWith",
  "shouldBeCalledWithSubset",
  "doesReturn",
  "doesReturnWithPromise",
  "doesError",
  "doesErrorWithPromise",
  "triggerRender",
  "triggerAction",
  "triggerLoader",
]);

function isScenarioChainCall(node) {
  if (node.type !== "CallExpression") return false;
  const { callee } = node;
  if (
    callee.type !== "MemberExpression" ||
    callee.computed ||
    callee.property.type !== "Identifier"
  ) {
    return false;
  }
  return SCENARIO_CHAIN_METHODS.has(callee.property.name);
}

/** @param {import("eslint").AST.Token} openParen */
function findMatchingCloseParen(sourceCode, openParen) {
  let depth = 0;
  let t = openParen;
  while (t) {
    if (t.type === "Punctuator") {
      if (t.value === "(") depth++;
      else if (t.value === ")") {
        depth--;
        if (depth === 0) return t;
      }
    }
    t = sourceCode.getTokenAfter(t);
  }
  return null;
}

/** Collapse whitespace/newlines inside `( … )` for scenario chains (typical args: ids, context.*). */
function collapseParenBlock(text) {
  return text
    .replace(/\s*\n\s*/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/,\s*\)/g, ")");
}

export default {
  meta: {
    type: "layout",
    docs: {
      description: "Require Maddox Scenario chain calls (shouldBeCalledWith, doesReturnWithPromise, mockThisFunction, etc.) to keep \`(\` … \`)\` on one line.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-scenario-chain-one-line.md",
    },
    schema: [],
    messages: {
      oneLine:
        "Put the argument list for {{name}} on one line: .{{name}}(…). Each chained call should appear on its own line.",
    },
    fixable: "whitespace",
  },
  create(context) {
    const sourceCode = context.getSourceCode();

    return {
      CallExpression(node) {
        if (!isScenarioChainCall(node)) return;

        const open = sourceCode.getTokenAfter(node.callee, (t) => t.type === "Punctuator" && t.value === "(");
        const close = open ? findMatchingCloseParen(sourceCode, open) : null;
        if (!open || !close) return;

        if (open.loc.start.line === close.loc.start.line) return;

        const name = node.callee.property.name;
        context.report({
          node: node.callee.property,
          messageId: "oneLine",
          data: { name },
          fix(fixer) {
            const raw = sourceCode.text.slice(open.range[0], close.range[1] + 1);
            const collapsed = collapseParenBlock(raw);
            return fixer.replaceTextRange([open.range[0], close.range[1]], collapsed);
          },
        });
      },
    };
  },
};
