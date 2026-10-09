/**
 * @agent-dossier
 * @purpose Fail when Errr.newError in a catch omits .appendTo(the catch binding).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Log-only catch with no Errr is out of scope for this rule.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-errr-append-to";

function isTargetFilename(filename) {
  return (
    filename.includes("/steps/") ||
    filename.includes("/strategies/") ||
    filename.includes("/proxies/") ||
    filename.includes("/repositories/") ||
    filename.includes("/services/") ||
    filename.includes("/routes/")
  );
}

function catchBindingName(param) {
  if (!param) return null;
  if (param.type === "Identifier") return param.name;
  return null;
}

function sourceHasErrrNewError(text) {
  return text.includes("Errr.newError");
}

function sourceHasAppendToBinding(text, binding) {
  const re = new RegExp(`\\.appendTo\\(\\s*${binding}\\s*\\)`);
  return re.test(text);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "When a catch binds an error identifier and uses Errr.newError, require .appendTo(thatId).",
      url: "steps-pattern/docs/llm/rules/enforce-errr-append-to.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isTargetFilename(filename)) return {};
    const sourceCode = context.getSourceCode();

    return {
      CatchClause(node) {
        const binding = catchBindingName(node.param);
        if (!binding) return;
        if (!node.body || node.body.type !== "BlockStatement") return;

        const bodyText = sourceCode.getText(node.body);
        if (!sourceHasErrrNewError(bodyText)) return;
        if (sourceHasAppendToBinding(bodyText, binding)) return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: Errr.newError in catch (${binding}) must call .appendTo(${binding}) ` +
              "so first-one-wins keeps the cause.\n\n" +
              "Intent: Errr first-one-wins requires appendTo on the catch binding.",
          ),
        });
      },
    };
  },
};
