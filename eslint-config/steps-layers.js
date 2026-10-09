/**
 * @agent-dossier
 * @purpose Steps Pattern layer-scoped ESLint rules for services, modules, controllers, steps, proxies, repositories, and state.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Always pass backendPathIndicators so architectural layer-access is never a silent no-op.
 */

/**
 * @typedef {object} StepsLayersOptions
 * @property {"src"|"app/server"} [srcRoot="src"] Root for backend layers.
 * @property {string[]} [backendPathIndicators] Path substrings that mark backend files.
 * @property {boolean} [includeControllers=true] Enable controller orchestration rules.
 * @property {boolean} [includeRepositories=true] Enable repository mapping rules.
 * @property {boolean} [includeState=true] Enable state getter/setter structure.
 * @property {boolean} [includeRouteCatchErrr=false] Enable route catch-Errr (Remix routes).
 * @property {object} [moduleCoverageOptions] Options for enforce-maddox-module-coverage.
 * @property {object} [controllerCoverageOptions] Options for enforce-maddox-controller-coverage.
 * @property {"error"|"off"} [moduleCoverage="error"] Module coverage severity.
 */

/**
 * @param {StepsLayersOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export function stepsLayers(options = {}) {
  const srcRoot = options.srcRoot ?? "src";
  const includeControllers = options.includeControllers !== false;
  const includeRepositories = options.includeRepositories !== false;
  const includeState = options.includeState !== false;
  const includeRouteCatchErrr = options.includeRouteCatchErrr === true;
  const moduleCoverage = options.moduleCoverage ?? "error";

  const backendPathIndicators = options.backendPathIndicators ?? [
    "/app/server/",
    "/app/routes/",
    "/src/",
  ];

  const serviceGlobs =
    srcRoot === "app/server"
      ? ["app/server/services/**/*.js"]
      : [`${srcRoot}/services/**/*.{js,ts}`];
  const moduleGlobs =
    srcRoot === "app/server"
      ? ["app/server/modules/**/*.js"]
      : [`${srcRoot}/modules/**/*.{js,ts}`];
  const serviceModuleGlobs = [...serviceGlobs, ...moduleGlobs];

  const stepGlobs =
    srcRoot === "app/server"
      ? ["app/server/steps/**/*.js"]
      : [`${srcRoot}/steps/**/*.{js,ts}`];

  const strategyGlobs =
    srcRoot === "app/server"
      ? ["app/server/strategies/**/*.js"]
      : [`${srcRoot}/strategies/**/*.{js,ts}`];

  const proxyGlobs =
    srcRoot === "app/server"
      ? ["app/server/proxies/**/*.js"]
      : [`${srcRoot}/proxies/**/*.{js,ts}`];

  const repositoryGlobs =
    srcRoot === "app/server"
      ? ["app/server/repositories/**/*.js"]
      : [`${srcRoot}/repositories/**/*.{js,ts}`];

  const stateGlobs =
    srcRoot === "app/server"
      ? ["app/server/state/**/*.js"]
      : [`${srcRoot}/state/**/*.{js,ts}`];

  /** @type {import('eslint').Linter.Config[]} */
  const configs = [
    {
      files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
      rules: {
        "steps-pattern/enforce-architectural-layer-access": [
          "error",
          { backendPathIndicators },
        ],
        "steps-pattern/enforce-logger-static-message": "error",
      },
    },
    {
      files: serviceModuleGlobs,
      rules: {
        "steps-pattern/enforce-service-orchestration": "error",
        "steps-pattern/enforce-injectable-bounded-fanout": "error",
        "steps-pattern/enforce-error-log-at-ingress": "error",
        "steps-pattern/enforce-errr-append-to": "error",
        "steps-pattern/enforce-no-browser-api-outside-proxy": "error",
        "steps-pattern/enforce-if-throw-use-precondition": "error",
      },
    },
    {
      // Module coverage only. Services are never Maddox entry points.
      files: moduleGlobs,
      rules: {
        "steps-pattern/enforce-module-min-steps": "warn",
        "steps-pattern/enforce-module-accept-not-step-next": "warn",
        "steps-pattern/enforce-outbound-class-method-call": "error",
        "steps-pattern/enforce-ingress-contract-validation": "error",
        "steps-pattern/enforce-maddox-validation-coverage": options.moduleCoverageOptions
          ? ["error", options.moduleCoverageOptions]
          : "error",
        ...(moduleCoverage === "off"
          ? { "steps-pattern/enforce-maddox-module-coverage": "off" }
          : {
            "steps-pattern/enforce-maddox-module-coverage": options.moduleCoverageOptions
              ? ["error", options.moduleCoverageOptions]
              : "error",
          }),
      },
    },
    {
      files: stepGlobs,
      rules: {
        "steps-pattern/enforce-step-structure": "error",
        "steps-pattern/enforce-no-unused-steps": "error",
        "steps-pattern/enforce-step-iterator-simplicity": "error",
        // Off for product CI: remaining same-file loop helpers are accepted. Flip to "error"
        // periodically to re-audit Steps against recipes under docs/llm/lint-fixes/enforce-no-step-loop-internal-function/.
        // Worlds still force this on via mutation expectFail (map-private-helper).
        "steps-pattern/enforce-no-step-loop-internal-function": "off",
        "steps-pattern/enforce-step-max-file-lines": ["error", { max: 250 }],
        "steps-pattern/enforce-no-repo-writes-in-loops": "error",
        "steps-pattern/enforce-injectable-bounded-fanout": "error",
        "steps-pattern/enforce-error-log-at-ingress": "error",
        "steps-pattern/enforce-no-empty-catch": "error",
        "steps-pattern/enforce-if-throw-use-precondition": "error",
        "steps-pattern/enforce-no-service-from-step": "error",
        "steps-pattern/enforce-errr-append-to": "error",
        "steps-pattern/enforce-no-browser-api-outside-proxy": "error",
        "steps-pattern/enforce-outbound-class-method-call": "error",
      },
    },
    {
      files: strategyGlobs,
      rules: {
        "steps-pattern/enforce-no-repo-writes-in-loops": "error",
        "steps-pattern/enforce-error-log-at-ingress": "error",
        "steps-pattern/enforce-no-empty-catch": "error",
        "steps-pattern/enforce-if-throw-use-precondition": "error",
        "steps-pattern/enforce-errr-append-to": "error",
        "steps-pattern/enforce-no-browser-api-outside-proxy": "error",
        "steps-pattern/enforce-outbound-class-method-call": "error",
      },
    },
    {
      files: proxyGlobs,
      rules: {
        "steps-pattern/enforce-proxy-structure": "error",
        "steps-pattern/enforce-injectable-bounded-fanout": "error",
        "steps-pattern/enforce-error-log-at-ingress": "error",
        "steps-pattern/enforce-no-empty-catch": "error",
        "steps-pattern/enforce-errr-append-to": "error",
      },
    },
  ];

  if (includeRepositories) {
    configs.push({
      files: repositoryGlobs,
      rules: {
        "steps-pattern/enforce-repository-model-mapping": "error",
        "steps-pattern/enforce-error-log-at-ingress": "error",
        "steps-pattern/enforce-errr-append-to": "error",
      },
    });
  }

  if (includeState) {
    configs.push({
      files: stateGlobs,
      rules: {
        "steps-pattern/enforce-state-getter-setter-structure": "error",
        "steps-pattern/enforce-error-log-at-ingress": "error",
      },
    });
  }

  if (includeControllers) {
    if (srcRoot === "app/server") {
      const routeControllerRules = {
        "steps-pattern/enforce-controller-orchestration": "error",
        "steps-pattern/enforce-maddox-controller-coverage": options.controllerCoverageOptions
          ? ["error", options.controllerCoverageOptions]
          : "error",
        "steps-pattern/enforce-no-browser-api-outside-proxy": "error",
        "steps-pattern/enforce-no-route-options-preflight": "error",
        "steps-pattern/enforce-no-route-auth-check": "error",
        "steps-pattern/enforce-controller-route-by-verb-or-path": "error",
        ...(includeRouteCatchErrr
          ? {
            "steps-pattern/enforce-route-catch-errr": "error",
            "steps-pattern/enforce-errr-append-to": "error",
          }
          : {}),
      };
      // UI Controllers are covered by RemixScenario on the thin Router until dedicated
      // FromPromise controller suites are added in a later sweep.
      configs.push({
        files: ["app/server/controllers/**/*.js"],
        rules: {
          "steps-pattern/enforce-controller-orchestration": "error",
          "steps-pattern/enforce-ingress-contract-validation": "error",
          "steps-pattern/enforce-controller-route-by-verb-or-path": "error",
          "steps-pattern/enforce-maddox-validation-coverage": options.controllerCoverageOptions
            ? ["error", options.controllerCoverageOptions]
            : "error",
          "steps-pattern/enforce-maddox-controller-coverage": "off",
          "steps-pattern/enforce-no-browser-api-outside-proxy": "error",
          "steps-pattern/enforce-errr-append-to": "error",
        },
      });
      configs.push(
        {
          files: ["app/routes/**/*.js"],
          rules: routeControllerRules,
        },
        {
          files: ["app/routes/**/*.jsx"],
          rules: { ...routeControllerRules },
        },
      );
    } else {
      configs.push({
        files: [`${srcRoot}/controllers/**/*.{js,ts}`],
        rules: {
          "steps-pattern/enforce-controller-orchestration": "error",
          "steps-pattern/enforce-ingress-contract-validation": "error",
          "steps-pattern/enforce-controller-route-by-verb-or-path": "error",
          "steps-pattern/enforce-maddox-validation-coverage": options.controllerCoverageOptions
            ? ["error", options.controllerCoverageOptions]
            : "error",
          "steps-pattern/enforce-maddox-controller-coverage": options.controllerCoverageOptions
            ? ["error", options.controllerCoverageOptions]
            : "error",
          "steps-pattern/enforce-no-browser-api-outside-proxy": "error",
        },
      });
    }
  }

  return configs;
}
