/**
 * @agent-dossier
 * @purpose Fail when Steps/orchestrators call chrome.* or browser.* directly.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Proxies and extension host (background/content) stay allowlisted.
 */
import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-no-browser-api-outside-proxy";

const TARGET_LAYERS =
  /\/(steps|strategies|modules|services|controllers)\//;

const BROWSER_ROOTS = new Set(["chrome", "browser"]);
const BROWSER_APIS = new Set(["storage", "tabs", "scripting", "runtime"]);

function isHostOrProxy(filename) {
  if (filename.includes("/proxies/")) return true;
  if (filename.includes("/background")) return true;
  if (filename.includes("/content/")) return true;
  return false;
}

function isBrowserApiMember(node) {
  // chrome.storage / chrome.tabs / … or nested chrome.storage.local.get
  let current = node;
  while (current && current.type === "MemberExpression") {
    if (
      current.object.type === "Identifier" &&
      BROWSER_ROOTS.has(current.object.name) &&
      current.property.type === "Identifier" &&
      BROWSER_APIS.has(current.property.name)
    ) {
      return true;
    }
    current = current.object;
  }
  return false;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Browser APIs (chrome.storage/tabs/scripting/runtime, browser.*) must go through a Proxy.",
      url: "steps-pattern/docs/llm/rules/enforce-no-browser-api-outside-proxy.md",
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (isHostOrProxy(filename)) return {};
    if (!TARGET_LAYERS.test(filename)) return {};

    return {
      MemberExpression(node) {
        if (!isBrowserApiMember(node)) return;
        // Report only the chrome.X / browser.X root expression once.
        if (
          node.object.type === "Identifier" &&
          BROWSER_ROOTS.has(node.object.name) &&
          node.property.type === "Identifier" &&
          BROWSER_APIS.has(node.property.name)
        ) {
          context.report({
            node,
            message: withLintDocs(
              RULE,
              "Architectural Violation: Browser APIs (chrome.storage / chrome.tabs / chrome.scripting / " +
                "chrome.runtime, or browser.*) must go through a Proxy (e.g. ChromeStorageProxy). " +
                "Do not call them from Steps or other orchestrators.\n\n" +
                "Intent: All outbound browser access goes through the proxy layer.",
            ),
          });
        }
      },
    };
  },
};
