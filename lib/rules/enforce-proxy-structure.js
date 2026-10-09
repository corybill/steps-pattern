export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce that Proxy methods are wrapped in try/catch blocks with Errr. See \`.cursor/rules/backend-proxies.mdc\`.",
      url: "steps-pattern/docs/llm/rules/enforce-proxy-structure.md",
    },
  },
  create(context) {
    return {
      MethodDefinition(node) {
        // Target methods in Proxy classes
        if (node.kind === "constructor") return;

        const body = node.value.body.body;
        const tryStatement = body.find(stmt => stmt.type === "TryStatement");

        if (!tryStatement) {
          context.report({
            node,
            message: `Proxy methods must be wrapped in a try/catch block.\n\nIntent: Enforce that Proxy methods are wrapped in try/catch blocks with Errr. See \`.cursor/rules/backend-proxies.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-proxy-structure.md`,
          });
        } else {
          const catchClause = tryStatement.handler;
          if (catchClause) {
            const catchBody = catchClause.body.body;
            const hasErrr = catchBody.some(stmt => {
              const code = context.getSourceCode().getText(stmt);
              return code.includes("Errr.newError") && (code.includes(".throw()") || code.includes(".get()"));
            });

            if (!hasErrr) {
              context.report({
                node: catchClause,
                message: `Catch block must use Errr to wrap and throw the error.\n\nIntent: Enforce that Proxy methods are wrapped in try/catch blocks with Errr. See \`.cursor/rules/backend-proxies.mdc\`.\nLink: steps-pattern/docs/llm/rules/enforce-proxy-structure.md`,
              });
            }
          }
        }
      },
    };
  },
};
