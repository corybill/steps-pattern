import { normalizePath } from "./maddox-before-each-shared.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that process.env is only accessed in Global.{ts,js}. Spec files (**/spec/** and *.spec.{ts,js}) are exempt.",
      url: "steps-pattern/docs/llm/rules/enforce-no-process-env-except-global.md",
    },
  },
  create(context) {
    const rawFilename = context.filename || context.getFilename?.() || "";
    const filename = normalizePath(rawFilename);
    const isGlobalFile = /global\.[cm]?(ts|js)$/.test(filename);
    /** Tests set env (e.g. MODEL_API_KEY) without pulling in production Global helpers. */
    const isSpecFile =
      filename.includes("/spec/") || /\.spec\.[cm]?js$/.test(filename);

    return {
      MemberExpression(node) {
        if (isGlobalFile || isSpecFile) return;

        if (
          node.object.type === "Identifier" &&
          node.object.name === "process" &&
          node.property.type === "Identifier" &&
          node.property.name === "env"
        ) {
          context.report({
            node,
            message: `Architectural Violation: Direct access to process.env is forbidden outside of Global.{ts,js}. Use Global.getEnv() or a specific Global getter instead to ensure safe environment variable access and centralize configuration.\n\nIntent: Enforce that process.env is only accessed in Global.{ts,js}. Spec files (**/spec/** and *.spec.{ts,js}) are exempt.\nLink: steps-pattern/docs/llm/rules/enforce-no-process-env-except-global.md`,
          });
        }
      },
    };
  },
};
