export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid use of Maddox.constants.IgnoreParam in Maddox scenario tests — test actual parameters instead.",
      url: "steps-pattern/docs/llm/rules/enforce-no-maddox-ignore-param.md",
    },
  },
  create(context) {
    return {
      Identifier(node) {
        if (node.name === "IgnoreParam" || node.name === "IgnoreParams") {
          context.report({
            node,
            message: "Architectural Violation: Do not use IgnoreParam or IgnoreParams. You must explicitly test the parameters sent to the mock.",
          });
        }
      },
    };
  },
};
