/**
 * @agent-dossier
 * @purpose Module and Controller Maddox suites must include at least one Validation Error Scenario it.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 */
import fs from "fs";
import path from "path";

import { withLintDocs } from "./lint-docs-footer.js";
import { normalizePath } from "./maddox-before-each-shared.js";

const RULE = "enforce-maddox-validation-coverage";

const VALIDATION_ERROR_RE = /Validation Error/;

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

function collectIngressMethodCount(programNode, { requireControllerSuffix }) {
  let count = 0;
  const visitClass = (classNode) => {
    const className = classNode.id?.name || "";
    if (requireControllerSuffix && className && !/Controller$/.test(className)) return;
    if (!requireControllerSuffix && className && /Controller$/.test(className)) return;
    for (const member of classNode.body?.body || []) {
      if (member.type !== "MethodDefinition") continue;
      if (!member.static || member.kind !== "method") continue;
      if (member.value?.async !== true) continue;
      if (member.key?.type === "Identifier" && member.key.name.startsWith("_")) continue;
      if (!hasIngressParams(member.value?.params)) continue;
      count += 1;
    }
  };

  for (const stmt of programNode.body || []) {
    if (stmt.type === "ClassDeclaration") {
      visitClass(stmt);
      continue;
    }
    if (stmt.type === "ExportNamedDeclaration" && stmt.declaration?.type === "ClassDeclaration") {
      visitClass(stmt.declaration);
      continue;
    }
    if (stmt.type === "ExportDefaultDeclaration" && stmt.declaration?.type === "ClassDeclaration") {
      visitClass(stmt.declaration);
    }
  }
  return count;
}

/** Primary + split siblings (`foo.spec.js`, `foo.ai-driven.spec.js`, …). */
function resolveSiblingSpecPaths(specBasePath) {
  const preferredSpecs = [`${specBasePath}.spec.ts`, `${specBasePath}.spec.js`];
  const existingPreferredSpecs = preferredSpecs.filter((specPath) => fs.existsSync(specPath));
  const dir = path.dirname(specBasePath);
  const base = path.basename(specBasePath);
  const siblings = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith(`${base}.`) && /\.spec\.[cm]?(ts|js)$/.test(f)) {
        siblings.push(path.join(dir, f));
      }
    }
  }
  const combined = [...new Set([...existingPreferredSpecs, ...siblings.sort()])];
  return combined;
}

function readCombinedSpecText(specPaths) {
  let text = "";
  for (const specPath of specPaths) {
    try {
      text += fs.readFileSync(specPath, "utf-8");
      text += "\n";
    } catch {
      // ignore unreadable siblings
    }
  }
  return text;
}

function resolveModuleSpecBases(filename, modulePathMappings) {
  const bases = [];
  if (modulePathMappings?.length) {
    for (const mapping of modulePathMappings) {
      if (!filename.includes(mapping.match)) continue;
      let candidate = filename.replace(mapping.match, mapping.replace);
      if (mapping.withExt) {
        candidate = candidate.replace(/\.[cm]?(js|ts)$/, mapping.withExt);
      } else {
        candidate = candidate.replace(/\.[cm]?(js|ts)$/, "");
      }
      bases.push(candidate);
    }
  }
  if (filename.includes("/src/modules/")) {
    bases.push(
      filename.replace("/src/modules/", "/spec/modules/").replace(/\.[cm]?(js|ts)$/, ""),
    );
  }
  if (filename.includes("/app/server/modules/")) {
    const baseNameWithoutExt = path.basename(filename).replace(/\.[cm]?(js|ts)$/, "");
    const projectRoot = filename.split("/app/")[0];
    bases.push(path.join(projectRoot, "spec/app/server/modules", baseNameWithoutExt));
  }
  return bases;
}

function resolveControllerSpecBases(filename, controllerPathMappings) {
  const bases = [];
  if (controllerPathMappings?.length) {
    for (const mapping of controllerPathMappings) {
      if (!filename.includes(mapping.match)) continue;
      let candidate = filename.replace(mapping.match, mapping.replace);
      if (mapping.withExt) {
        candidate = candidate.replace(/\.[cm]?(js|ts|jsx|tsx)$/, mapping.withExt);
      } else {
        candidate = candidate.replace(/\.[cm]?(js|ts|jsx|tsx)$/, "");
      }
      bases.push(candidate);
    }
  }
  if (filename.includes("/src/controllers/")) {
    bases.push(
      filename.replace("/src/controllers/", "/spec/controllers/").replace(/\.(ts|js)$/, ""),
    );
  }
  if (filename.includes("/app/server/controllers/")) {
    bases.push(
      filename
        .replace("/app/server/controllers/", "/spec/app/server/controllers/")
        .replace(/\.(ts|js)$/, ""),
    );
  }
  return bases;
}

function isModuleSource(filename) {
  if (filename.includes(".agent-tool.")) return false;
  if (/\/index\.[cm]?(js|ts)$/.test(filename)) return false;
  return (
    filename.includes("/modules/") ||
    /widget-module\.(js|ts)$/.test(filename)
  );
}

function isControllerSource(filename) {
  return (
    filename.includes("/controllers/") ||
    /widget-controller\.(js|ts|jsx|tsx)$/.test(filename)
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Module and Controller Maddox Scenario suites must include at least one Validation Error test.",
      url: "steps-pattern/docs/llm/rules/enforce-maddox-validation-coverage.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          modulePathMappings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match: { type: "string" },
                replace: { type: "string" },
                withExt: { type: "string" },
              },
              required: ["match", "replace"],
            },
          },
          controllerPathMappings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match: { type: "string" },
                replace: { type: "string" },
                withExt: { type: "string" },
              },
              required: ["match", "replace"],
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = normalizePath(context.getFilename());
    const fileBasename = path.basename(filename);
    if (/\.spec\.[cm]?(ts|js)$/.test(fileBasename)) return {};

    const isModule = isModuleSource(filename);
    const isController = isControllerSource(filename);
    if (!isModule && !isController) return {};

    const options = context.options[0] || {};

    return {
      Program(node) {
        const ingressCount = collectIngressMethodCount(node, {
          requireControllerSuffix: isController,
        });
        if (ingressCount === 0) return;

        const bases = isModule
          ? resolveModuleSpecBases(filename, options.modulePathMappings)
          : resolveControllerSpecBases(filename, options.controllerPathMappings);

        const specPaths = [];
        for (const base of bases) {
          for (const p of resolveSiblingSpecPaths(base)) {
            if (!specPaths.includes(p)) specPaths.push(p);
          }
        }

        if (!specPaths.length) return;

        const combined = readCombinedSpecText(specPaths);
        if (!combined.toLowerCase().includes("maddox")) return;
        if (VALIDATION_ERROR_RE.test(combined)) return;

        const layer = isController ? "Controller" : "Module";
        const suiteLabel = specPaths.map((p) => path.basename(p)).join(", ");
        context.report({
          node,
          message: withLintDocs(
            RULE,
            `Architectural Violation: ${layer} '${fileBasename}' Scenario suite (${suiteLabel}) must include at least one test that asserts Validation Error.\n\nIntent: Prove the ingress Validator.validate contract fails closed. Use Maddox.compare.containsError(err, "Validation Error") in a FromPromiseScenario it.`,
          ),
        });
      },
    };
  },
};
