/**
 * @agent-dossier
 * @purpose Controllers and Modules must validate ingress contracts with Validator.validate (or validateParsed) before orchestration.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-ingress-contract-validation";

function isControllerPath(filename) {
  return (
    filename.includes("/controllers/") ||
    /widget-controller\.(js|ts|jsx|tsx)$/.test(filename)
  );
}

function isModulePath(filename) {
  if (filename.includes(".agent-tool.")) return false;
  if (/\/index\.[cm]?(js|ts)$/.test(filename)) return false;
  if (filename.includes("/types/")) return false;
  if (/-types\.[cm]?(js|ts)$/.test(filename)) return false;
  return (
    filename.includes("/modules/") ||
    /widget-module\.(js|ts)$/.test(filename)
  );
}

function isUnusedParam(param) {
  if (!param) return true;
  if (param.type === "Identifier") return param.name.startsWith("_");
  if (param.type === "AssignmentPattern") return isUnusedParam(param.left);
  if (param.type === "RestElement") return isUnusedParam(param.argument);
  return false;
}

function hasIngressParams(params) {
  return (params || []).some((param) => !isUnusedParam(param));
}

function isValidatorIngressCall(call) {
  return (
    call?.type === "CallExpression" &&
    call.callee?.type === "MemberExpression" &&
    !call.callee.computed &&
    call.callee.object?.type === "Identifier" &&
    call.callee.object.name === "Validator" &&
    call.callee.property?.type === "Identifier" &&
    (call.callee.property.name === "validate" ||
      call.callee.property.name === "validateParsed")
  );
}

function isEmptyObjectLiteral(node) {
  return node?.type === "ObjectExpression" && (node.properties?.length ?? 0) === 0;
}

/** True when the Validator data arg is `x ?? {}` or `x || {}` (forbidden coalesce). */
function isNullToEmptyObjectCoalesce(arg) {
  if (!arg || arg.type !== "LogicalExpression") return false;
  if (arg.operator !== "??" && arg.operator !== "||") return false;
  return isEmptyObjectLiteral(arg.right);
}

function nodeHasIngressValidation(node) {
  if (!node || typeof node !== "object") return false;
  if (isValidatorIngressCall(node)) return true;
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      if (child.some(nodeHasIngressValidation)) return true;
    } else if (child && typeof child === "object" && child.type) {
      if (nodeHasIngressValidation(child)) return true;
    }
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Controller and Module entry methods must call Validator.validate or Validator.validateParsed (Zod) before orchestration.",
      url: "steps-pattern/docs/llm/rules/enforce-ingress-contract-validation.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const isController = isControllerPath(filename);
    const isModule = isModulePath(filename);
    if (!isController && !isModule) return {};

    return {
      CallExpression(node) {
        if (!isValidatorIngressCall(node)) return;
        const dataArg = node.arguments?.[1];
        if (!isNullToEmptyObjectCoalesce(dataArg)) return;
        const methodName = node.callee.property.name;
        context.report({
          node: dataArg,
          message: withLintDocs(
            RULE,
            `Architectural Violation: Do not coalesce null/undefined to {} in Validator.${methodName}(...). Pass the raw ingress value; use a schema that accepts undefined|null|object for empty-ok methods, then build State with a fallback after validate.\n\nIntent: Coalescing hides missing payloads and breaks fail-closed ingress. See \`backend-controllers.mdc\`.`,
          ),
        });
      },
      MethodDefinition(node) {
        if (node.static !== true || node.kind !== "method") return;
        if (node.value?.async !== true) return;
        if (!hasIngressParams(node.value.params)) return;

        const className = node.parent?.parent?.id?.name || "";
        if (isController && className && !/Controller$/.test(className)) return;
        if (isModule && className && /Controller$/.test(className)) return;

        if (nodeHasIngressValidation(node.value.body)) return;

        const methodName = node.key?.type === "Identifier" ? node.key.name : "<method>";
        const layer = isController ? "Controller" : "Module";
        context.report({
          node: node.key || node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: ${layer} method '${methodName}' must call Validator.validate(schema, ingress, debug) (or Validator.validateParsed for tool-arg/DTO clones) before orchestration.\n\nIntent: Fail closed on bad payloads at the ${layer} boundary with the same Zod + Validator contract Agents use. validate returns the input (identity); validateParsed returns Zod's clone. See \`backend-controllers.mdc\` / \`backend-modules.mdc\`.`,
          ),
        });
      },
    };
  },
};
