/**
 * @agent-dossier
 * @purpose Shareable app ESLint flat-config presets keyed by project shape (Lambda, Remix, ShareableModule).
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Package eslint.config.js files stay thin wrappers over shape presets only (see SHAPES.md).
 */

import { base } from "./base.js";
import { browser } from "./browser.js";
import { maddoxSpecs } from "./maddox-specs.js";
import { node } from "./node.js";
import { react } from "./react.js";
import { stepsLayers } from "./steps-layers.js";
import { webextensions } from "./webextensions.js";

export { base } from "./base.js";
export { browser } from "./browser.js";
export { maddoxSpecs } from "./maddox-specs.js";
export { node } from "./node.js";
export { react } from "./react.js";
export { stepsLayers } from "./steps-layers.js";
export { typescript, typescriptWith } from "./typescript.js";
export { webextensions } from "./webextensions.js";

/**
 * Standard ignores shared by most packages.
 * @param {string[]} [extra]
 * @returns {import('eslint').Linter.Config}
 */
export function commonIgnores(extra = []) {
  return {
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "**/tmp/**",
      "coverage/**",
      "sst.config.js",
      "tailwind.config.js",
      "spec/maddox-init.js",
      ...extra,
    ],
  };
}

/**
 * Non-Steps packages (models, db): style + import hygiene only.
 * @param {object} [options]
 * @param {string[]} [options.extraIgnores]
 * @returns {import('eslint').Linter.Config[]}
 */
export function thinLibrary(options = {}) {
  return [
    commonIgnores(options.extraIgnores),
    ...base({ withStepsGlobals: false }),
    ...node(),
  ];
}

/**
 * Shared Steps + Maddox trunk for `src/` backends (Lambda and ShareableModule).
 * @param {object} [options]
 * @param {string[]} [options.extraIgnores]
 * @param {import('eslint').Linter.Config[]} [options.typescriptConfigs]
 * @param {"node"|"webextensions"} [options.runtime="node"]
 * @returns {import('eslint').Linter.Config[]}
 */
function srcStepsBackend(options = {}) {
  const runtime = options.runtime ?? "node";

  return [
    commonIgnores(options.extraIgnores),
    ...base(),
    ...(runtime === "webextensions" ? webextensions() : node()),
    ...stepsLayers({
      srcRoot: "src",
    }),
    ...maddoxSpecs(),
    ...(options.typescriptConfigs ?? []),
  ];
}

/**
 * Lambda shape: `lambda.js` → Controller → Service → Steps / Module.
 * @param {object} [options]
 * @param {string[]} [options.extraIgnores]
 * @param {import('eslint').Linter.Config[]} [options.typescriptConfigs]
 * @returns {import('eslint').Linter.Config[]}
 */
export function lambdaBackend(options = {}) {
  return srcStepsBackend({
    ...options,
    runtime: "node",
  });
}

/**
 * ShareableModule shape: Controller → Service → Steps / Module (no lambda adapter).
 * @param {object} [options]
 * @param {string[]} [options.extraIgnores]
 * @param {import('eslint').Linter.Config[]} [options.typescriptConfigs]
 * @param {"node"|"webextensions"} [options.runtime="node"]
 * @returns {import('eslint').Linter.Config[]}
 */
export function shareableModule(options = {}) {
  return srcStepsBackend({
    ...options,
  });
}

/**
 * Remix shape: Route loader/action → Service → Steps / Module.
 * @param {object} options
 * @param {import('eslint').ESLint.Plugin} options.reactPlugin
 * @param {import('eslint').ESLint.Plugin} options.reactHooks
 * @param {object} options.jsxA11y
 * @param {string[]} [options.extraIgnores]
 * @returns {import('eslint').Linter.Config[]}
 */
export function remixApp(options) {
  const { reactPlugin, reactHooks, jsxA11y } = options;

  return [
    commonIgnores([
      ".sst",
      "build",
      ".react-router/**",
      "**/*.{ts,tsx,mts,cts}",
      "app/front-end/primitives/*",
      ...(options.extraIgnores ?? []),
    ]),
    ...base(),
    ...browser(),
    ...react({ reactPlugin, reactHooks, jsxA11y }),
    {
      files: ["**/*.{js,mjs,cjs,jsx}"],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["app/**/*.{js,jsx}"],
      rules: {
        "no-console": "error",
      },
    },
    {
      files: ["**/logger-proxy.js", "**/events-proxy.js", "spec/**/*.{js,jsx}", "scripts/**/*.{js,jsx,mjs}", "evals/**/*.js", "**/reproduce.js"],
      rules: {
        "no-console": "off",
      },
    },
    ...stepsLayers({
      srcRoot: "app/server",
      includeRouteCatchErrr: true,
      includeState: true,
    }),
    ...maddoxSpecs({
      remix: true,
    }),
    {
      files: ["vite.config.js"],
      rules: {
        "steps-pattern/enforce-no-forbidden-words": "off",
        "steps-pattern/enforce-no-process-env-except-global": "off",
        "steps-pattern/enforce-architectural-layer-access": "off",
      },
    },
  ];
}
