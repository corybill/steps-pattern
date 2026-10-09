import { normalizePath } from "./maddox-before-each-shared.js";

function getterSetterName(method) {
  const key = method.key;
  if (!key) return "";
  if (key.type !== "Identifier" && key.type !== "PrivateIdentifier") return "";
  return key.name || "";
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that state file getter/setters are on one line and in alphabetical order.",
      url: "steps-pattern/docs/llm/rules/enforce-state-getter-setter-structure.md",
    },
    fixable: "code",
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        const filename = normalizePath(context.getFilename());
        const isStateFile = filename.includes("src/state/");
        const extendsState = node.superClass && node.superClass.name === "State";

        if (!isStateFile && !extendsState) {
          return;
        }

        const methods = node.body.body.filter((m) => m.type === "MethodDefinition");
        const gettersSetters = methods.filter((m) => {
          const name = getterSetterName(m);
          return name.startsWith("get") || name.startsWith("set");
        });

        if (gettersSetters.length === 0) {
          return;
        }

        const sourceCode = context.getSourceCode();

        // 1. Check if they are on one line
        gettersSetters.forEach((m) => {
          if (m.loc.start.line !== m.loc.end.line) {
            context.report({
              node: m,
              message: `Getter/setter methods in state files must be on a single line.\n\nIntent: Enforce that state file getter/setters are on one line and in alphabetical order.\nLink: steps-pattern/docs/llm/rules/enforce-state-getter-setter-structure.md`,
              fix(fixer) {
                const text = sourceCode.getText(m);
                const oneLineText = text
                  .replace(/\s*\n\s*/g, " ")
                  .replace(/\{\s+/g, "{ ")
                  .replace(/\s+\}/g, " }")
                  .replace(/\s*;\s*/g, "; ");
                return fixer.replaceText(m, oneLineText.trim());
              },
            });
          }
        });

        // 2. Check if they are in alphabetical order
        for (let i = 0; i < gettersSetters.length - 1; i++) {
          const current = gettersSetters[i];
          const next = gettersSetters[i + 1];

          const currentName = getterSetterName(current);
          const nextName = getterSetterName(next);
          if (currentName.localeCompare(nextName) > 0) {
            context.report({
              node: next,
              message: `Getter/setter '${nextName}' should be before '${currentName}' to maintain alphabetical order.\n\nIntent: Enforce that state file getter/setters are on one line and in alphabetical order.\nLink: steps-pattern/docs/llm/rules/enforce-state-getter-setter-structure.md`,
            });
          }
        }
      },
    };
  },
};
