/**
 * @agent-dossier
 * @purpose Fail when a Step source file exceeds the configured physical line max (default 250; target 180).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Tighten default max from 250 to 180 once the current fat Steps are split.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-step-max-file-lines";
const DEFAULT_MAX = 250;

function physicalLineCount(sourceCode) {
  const lines = sourceCode.lines;
  if (lines.length === 0) return 0;
  if (lines[lines.length - 1] === "") return lines.length - 1;
  return lines.length;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Fail when a Step source file exceeds max physical lines (default 250). " +
        "Split into sibling Steps or extract a Module. See `.cursor/rules/steps-pattern/backend-steps.mdc`.",
      url: "steps-pattern/docs/llm/rules/enforce-step-max-file-lines.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!filename.includes("/steps/")) return {};

    const max = context.options[0]?.max ?? DEFAULT_MAX;

    return {
      Program(node) {
        const lineCount = physicalLineCount(context.sourceCode ?? context.getSourceCode());
        if (lineCount <= max) return;

        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: This Step file is ${lineCount} lines; the maximum is ${max}. ` +
              `Split into sibling Steps and flatten in the Service or Module. ` +
              `When a collection exists, put one item on a Module method.\n\n` +
              `Intent: Keep Step files single-purpose and reviewable. Target is 180; current max is ${max}. ` +
              `See \`.cursor/rules/steps-pattern/backend-steps.mdc\`.`,
          ),
        });
      },
    };
  },
};
