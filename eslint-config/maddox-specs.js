/**
 * @agent-dossier
 * @purpose Maddox scenario-test ESLint rule suite for package spec files.
 * @conforms-to steps-pattern
 * @feature core
 *
 * @technical-debt
 *
 * @refactoring-goals
 * - Shape presets always enable Maddox at error; do not soften per package.
 * - `*.pure.spec.js` stays outside maddoxSpecs so helper tables can use Vitest expect.
 * - `spec/integration/**` is the Docker-backed repository suite (not Maddox).
 */

/**
 * @typedef {object} MaddoxSpecsOptions
 * @property {boolean} [remix=false] Enable Remix/UI-specific Maddox rules.
 * @property {"error"|"warn"|"off"} [beforeEachSetupOrder="error"] Severity for setup order.
 * @property {"error"|"warn"|"off"} [middleSetupContent="warn"] Severity for middle setup content.
 * @property {"error"|"warn"|"off"} [coverage="error"] Severity for maddox coverage.
 * @property {"error"|"warn"|"off"} [middleSetupCardinality="error"] Severity for middle setup cardinality.
 */

/**
 * @param {MaddoxSpecsOptions} [options]
 * @returns {import('eslint').Linter.Config[]}
 */
export function maddoxSpecs(options = {}) {
  const remix = options.remix === true;
  const beforeEachSetupOrder = options.beforeEachSetupOrder ?? "error";
  const middleSetupContent = options.middleSetupContent ?? "warn";
  const coverage = options.coverage ?? "error";
  const middleSetupCardinality = options.middleSetupCardinality ?? "error";

  const specGlobs = remix
    ? ["spec/**/*.spec.js", "spec/**/*.spec.jsx"]
    : ["spec/**/*.spec.{js,ts}", "spec/**/*.spec.js"];
  const maddoxSpecIgnores = [
    "spec/**/*.pure.spec.js",
    "spec/**/*.pure.spec.ts",
    "spec/integration/**",
  ];

  /** @type {import('eslint').Linter.Config[]} */
  const configs = [
    {
      files: specGlobs,
      ignores: maddoxSpecIgnores,
      rules: {
        "steps-pattern/enforce-no-service-entry-point-in-maddox-spec": "error",
        "steps-pattern/enforce-maddox-boilerplate": "error",
        "steps-pattern/enforce-maddox-describe-structure": "error",
        "steps-pattern/enforce-maddox-before-each-setup-order": beforeEachSetupOrder,
        "steps-pattern/enforce-maddox-setup-params-array": "error",
        "steps-pattern/enforce-maddox-middle-setup-cardinality": middleSetupCardinality,
        "steps-pattern/enforce-maddox-before-each-middle-setup-content": middleSetupContent,
        "steps-pattern/enforce-maddox-coverage": coverage,
        "steps-pattern/enforce-maddox-scenario-order": "error",
        "steps-pattern/enforce-maddox-it-setup-override-order": "error",
        "steps-pattern/enforce-maddox-scenario-chain-one-line": "error",
        "steps-pattern/enforce-maddox-scenario-mock-surface": "error",
        "steps-pattern/enforce-no-maddox-should-be-called-with-subset": "error",
        "steps-pattern/enforce-no-maddox-ignore-param": "error",
        "steps-pattern/enforce-no-step-mock-in-maddox-test": "error",
        "steps-pattern/enforce-no-vitest-mock-in-from-promise-spec": "error",
        "steps-pattern/enforce-no-maddox-compare-outside-scenario": "error",
      },
    },
    {
      files: [
        "spec/**/modules/**/*.spec.{js,ts}",
        "spec/**/modules/**/*.spec.js",
        "spec/**/services/**/*.spec.{js,ts}",
        "spec/**/services/**/*.spec.js",
      ],
      ignores: maddoxSpecIgnores,
      rules: {
        "steps-pattern/enforce-maddox-module-describe-structure": "error",
      },
    },
    {
      files: [
        "spec/controllers/**/*.spec.{js,ts}",
        "spec/generated/controllers/**/*.spec.{js,ts}",
        "spec/app/routes/**/*.spec.{js,jsx}",
        "spec/generated/app/routes/**/*.spec.{js,jsx}",
        "spec/api/routes/**/*.spec.{js,jsx}",
        "spec/api/controllers/**/*.spec.{js,jsx}",
      ],
      ignores: maddoxSpecIgnores,
      rules: {
        "steps-pattern/enforce-no-service-mock-in-route-controller-spec": "error",
      },
    },
  ];

  if (remix) {
    configs.push({
      files: ["spec/**/*.spec.js", "spec/**/*.spec.jsx"],
      ignores: maddoxSpecIgnores,
      rules: {
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/no-static-element-interactions": "off",
        "steps-pattern/enforce-jsx-spec-for-ui-routes": "error",
        "steps-pattern/enforce-maddox-loader-action-separation": "error",
        "steps-pattern/enforce-api-contract-testing": "error",
        "steps-pattern/enforce-remix-scenario-for-ui-route-tests": "error",
        "steps-pattern/enforce-ui-route-spec-singleton": "error",
        "steps-pattern/enforce-no-from-promise-in-ui-spec": "error",
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "Program > ExpressionStatement > CallExpression:matches([callee.name='describe'], [callee.object.name='describe']) > :function > BlockStatement > ExpressionStatement > CallExpression[callee.name='beforeEach']",
            message:
              "Architectural Violation: Do not use beforeEach in the top-level 'Given' describe block. Move it to the nested 'calling the loader/action' describe blocks to keep setup logic focused.",
          },
          {
            selector:
              "Program > ExpressionStatement > CallExpression:matches([callee.name='describe'], [callee.object.name='describe']) > :function > BlockStatement > ExpressionStatement > CallExpression:matches([callee.name='describe'], [callee.object.name='describe']):not(:has(CallExpression[callee.name='beforeEach']))",
            message:
              "Architectural Violation: Nested describe blocks (e.g., 'calling the loader/action') must have their own beforeEach block to keep setup logic focused.",
          },
        ],
      },
    });
  }

  return configs;
}
