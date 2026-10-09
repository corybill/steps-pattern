
function isDescribeCall(node) {
  return (
    node.type === "CallExpression" &&
    (node.callee.name === "describe" ||
      (node.callee.type === "MemberExpression" &&
        node.callee.object.name === "describe"))
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Maddox describe block naming conventions.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-describe-structure.md",
    },
    fixable: "code",
  },
  create(context) {
    let usesMaddox = false;
    const describeStack = [];

    return {
      ImportDeclaration(node) {
        if (node.source.value === "maddox") {
          usesMaddox = true;
        }
      },
      VariableDeclaration(node) {
        node.declarations.forEach(decl => {
          if (decl.init && decl.init.callee && decl.init.callee.name === "require" && decl.init.arguments[0] && decl.init.arguments[0].value === "maddox") {
            usesMaddox = true;
          }
        });
      },
      CallExpression(node) {
        if (!isDescribeCall(node)) return;
        
        // We only care about files that use Maddox
        if (!usesMaddox) {
          // Check if Maddox is used in the file even if not imported (e.g. global or require)
          // But usually it's imported.
        }

        const description = node.arguments[0]?.value;
        if (typeof description !== "string") return;

        const depth = describeStack.length;
        describeStack.push(node);

        if (depth === 0) {
          // Top-level describe
          if (!description.startsWith("Given ") || !description.endsWith(", when")) {
            context.report({
              node: node.arguments[0],
              message: `Architectural Violation: Top-level describe block must start with 'Given' and end with ', when'. Current: '${description}'\n\nIntent: Enforce Maddox describe block naming conventions.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-describe-structure.md`,
              fix(fixer) {
                let newText = description;
                if (!newText.startsWith("Given ")) newText = "Given " + newText;
                if (!newText.endsWith(", when")) {
                  // If it ends with a period or space, remove it before adding ", when"
                  newText = newText.replace(/[.\s]+$/, "");
                  newText = newText + ", when";
                }
                return fixer.replaceText(node.arguments[0], `"${newText}"`);
              },
            });
          }
        } else {
          // Nested describe
          const lowerDesc = description.toLowerCase();
          const isLoader = /\bloader\b/.test(lowerDesc);
          const isAction = /\baction\b/.test(lowerDesc);

          if (isLoader) {
            if (!description.startsWith("calling the loader") || !description.endsWith(", it")) {
              context.report({
                node: node.arguments[0],
                message: `Architectural Violation: Loader describe block must start with 'calling the loader' and end with ', it'. Current: '${description}'\n\nIntent: Enforce Maddox describe block naming conventions.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-describe-structure.md`,
                fix(fixer) {
                  if (!description.endsWith(", it")) {
                    const newText = description.replace(/[.\s]+$/, "") + ", it";
                    return fixer.replaceText(node.arguments[0], `"${newText}"`);
                  }
                  return null;
                },
              });
            }
          } else if (isAction) {
            if (!description.startsWith("calling the action") || !description.endsWith(", it")) {
              context.report({
                node: node.arguments[0],
                message: `Architectural Violation: Action describe block must start with 'calling the action' and end with ', it'. Current: '${description}'\n\nIntent: Enforce Maddox describe block naming conventions.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-describe-structure.md`,
                fix(fixer) {
                  if (!description.endsWith(", it")) {
                    const newText = description.replace(/[.\s]+$/, "") + ", it";
                    return fixer.replaceText(node.arguments[0], `"${newText}"`);
                  }
                  return null;
                },
              });
            }
          } else if (!description.endsWith(", it")) {
             context.report({
              node: node.arguments[0],
              message: `Architectural Violation: Nested describe block must end with ', it'. Current: '${description}'\n\nIntent: Enforce Maddox describe block naming conventions.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-describe-structure.md`,
              fix(fixer) {
                let newText = description.replace(/[.\s]+$/, "");
                return fixer.replaceText(node.arguments[0], `"${newText}, it"`);
              },
            });
          }
        }
      },
      "CallExpression:exit"(node) {
        if (isDescribeCall(node)) {
          describeStack.pop();
        }
      },
    };
  },
};
