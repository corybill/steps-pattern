import { normalizePath } from "./maddox-before-each-shared.js";

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure that every top level catch in a route file uses Errr with .get(), logs errr.stack, and returns an appropriate response.",
      url: "steps-pattern/docs/llm/rules/enforce-route-catch-errr.md",
    },
  },
  create(context) {
    return {
      "FunctionDeclaration"(node) {
        const rawFilename = context.filename || context.getFilename?.() || "";
        const filename = normalizePath(rawFilename);
        if (!filename || !filename.includes("/routes/")) return;

        const methodName = node.id ? node.id.name : "";
        if (methodName !== "loader" && methodName !== "action") return;

        const body = node.body.body;
        const tryStatement = body.find(stmt => stmt.type === "TryStatement");
        if (!tryStatement) return;

        const catchClause = tryStatement.handler;
        if (!catchClause) return;

        const catchBodyText = context.getSourceCode().getText(catchClause.body);

        const usesErrr = catchBodyText.includes("Errr.newError") || catchBodyText.includes("Errr");
        const usesGet = catchBodyText.includes(".get()");
        const usesThrow = catchBodyText.includes(".throw()");
        const logsStack = /console\.error\(\s*\w+\.stack\s*\)/.test(catchBodyText) || /LoggerProxy\.error\([^)]+\)/.test(catchBodyText);
        const hasReturn = catchBodyText.includes("return") || catchBodyText.includes("throw redirect") || catchBodyText.includes("throw err");

        if (!usesErrr || !usesGet || usesThrow) {
          context.report({
            node: catchClause,
            message: `Route catch block must wrap the error in an Errr and use .get() not .throw().\n\nIntent: Ensure that every top level catch in a route file uses Errr with .get(), logs errr.stack, and returns an appropriate response.\nLink: steps-pattern/docs/llm/rules/enforce-route-catch-errr.md`,
          });
        }

        if (!logsStack) {
          context.report({
            node: catchClause,
            message: `Route catch block must log the error (e.g. console.error(errr.stack) or LoggerProxy.error("...", {}, errr)).\n\nIntent: Ensure that every top level catch in a route file uses Errr with .get(), logs errr.stack, and returns an appropriate response.\nLink: steps-pattern/docs/llm/rules/enforce-route-catch-errr.md`,
          });
        }

        if (!hasReturn) {
          context.report({
            node: catchClause,
            message: `Route catch block must send the appropriate response (e.g. return an object or throw redirect).\n\nIntent: Ensure that every top level catch in a route file uses Errr with .get(), logs errr.stack, and returns an appropriate response.\nLink: steps-pattern/docs/llm/rules/enforce-route-catch-errr.md`,
          });
        }
      },
    };
  },
};
