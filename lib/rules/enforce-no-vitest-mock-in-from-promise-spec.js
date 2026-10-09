/**
 * Forbid Vitest vi.fn, spyOn, mock, and expect as the mock/assert layer
 * in FromPromise Maddox specs. Clock pins (useFakeTimers, setSystemTime,
 * useRealTimers) stay allowed. RemixScenario / FrameworkRouteScenario /
 * ReactRouterFrameworkScenario specs keep vi (UI remount, crypto pins).
 */
import { normalizePath } from "./maddox-before-each-shared.js";

const ALLOWED_VI_MEMBERS = new Set([
  "useFakeTimers",
  "setSystemTime",
  "useRealTimers",
]);

const REMIX_SCENARIO_RE =
  /\b(RemixScenario|FrameworkRouteScenario|ReactRouterFrameworkScenario)\b/;

const MESSAGE = `Architectural Violation: FromPromise Maddox specs must not use Vitest vi.* / expect as the mock or assertion layer. Use mockThisFunction / shouldBeCalledWith. Clock pins may use vi.useFakeTimers, vi.setSystemTime, and vi.useRealTimers only.\n\nIntent: FromPromise Maddox specs must mock and assert with mockThisFunction / shouldBeCalledWith, not Vitest vi.fn / vi.spyOn / vi.mock / expect. RemixScenario / FrameworkRouteScenario / ReactRouterFrameworkScenario specs keep vi. Generate-emitted systemTime clock pins stay allowed.\nLink: steps-pattern/docs/llm/rules/enforce-no-vitest-mock-in-from-promise-spec.md`;

function isFromPromiseSpecFilename(filename) {
  if (filename.endsWith(".spec.jsx") || filename.endsWith(".spec.tsx")) return false;
  return /\.spec\.(js|ts)$/.test(filename);
}

function usesRemixScenario(source) {
  return REMIX_SCENARIO_RE.test(source);
}

function viMemberName(node) {
  if (node.type !== "MemberExpression" || node.computed) return null;
  if (node.object.type !== "Identifier" || node.object.name !== "vi") return null;
  if (node.property.type !== "Identifier") return null;
  return node.property.name;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid Vitest vi.*/expect mocks and assertions in FromPromise Maddox specs — use mockThisFunction / shouldBeCalledWith. Timer clock pins stay allowed. RemixScenario specs keep vi.",
      url: "steps-pattern/docs/llm/rules/enforce-no-vitest-mock-in-from-promise-spec.md",
    },
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    if (!isFromPromiseSpecFilename(filename)) return {};
    const source = context.getSourceCode().getText();
    if (!source.includes("FromPromiseScenario")) return {};
    if (usesRemixScenario(source)) return {};

    return {
      MemberExpression(node) {
        const name = viMemberName(node);
        if (!name || ALLOWED_VI_MEMBERS.has(name)) return;
        context.report({ node, message: MESSAGE });
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "expect") {
          context.report({ node: node.callee, message: MESSAGE });
        }
      },
    };
  },
};
