export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure every Maddox test suite has a happy path and error tests for each mocked function. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-coverage.md",
    },
  },
  create(context) {
    const suites = [];
    let usesMaddox = false;

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
      "CallExpression[callee.name='describe']"(node) {
        if (!usesMaddox) return;
        const suite = {
          node,
          itBlocks: [],
          mockedFunctions: new Set(),
          errorTestedFunctions: new Set(),
          hasHappyPath: false,
        };
        suites.push(suite);
      },
      "CallExpression[callee.name='it']"(node) {
        if (suites.length === 0) return;
        const currentSuite = suites[suites.length - 1];
        currentSuite.itBlocks.push(node);

        const testFn = node.arguments[1];
        if (!testFn) return;

        let hasErrorCall = false;
        let hasMockThisInIt = false;

        // Find all mockThisFunction and doesError* calls in this it block
        const findMaddoxCalls = (innerNode) => {
          if (!innerNode || typeof innerNode !== "object") return;

          if (innerNode.type === "CallExpression" && innerNode.callee.property) {
            const name = innerNode.callee.property.name;
            if (name === "mockThisFunction") {
              hasMockThisInIt = true;
              const mockName = innerNode.arguments[0]?.value;
              const fnName = innerNode.arguments[1]?.value;
              if (mockName && fnName) {
                currentSuite.mockedFunctions.add(`${mockName}.${fnName}`);
              }
            } else if (name === "doesErrorWithPromise" || name === "doesError") {
              hasErrorCall = true;
              const mockName = innerNode.arguments[0]?.value;
              const fnName = innerNode.arguments[1]?.value;
              if (mockName && fnName) {
                currentSuite.errorTestedFunctions.add(`${mockName}.${fnName}`);
              }
            }
          }

          Object.keys(innerNode).forEach(key => {
            if (key === "parent") return;
            const val = innerNode[key];
            if (Array.isArray(val)) {
              val.forEach(findMaddoxCalls);
            } else {
              findMaddoxCalls(val);
            }
          });
        };

        findMaddoxCalls(testFn);

        const itText = context.getSourceCode().getText(testFn);
        const hasErrorExpectation =
          itText.includes("doesErrorWithPromise") || /\bdoesError\s*\(/.test(itText);

        if (hasMockThisInIt && !hasErrorCall) {
          currentSuite.hasHappyPath = true;
        } else if (itText.includes("new Scenario") && !hasErrorExpectation) {
          // e.g. success path via withEntryPoint only, or non-Maddox stub (vi.spyOn) beside Scenario
          currentSuite.hasHappyPath = true;
        }
      },
      "CallExpression[callee.name='describe']:exit"() {
        const suite = suites.pop();
        if (!suite || suite.itBlocks.length === 0) return;

        // Only report on describe blocks that actually contain Maddox scenarios
        if (suite.mockedFunctions.size === 0) return;

        if (!suite.hasHappyPath) {
          context.report({
            node: suite.node,
            message: `Architectural Violation: Maddox test suite must have at least one happy path test (no error expectations).\n\nIntent: Ensure every Maddox test suite has a happy path and error tests for each mocked function. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-coverage.md`,
          });
        }

        suite.mockedFunctions.forEach(fnPath => {
          if (!suite.errorTestedFunctions.has(fnPath)) {
            context.report({
              node: suite.node,
              message: `Architectural Violation: Mocked function '${fnPath}' is missing an error test case in this suite.\n\nIntent: Ensure every Maddox test suite has a happy path and error tests for each mocked function. See \`.cursor/rules/maddox-scenario-tests.mdc\` and layer rules.\nLink: steps-pattern/docs/llm/rules/enforce-maddox-coverage.md`,
            });
          }
        });
      },
    };
  },
};
