function isCompareSubsetCall(node) {
  if (node.callee.type !== "MemberExpression" || node.callee.property?.type !== "Identifier") {
    return false;
  }
  if (node.callee.property.name !== "subset") {
    return false;
  }
  const object = node.callee.object;
  if (object.type === "Identifier" && object.name === "compare") {
    return true;
  }
  return object.type === "MemberExpression"
    && object.property?.type === "Identifier"
    && object.property.name === "compare";
}

function isBannedSubsetApi(node) {
  if (node.callee.type !== "MemberExpression" || node.callee.property?.type !== "Identifier") {
    return false;
  }
  const name = node.callee.property.name;
  return name === "shouldBeCalledWithSubset" || name === "shouldBeSubset" || isCompareSubsetCall(node);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid subset APIs in Maddox specs. Use shouldBeCalledWith for mocks and Maddox.compare.containsError for Errr wrap/cause strings.",
      url: "steps-pattern/docs/llm/rules/enforce-no-maddox-should-be-called-with-subset.md",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (isBannedSubsetApi(node)) {
          context.report({
            node: node.callee.property,
            message: "Architectural Violation: Do not use subset. Use shouldBeCalledWith for mock arguments and Maddox.compare.containsError(err, expectedMessage) for error wrap/cause checks.",
          });
        }
      },
    };
  },
};
