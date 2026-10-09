import { withLintDocs } from "./lint-docs-footer.js";

const RULE = "enforce-maddox-boilerplate";

function importPathSuggestsPostgresProxy(src) {
  if (typeof src !== "string") return false;
  return /postgres-proxy/i.test(src);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce Maddox scenario test structure and naming conventions. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-boilerplate.md",
    },
  },
  create(context) {
    let usesMaddox = false;
    const importByLocal = new Map();

    return {
      ImportDeclaration(node) {
        if (node.source.value === "maddox") {
          usesMaddox = true;
        }
        const src = node.source.value;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportSpecifier") {
            importByLocal.set(spec.local.name, src);
          }
        }
      },
      VariableDeclaration(node) {
        node.declarations.forEach(decl => {
          if (decl.init && decl.init.callee && decl.init.callee.name === "require" && decl.init.arguments[0] && decl.init.arguments[0].value === "maddox") {
            usesMaddox = true;
          }
        });
      },
      AssignmentExpression(node) {
        // context.setupX = () => { … context.setupY(); … } is forbidden — compose by field assignment only.
        const left = node.left;
        if (
          !left ||
          left.type !== "MemberExpression" ||
          left.computed ||
          left.object?.type !== "Identifier" ||
          left.object.name !== "context" ||
          left.property?.type !== "Identifier" ||
          !left.property.name.startsWith("setup")
        ) {
          return;
        }
        const right = node.right;
        if (
          !right ||
          (right.type !== "ArrowFunctionExpression" && right.type !== "FunctionExpression")
        ) {
          return;
        }

        const visit = (n) => {
          if (!n || typeof n !== "object") return;
          if (
            n.type === "CallExpression" &&
            n.callee?.type === "MemberExpression" &&
            !n.callee.computed &&
            n.callee.object?.type === "Identifier" &&
            n.callee.object.name === "context" &&
            n.callee.property?.type === "Identifier" &&
            n.callee.property.name.startsWith("setup")
          ) {
            context.report({
              node: n,
              message: withLintDocs(
                RULE,
                "Architectural Violation: context.setup* helpers must not call other context.setup* helpers. Compose fixtures by assigning context fields only (inline the parent fixture fields).\n\n" +
                  "Intent: Enforce Maddox scenario test structure and naming conventions. See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.",
              ),
            });
          }
          for (const key of Object.keys(n)) {
            if (key === "parent") continue;
            const child = n[key];
            if (Array.isArray(child)) child.forEach(visit);
            else if (child && typeof child === "object" && child.type) visit(child);
          }
        };
        visit(right.body);
      },
      CallExpression(node) {
        if (!usesMaddox) return;

        // 1. Check shouldBeCalledWith / shouldBeCalledWithSubset
        const shouldCallMethods = ["shouldBeCalledWith", "shouldBeCalledWithSubset"];
        if (node.callee.property && shouldCallMethods.includes(node.callee.property.name)) {
          const lastArg = node.arguments[node.arguments.length - 1];
          const isContextParam =
            lastArg &&
            lastArg.type === "MemberExpression" &&
            lastArg.object.name === "context" &&
            lastArg.property.name.endsWith("Params");

          if (!isContextParam) {
            context.report({
              node: lastArg || node,
              message: withLintDocs(
                RULE,
                `Architectural Violation: The last parameter of '${node.callee.property.name}' must be a property of the 'context' object and end with 'Params' (e.g., context.getUserParams).\n\n` +
                  "Intent: Enforce Maddox scenario test structure and naming conventions. See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.",
              ),
            });
          }
        }

        // 2. Check doesReturnWithPromise, doesErrorWithPromise, doesReturn, doesError
        const returnMethods = ["doesReturnWithPromise", "doesErrorWithPromise", "doesReturn", "doesError"];
        if (node.callee.property && returnMethods.includes(node.callee.property.name)) {
          const lastArg = node.arguments[node.arguments.length - 1];
          const isValidSuffix = 
            lastArg &&
            lastArg.type === "MemberExpression" &&
            lastArg.object.name === "context" &&
            (lastArg.property.name.endsWith("Response") || 
             lastArg.property.name.endsWith("Error") || 
             lastArg.property.name.endsWith("Result"));

          if (!isValidSuffix) {
            context.report({
              node: lastArg || node,
              message: withLintDocs(
                RULE,
                "Architectural Violation: The last parameter of 'doesReturn/Error' methods must be a property of the 'context' object and end with 'Response', 'Error', or 'Result'.\n\n" +
                  "Intent: Enforce Maddox scenario test structure and naming conventions. See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.",
              ),
            });
          }
        }

        // 3. Forbidden PostgresProxy (repository-internal only; never mock in Maddox)
        if (node.callee.property && (node.callee.property.name === "withMock" || node.callee.property.name === "setupMock")) {
          const mockArg = node.arguments[0];
          if (mockArg && mockArg.type === "Identifier" && mockArg.name === "PostgresProxy") {
            context.report({
              node: mockArg,
              message: withLintDocs(
                RULE,
                "Architectural Violation: Maddox tests must mock Repositories, not PostgresProxy. Please mock the relevant Repository instead.\n\n" +
                  "Intent: Enforce Maddox scenario test structure and naming conventions. See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.",
              ),
            });
          }
        }

        if (node.callee.property && node.callee.property.name === "mockThisFunction") {
          const third = node.arguments[2];
          if (third && third.type === "Identifier") {
            const name = third.name;
            const src = importByLocal.get(name);
            if (name === "PostgresProxy" || importPathSuggestsPostgresProxy(src)) {
              context.report({
                node: third,
                message: withLintDocs(
                  RULE,
                  "Architectural Violation: Maddox tests must not mock PostgresProxy — mock Repository classes instead.\n\n" +
                    "Intent: Enforce Maddox scenario test structure and naming conventions. See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.",
                ),
              });
            }
          }
        }

        // 4. Check it() block structure
        if (node.callee.name === "it") {
          const testFn = node.arguments[1];
          if (!testFn || (testFn.type !== "FunctionExpression" && testFn.type !== "ArrowFunctionExpression")) return;

          const body = testFn.body.type === "BlockStatement" ? testFn.body.body : [testFn.body];

          const sourceCode = context.getSourceCode().getText(testFn.body);
          const hasScenario = /new\s+(\w*Scenario|Scenario)/.test(sourceCode);

          if (!hasScenario) return; // Only enforce for Maddox tests

          function checkBody(statements) {
            statements.forEach(stmt => {
              // Check for setup calls: context.setupSomething()
              const isSetupCall = 
                stmt.type === "ExpressionStatement" &&
                stmt.expression.type === "CallExpression" &&
                stmt.expression.callee.object &&
                stmt.expression.callee.object.name === "context" &&
                stmt.expression.callee.property.name.startsWith("setup");

              // Check for setup overrides: context.setupSomething = () => { ... }
              const isSetupOverride = 
                stmt.type === "ExpressionStatement" &&
                stmt.expression.type === "AssignmentExpression" &&
                stmt.expression.left.object &&
                stmt.expression.left.object.name === "context" &&
                stmt.expression.left.property.name.startsWith("setup");

              const stmtText = context.getSourceCode().getText(stmt);
              const isScenarioStmt = /new\s+(\w*Scenario|Scenario)/.test(stmtText);

              // If it's a Promise, check its executor body
              if (stmt.type === "ExpressionStatement" && 
                  (stmt.expression.type === "AwaitExpression" || stmt.expression.type === "CallExpression" || stmt.expression.type === "NewExpression")) {
                let expression = stmt.expression;
                if (expression.type === "AwaitExpression") {
                  expression = expression.argument;
                }
                
                if (expression.type === "NewExpression" && expression.callee.name === "Promise") {
                  const executor = expression.arguments[0];
                  if (executor && (executor.type === "ArrowFunctionExpression" || executor.type === "FunctionExpression")) {
                    const executorBody = executor.body.type === "BlockStatement" ? executor.body.body : [executor.body];
                    checkBody(executorBody);
                    return;
                  }
                }
              }

              // Between it and Scenario, only setup calls or overrides are allowed.
              // No VariableDeclarations, no other logic.
              if (!isSetupCall && !isSetupOverride && !isScenarioStmt) {
                context.report({
                  node: stmt,
                  message: withLintDocs(
                    RULE,
                    "Architectural Violation: Maddox tests must be declarative. Test blocks should only contain context.setupX() calls, overrides, or the Scenario chain. Logic (like variable declarations) or assertions inside it() blocks are anti-patterns here.\n\n" +
                      "Intent: Enforce Maddox scenario test structure and naming conventions. See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.",
                  ),
                });
              }
            });
          }

          checkBody(body);
        }
      },
    };
  },
};
