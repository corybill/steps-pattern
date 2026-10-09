/**
 * Flag Maddox scenarios whose outbound surface is too large, and require an open
 * `@technical-debt` note on the entry-point controller / service / module (or route)
 * acknowledging that the caller spec surface is too wide and should extract a Module.
 *
 * Thresholds (per `it` Scenario / RemixScenario chain):
 * - ≥7 unique `.mockThisFunction("Name", "method", …)` pairs, OR
 * - ≥8 `.shouldBeCalledWith` assertions
 *
 * See `.cursor/rules/maddox-scenario-tests.mdc` and layer rules.
 */

import fs from "fs";
import path from "path";

import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-maddox-scenario-mock-surface";

/** Stable substring agents must place under `@technical-debt` to acknowledge the smell. */
export const MOCK_SURFACE_DEBT_MARKER = "[Maddox] Scenario mock surface";

export const MOCK_SURFACE_DEBT_LINE =
  "- [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.";

const DEFAULT_MAX_MOCKS = 6;
const DEFAULT_MAX_SHOULD_BE_CALLED_WITH = 7;

const LAYER_PATH_FRAGMENTS = [
  "/controllers/",
  "/services/",
  "/modules/",
  "/routes/",
  "/steps/",
  "/strategies/",
];

function usesMaddoxImport(programNode) {
  if (!programNode?.body) return false;
  for (const stmt of programNode.body) {
    if (stmt.type === "ImportDeclaration" && stmt.source.value === "maddox") return true;
    if (stmt.type === "VariableDeclaration") {
      for (const decl of stmt.declarations) {
        const init = decl.init;
        if (
          init?.type === "CallExpression" &&
          init.callee?.name === "require" &&
          init.arguments[0]?.value === "maddox"
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function isLayerImport(src) {
  if (typeof src !== "string") return false;
  return LAYER_PATH_FRAGMENTS.some((frag) => src.includes(frag));
}

function walkAst(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const val = node[key];
    if (Array.isArray(val)) val.forEach((child) => walkAst(child, visit));
    else walkAst(val, visit);
  }
}

function countScenarioComplexity(itFnNode) {
  const mocked = new Set();
  let shouldBeCalledWith = 0;
  let hasScenario = false;

  walkAst(itFnNode, (n) => {
    if (
      n.type === "NewExpression" &&
      n.callee?.type === "Identifier" &&
      (n.callee.name === "Scenario" ||
        n.callee.name === "RemixScenario" ||
        n.callee.name === "FrameworkRouteScenario")
    ) {
      hasScenario = true;
    }
    if (
      n.type === "CallExpression" &&
      n.callee?.type === "MemberExpression" &&
      !n.callee.computed &&
      n.callee.property?.type === "Identifier"
    ) {
      const name = n.callee.property.name;
      if (name === "mockThisFunction") {
        const mockName = n.arguments[0]?.type === "Literal" ? n.arguments[0].value : null;
        const fnName = n.arguments[1]?.type === "Literal" ? n.arguments[1].value : null;
        if (typeof mockName === "string" && typeof fnName === "string") {
          mocked.add(`${mockName}.${fnName}`);
        } else {
          mocked.add(`anon:${mocked.size}`);
        }
      } else if (name === "shouldBeCalledWith") {
        shouldBeCalledWith += 1;
      }
    }
  });

  return { hasScenario, mockCount: mocked.size, shouldBeCalledWith };
}

function findWithEntryPointLocal(itFnNode) {
  let local = null;
  walkAst(itFnNode, (n) => {
    if (local) return;
    if (
      n.type === "CallExpression" &&
      n.callee?.type === "MemberExpression" &&
      n.callee.property?.name === "withEntryPoint" &&
      n.arguments[0]?.type === "Identifier"
    ) {
      local = n.arguments[0].name;
    }
  });
  return local;
}

function resolveEntrySourcePath(filename, importSrc) {
  if (typeof importSrc !== "string") return "";
  if (path.isAbsolute(importSrc)) return importSrc;
  const specDir = path.dirname(filename);
  const resolved = path.resolve(specDir, importSrc);
  return resolved;
}

function hasMockSurfaceDebt(sourcePath) {
  if (!sourcePath || !fs.existsSync(sourcePath)) return false;
  try {
    const text = fs.readFileSync(sourcePath, "utf8");
    return text.includes(MOCK_SURFACE_DEBT_MARKER);
  } catch {
    return false;
  }
}

/**
 * Map a Maddox spec path to a sibling production path when withEntryPoint is missing
 * (Remix route suites).
 */
function guessEntryPathFromSpec(filename) {
  const norm = normalizePath(filename);
  const replacements = [
    ["/spec/controllers/", "/src/controllers/"],
    ["/spec/generated/controllers/", "/src/controllers/"],
    ["/spec/modules/", "/src/modules/"],
    ["/spec/generated/modules/", "/src/modules/"],
    ["/spec/services/", "/src/services/"],
    ["/spec/steps/", "/src/steps/"],
    ["/spec/app/routes/", "/app/routes/"],
    ["/spec/generated/app/routes/", "/app/routes/"],
    ["/spec/api/controllers/", "/app/server/controllers/"],
    ["/spec/app/server/", "/app/server/"],
  ];
  for (const [from, to] of replacements) {
    if (!norm.includes(from)) continue;
    const base = norm.replace(from, to).replace(/\.spec\.(jsx|tsx|js|ts)$/, "");
    for (const ext of [".js", ".jsx", ".ts", ".tsx"]) {
      const candidate = `${base}${ext}`;
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return "";
}

export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require an open @technical-debt note on the entry-point controller/service/module when a Maddox scenario mocks ≥7 functions or asserts ≥8 shouldBeCalledWith pairs — the caller spec surface is too wide; extract a Module so that spec mocks fewer targets.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-scenario-mock-surface.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          maxMocks: { type: "integer", minimum: 1 },
          maxShouldBeCalledWith: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const maxMocks = options.maxMocks ?? DEFAULT_MAX_MOCKS;
    const maxShouldBeCalledWith =
      options.maxShouldBeCalledWith ?? DEFAULT_MAX_SHOULD_BE_CALLED_WITH;
    const filename = normalizePath(context.getFilename());
    const importByLocal = new Map();
    let usesMaddox = false;

    return {
      Program(node) {
        usesMaddox = usesMaddoxImport(node);
      },
      ImportDeclaration(node) {
        const src = node.source.value;
        if (typeof src !== "string") return;
        for (const spec of node.specifiers) {
          if (
            spec.type === "ImportDefaultSpecifier" ||
            spec.type === "ImportSpecifier" ||
            spec.type === "ImportNamespaceSpecifier"
          ) {
            importByLocal.set(spec.local.name, src);
          }
        }
      },
      "CallExpression[callee.name='it']"(node) {
        if (!usesMaddox) return;
        const testFn = node.arguments[1];
        if (!testFn) return;

        const { hasScenario, mockCount, shouldBeCalledWith } = countScenarioComplexity(testFn);
        if (!hasScenario) return;

        const overMocks = mockCount > maxMocks;
        const overCalls = shouldBeCalledWith > maxShouldBeCalledWith;
        if (!overMocks && !overCalls) return;

        const entryLocal = findWithEntryPointLocal(testFn);
        const entrySrc = entryLocal ? importByLocal.get(entryLocal) : null;
        let entryAbs = "";

        if (entrySrc && isLayerImport(entrySrc)) {
          entryAbs = resolveEntrySourcePath(filename, entrySrc);
        } else {
          entryAbs = guessEntryPathFromSpec(filename);
        }

        const entryNorm = normalizePath(entryAbs || String(entrySrc || ""));
        if (!LAYER_PATH_FRAGMENTS.some((frag) => entryNorm.includes(frag))) {
          return;
        }

        if (hasMockSurfaceDebt(entryAbs)) return;

        const reasons = [];
        if (overMocks) reasons.push(`${mockCount} unique mockThisFunction targets (max ${maxMocks})`);
        if (overCalls) {
          reasons.push(
            `${shouldBeCalledWith} shouldBeCalledWith assertions (max ${maxShouldBeCalledWith})`,
          );
        }

        const entryLabel = entryAbs
          ? path.relative(process.cwd(), entryAbs).split(path.sep).join("/")
          : entryLocal || "entry point";

        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: Maddox scenario mock surface is too wide (${reasons.join("; ")}). ` +
              `Add this open tech-debt line under \`@technical-debt\` in ${entryLabel}:\n` +
              `${MOCK_SURFACE_DEBT_LINE}\n` +
              `Then extract a Module so the caller spec mocks fewer targets.\n\n` +
              `Intent: Require an open @technical-debt note on the entry-point controller/service/module when a Maddox scenario mocks ≥7 functions or asserts ≥8 shouldBeCalledWith pairs.`,
          ),
        });
      },
    };
  },
};
