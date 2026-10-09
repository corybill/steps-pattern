/**
 * @agent-dossier
 * @purpose Fail when Route/Controller maps Service/Controller methods by body intent or querystring (verb/path only).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Body/query dispatch belongs in a Dispatch Step → Module methods (or Step Strategy).
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-controller-route-by-verb-or-path";

const HTTP_VERBS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

const MESSAGE = withLintDocs(
  RULE,
  "Architectural Violation: Route/Controller may map only by HTTP verb or pathname. "
    + "Do not peek formData/json/searchParams (e.g. intent) to pick a Service or Controller method. "
    + "Move body/query routing into a Dispatch Step → Module methods "
    + "(intent-to-module-method) or a Step Strategy (strategy-by-verb-in-step).\n\n"
    + "Intent: Ingress maps HTTP; domain maps body/query in a Step.\n\n"
    + "See: steps-pattern/docs/llm/framework/routing-dispatch-choice.md",
);

function isRouteOrControllerFile(filename) {
  return (
    filename.includes("/routes/")
    || filename.includes("/controllers/")
    || filename.includes("widget-route")
    || filename.includes("widget-controller")
  );
}

function endsWithServiceOrController(name) {
  return typeof name === "string"
    && (name.endsWith("Service") || name.endsWith("Controller"));
}

function propertyKeyString(prop) {
  if (!prop || prop.type !== "Property" || prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
    return prop.key.value;
  }
  return null;
}

function isVerbOnlyObjectMap(node) {
  if (!node || node.type !== "ObjectExpression" || node.properties.length === 0) {
    return false;
  }
  return node.properties.every((prop) => {
    if (prop.type !== "Property") return false;
    const key = propertyKeyString(prop);
    return key != null && HTTP_VERBS.has(key.toUpperCase());
  });
}

function looksLikeBodyOrQueryMapName(name) {
  if (typeof name !== "string") return false;
  if (/verb|byPath|pathname|ByMethod/i.test(name)) return false;
  return /intent|ByBody|handlerByBody|ByQuery|queryTo|METHOD_BY_INTENT|ServiceMethodByIntent/i
    .test(name);
}

function isFormOrSearchGetCall(node) {
  if (!node || node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (!callee || callee.type !== "MemberExpression" || callee.computed) return false;
  if (callee.property?.type !== "Identifier" || callee.property.name !== "get") return false;
  const arg0 = node.arguments?.[0];
  if (!arg0 || arg0.type !== "Literal" || typeof arg0.value !== "string") return false;
  const key = arg0.value;
  return key === "intent" || key === "tab" || key === "mode" || key === "action";
}

function isFormDataCall(node) {
  return (
    node
    && node.type === "CallExpression"
    && node.callee?.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property?.type === "Identifier"
    && node.callee.property.name === "formData"
  );
}

function isJsonBodyCall(node) {
  return (
    node
    && node.type === "CallExpression"
    && node.callee?.type === "MemberExpression"
    && !node.callee.computed
    && node.callee.property?.type === "Identifier"
    && node.callee.property.name === "json"
    && node.callee.object?.type === "MemberExpression"
    && node.callee.object.property?.type === "Identifier"
    && node.callee.object.property.name === "request"
  );
}

function isSearchParamsMember(node) {
  return (
    node
    && node.type === "MemberExpression"
    && !node.computed
    && node.property?.type === "Identifier"
    && node.property.name === "searchParams"
  );
}

function unwrapAwait(node) {
  return node?.type === "AwaitExpression" ? node.argument : node;
}

function report(context, node) {
  context.report({ node, message: MESSAGE });
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Route/Controller ingress maps only by HTTP verb or pathname — not body intent or querystring.",
      url: "steps-pattern/docs/llm/rules/enforce-controller-route-by-verb-or-path.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isRouteOrControllerFile(filename)) return {};

    /** @type {Map<string, { kind: "verb-map" | "body-map", node: object }>} */
    const maps = new Map();
    /** @type {Set<string>} */
    const bodyDerivedIds = new Set();

    function markBodyDerivedFromInit(init, idName) {
      const value = unwrapAwait(init);
      if (!value) return;
      if (isFormOrSearchGetCall(value) || isFormDataCall(value) || isJsonBodyCall(value)) {
        bodyDerivedIds.add(idName);
        return;
      }
      if (
        value.type === "MemberExpression"
        && value.computed
        && value.object?.type === "Identifier"
      ) {
        const mapMeta = maps.get(value.object.name);
        if (mapMeta?.kind === "body-map") {
          bodyDerivedIds.add(idName);
          return;
        }
        if (isFormOrSearchGetCall(value.property) || (
          value.property?.type === "Identifier" && bodyDerivedIds.has(value.property.name)
        )) {
          bodyDerivedIds.add(idName);
        }
      }
      if (
        value.type === "MemberExpression"
        && !value.computed
        && isSearchParamsMember(value.object)
      ) {
        bodyDerivedIds.add(idName);
      }
    }

    function propertyIsBodyDerived(propertyNode) {
      if (!propertyNode) return false;
      if (propertyNode.type === "Identifier") {
        if (bodyDerivedIds.has(propertyNode.name)) return true;
        if (looksLikeBodyOrQueryMapName(propertyNode.name)) return true;
        return false;
      }
      if (propertyNode.type === "MemberExpression" && propertyNode.computed) {
        if (
          propertyNode.object?.type === "Identifier"
          && maps.get(propertyNode.object.name)?.kind === "body-map"
        ) {
          return true;
        }
        if (isFormOrSearchGetCall(propertyNode.property)) return true;
        if (
          propertyNode.property?.type === "Identifier"
          && bodyDerivedIds.has(propertyNode.property.name)
        ) {
          return true;
        }
      }
      if (isFormOrSearchGetCall(propertyNode)) return true;
      return false;
    }

    return {
      VariableDeclarator(node) {
        if (node.id?.type !== "Identifier") return;
        const name = node.id.name;
        const init = unwrapAwait(node.init);
        if (init?.type === "ObjectExpression") {
          if (isVerbOnlyObjectMap(init)) {
            maps.set(name, { kind: "verb-map", node });
          } else if (looksLikeBodyOrQueryMapName(name) || !isVerbOnlyObjectMap(init)) {
            // Non-verb object maps used at ingress are treated as body/query maps when named
            // like intent maps; unnamed generic objects are only body-maps when name matches.
            if (looksLikeBodyOrQueryMapName(name)) {
              maps.set(name, { kind: "body-map", node });
            }
          }
        }
        markBodyDerivedFromInit(node.init, name);
      },

      AssignmentExpression(node) {
        if (node.left?.type !== "Identifier") return;
        markBodyDerivedFromInit(node.right, node.left.name);
      },

      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression" || !callee.computed) return;
        if (callee.object?.type !== "Identifier") return;
        if (!endsWithServiceOrController(callee.object.name)) return;
        if (propertyIsBodyDerived(callee.property)) {
          report(context, node);
        }
      },
    };
  },
};
