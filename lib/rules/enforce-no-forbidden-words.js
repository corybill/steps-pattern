import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-forbidden-words";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid helper/util/utils path tokens. Extract a Step (or a named common/constants file) — do not rename to a synonym. See project naming conventions in \`.cursor/rules/\`.",
      url: "steps-pattern/docs/llm/rules/enforce-no-forbidden-words.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          projectRoot: { type: "string" },
          forbiddenWords: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const projectRoot = options.projectRoot || "";
    const forbiddenWords = options.forbiddenWords || ["helper"];

    return {
      Program(node) {
        const fullPath = normalizePath(context.getFilename());
        
        // We want to check the path relative to the workspace root if possible, 
        // but checking the full path is safer as long as we don't hit system dirs.
        // Actually, checking just the part after the workspace root is better.
        
        const relativePath = fullPath.includes(projectRoot) 
          ? fullPath.slice(fullPath.indexOf(projectRoot)) 
          : fullPath;

        
        const lowercasePath = relativePath.toLowerCase();

        for (const word of forbiddenWords) {
          if (lowercasePath.includes(word)) {
            context.report({
              node,
              message: withLintDocs(RULE, `Architectural Violation: The word '${word}' in '${relativePath}' is an anti-pattern. Helper, util, and utils paths are not allowed. Business logic must be encapsulated in a Step class and accepted into state. Do not rename this file/directory to a synonym.\n\nIntent: Forbid helper / util / utils path tokens. See \`.cursor/rules/steps-pattern.mdc\`.`),
            });
          }
        }
      },
    };
  },
};
