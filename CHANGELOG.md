# Changelog

All notable changes to this package are documented here. The version should move with **both** ESLint rule behavior and **material** updates to `docs/llm/` framework or rule guides.

## [Unreleased]

### Changed

- **`enforce-no-step-loop-internal-function`**: shared preset sets the rule to `"off"` (not warn/error). Remaining same-file loop helpers are accepted for now; flip back to `"error"` in `eslint-config/steps-layers.js` for periodic audits. Worlds still force the rule on for Step globs so `map-private-helper` stays a golden. Recipes stay: `loop-accept-module`, `use-domain-model-getter`, `strategy-by-prefix`, `inline-into-next`.
- **Parallel-first orchestration**: `acceptAll` is `Promise.all`. Framework + lint-fix docs now require racing every Step / Module call that has no data dependency. Sequential `accept` / serial `for-await acceptModule` only at a write→read barrier, shared mutation, or documented rate-limit. Recipe `split-into-sequential-steps` still owns the slug; it no longer teaches a serial accept ladder as the default.
- **Lint-fix “how to pick”**: prefer a named Gang of Four pattern before extracting. Catalog + helper recipes (`enforce-no-forbidden-words`) treat `helpers/`/`utils/` as the leftover when no pattern was named. Map: `docs/llm/framework/gang-of-four.md`. Recipe template adds `<pattern>`.

### Added

- **Lint-fix `strategy-by-prefix`**: preferred `enforce-no-step-loop-internal-function` recipe when the same-file helper is an if-ladder of interchangeable predicates (`sale:` / `hold:` / …) or two named algorithms for one job. Put each branch in `strategies/`; the Step loops `strategyForSourceKey`. Index: `docs/llm/lint-fixes/enforce-no-step-loop-internal-function/strategy-by-prefix/`.
- **Lint-fix `use-domain-model-getter`**: preferred `enforce-no-step-loop-internal-function` recipe when the same-file helper only reads/derives a field of one domain object. Put it on the model (`isRecurring`, `matchName`, `isPaid`, `toQueueDto`); the Step loop reads the getter. Index: `docs/llm/lint-fixes/enforce-no-step-loop-internal-function/use-domain-model-getter/`.
- **`enforce-step-max-file-lines`**: Step source files may not exceed 250 physical lines (option `max`; target 180). Fixes: `split-into-sequential-steps` (no collection) or `extract-loop-into-module` (looped body → multi-step Module). Worlds: `over-max`.
- **`enforce-no-step-loop-internal-function`**: A Step must not loop a same-file function. Loop `acceptModule` / `*Module.method`, or inline into `next`. Recipes: `loop-accept-module`, `use-domain-model-getter`, `strategy-by-prefix`, `inline-into-next`. Worlds: `map-private-helper`.
- **`enforce-module-min-steps`**: Warn when a Module method accepts fewer than two Steps. Recipe: `expand-accept-chain`. Worlds: `one-accept`.

### Changed

- **`enforce-no-partner-api-in-ui`**: on for every Steps shape. Allowlist is public Partner HTTP paths per workspace type (`eslint-config/partner-api-allowlists.js`): Remix `/v1/user/*`, Lambda listed sync + valuations APIs, ShareableModule none. Worlds: `allowlisted-get-user`, `proxy-extra-method`, `lambda-disallowed-api`.

### Added

- **Lint-fix `enforce-architectural-layer-access`**: first recipe `extract-outbound-into-step` — Cron / HTTP host / valuation helpers that call a Proxy or repository move the outbound into a Step (ingress → Service, valuation helper stays pure). ESLint `Fixes:` + manifest `lintFixes`. Index: `docs/llm/lint-fixes/enforce-architectural-layer-access/`.
- **Lint-fix `enforce-no-forbidden-words`**: helper / util / utils paths stay forbidden. Recipes from live moves — `extract-into-step` (selections `src/lib` → `BuildMemberSelections` / `MapMemberSelections`), `constants-or-common-not-util` (`selection-labels.js`, `cn` in `lib/styles`), `duplicate-across-boundary` (`yearOf` / `yearOfRow`). Index: `docs/llm/lint-fixes/enforce-no-forbidden-words/`.

### Changed

- **Shape-based ESLint presets** (`eslint-config/`): replace `nodeBackend` with `lambdaBackend()` and `shareableModule()`; harden `remixApp()` (Maddox at error, no `beforeEachSetupOrder: "off"`). Package wrappers are one-liners — no per-file rule offs. Spec path defaults are cwd-relative (`/src/controllers/` ↔ `/spec/controllers/`, `/app/routes/` ↔ `/spec/app/routes/`, …) without package-name snowflakes. See `eslint-config/SHAPES.md`. Consumer lint failures from removing snowflakes are expected follow-up work.
- **Lint-fix `intent-to-module-method`**: preferred recipe for Service intent if-ladders — flat Service → Dispatch Step → static methods on one Module (module methods as strategies). Canonical Billing payments; target Actions Hub / Admin Actions. Index: `docs/llm/lint-fixes/enforce-service-orchestration/intent-to-module-method/`.
- **Lint-fix `module-phases-via-call-steps`**: preferred for multi-phase loaders that use `setDone` / `isDone` — split phases into Module methods; Service only `accept`s Call* Steps that wrap `Module.method(state)`. Target: `getActionsHub`. Index: `docs/llm/lint-fixes/enforce-service-orchestration/module-phases-via-call-steps/`.

### Added

- **Lint-fix recipes** (`docs/llm/lint-fixes/`): XML decision prompts for how we have structurally fixed a `steps-pattern/*` rule. Rules: `enforce-maddox-scenario-mock-surface` (`split-by-iterator` preferred when a collection exists, `collapse-caller-mock-surface` when there is no iterator or to share a step group, `acknowledge-mock-surface-debt` temporary); `enforce-service-orchestration` (`dispatch-verb-at-ingress` preferred for router / controller / middleware verb splits, `strategy-by-verb-in-step` alternative); `enforce-controller-orchestration` (`dispatch-verb-at-ingress` preferred for verb → Service method, `extract-registration-wizard-service` preferred when the same stage bounce lives on many routes, `redirect-layout-index-in-step` preferred when a layout/tab Service already loads data and the bounce is pathname / member / season, `format-response-in-step` preferred when the loader/action assembles a DTO, `fold-second-service-into-accept-chain` preferred when the route awaits a second Service, `return-static-not-found` preferred for splat loaders whose every branch is 404, `map-key-to-throw-redirect` alternative for one isolated key → `throw redirect`); `enforce-step-iterator-simplicity` (`extract-loop-outbound-into-module` preferred for download+parse / per-item sequences, `fetch-then-process` preferred for independent week/page reads or dual S3 presigns, `keep-sequential-embed-batches` preferred for serial Bedrock Titan `embedContents` batches); `enforce-no-unused-steps` (`accept-into-owning-service` preferred when the Step belongs on an existing persist/dispatch chain). ESLint `Fixes:` line + manifest `lintFixes` point at the rule index. HOWTO Flow H. Not the anti-pattern inbox.
- **`enforce-no-vitest-mock-in-from-promise-spec`**: FromPromise Maddox specs must not use Vitest `vi.*` / `expect` as the mock or assertion layer. `vi.useFakeTimers` / `vi.setSystemTime` / `vi.useRealTimers` stay allowed for generate `systemTime`. Remix/UI `*.spec.jsx` stays out of scope. Files that mention `RemixScenario` / `FrameworkRouteScenario` / `ReactRouterFrameworkScenario` keep `vi` even when they also mention `FromPromiseScenario`. Worlds goldens: `uses-vi-spy-on`, `remix-scenario-allows-vi`.
- **Rule-candidate inbox** (`anti-patterns/rule-candidates/`): curated proposed ESLint rules from the 2026-08-29 dossier / Clean State census. Review with `pnpm anti-patterns:review-candidates`; implement later via steps-engineer `/codify-best-practice`. Not world-mutation promotion.

### Changed

- **`enforce-maddox-scenario-mock-surface` extracts:** reduce complexity first (including moving mid-flow defensive checks to an early precondition); **split-by-iterator** when a collection exists (Module = one item, Step loops / `Promise.all`); **collapse-caller-mock-surface** (split by steps) when there is no iterator or when sharing a step group. Index: `docs/llm/lint-fixes/enforce-maddox-scenario-mock-surface/`.
- **`enforce-maddox-scenario-orchestration-complexity` renamed** to `enforce-maddox-scenario-mock-surface` so it does not collide with `enforce-controller-orchestration`. Recipes: `collapse-caller-mock-surface` (was `extract-strategies-into-module`), `acknowledge-mock-surface-debt` (was `acknowledge-orchestration-debt`). Debt marker is now `[Maddox] Scenario mock surface`. Worlds mutation, `maddoxSpecs()`, and live `@technical-debt` lines updated in the same pass.
- **Lint-fix `Fixes:` line**: every `context.report` for a rule with `lintFixes` now appends `Fixes:` via `withLintDocs` (`lib/rules/lint-docs-footer.js`). `enforce-controller-orchestration` and `enforce-service-orchestration` previously linked recipes on only one message each. Worlds fail goldens assert the line.
- **`strategy-by-verb-in-step`**: when the discriminator is a body `intent` and the variants are different accept chains, the Dispatch Step maps intent → `Module.method` (payments → `BillingPaymentsModule.saveAccount` / `saveTransaction`). Do not peek `content-type` on the route.
- **`fetch-then-process`**: also covers dual independent S3 presigns (object + companion markdown). Attach-only stays in the Fetch Step — do not invent a Module or a Process* sibling. Canonical: `get-account-document-download-urls.js`.
- **maddox:generate**: swallowed error its that share a `parallelGroup` (`Promise.all`) now assert every sibling call, matching `maddox-scenario-tests.mdc`.
- **maddox:generate**: `skipView` leaf `triggerLoader` no longer inherits `fromParentLayout` outbounds or parent-layout hops. Parent `acceptAll` ids were colliding with the child's batch and emitting false `fails in Promise.all` wrap-its.
- **maddox:generate**: parent-layout wrap-its keep remaining happy child outbounds. React Router 7 loads parent + child with `Promise.all`, so a parent `get` failure does not stop the leaf loader.
- **maddox:generate**: redirect-variant describes (`loaderResponse` assertions) emit leaf `triggerLoader` wrap-its and omit parent-layout hops — the happy path already used `triggerLoader`, so wrap-its must not remount the parent.
- **`format-response-in-step`** live canonical stays `actions.jsx`. Standings is the single-getter counterexample: return `{ seasons }`, do not Format a view bag of `yearParam` / identity. Rule guide Don't/Do updated.
- **`enforce-api-contract-testing`**: only requires real-module `/api/*` stubs when the spec paints the leaf UI (`.triggerRender()` or `.render()`). Empty compiler placeholders and `triggerLoader`-only generate-good specs stay silent. Painted specs still must stub with `app/routes/api.*.jsx`. Guide: `docs/llm/rules/enforce-api-contract-testing.md`.
- **`maddoxSpecs()`**: ignores `spec/**/*.pure.spec.js` / `*.pure.spec.ts` so exported-helper / table tests can keep Vitest `expect` without sharing a FromPromise file. Convention: `{name}.spec.js` stays Maddox-only; `{name}.pure.spec.js` never mentions `FromPromiseScenario`.
- **`enforce-maddox-loader-action-separation`**: loader-mock isolation is scanned on the enclosing action `describe` (typically `stubModule.loader` in `setupInputParams`), not only the `it` body. Trigger check (`userEvent` / `fireEvent` / `.triggerAction`) still requires the `it`. Worlds pass golden + trunk widget action suite use the generated `setupInputParams` shape.
- **`enforce-no-maddox-should-be-called-with-subset`**: also forbids `Maddox.compare.subset` and `.shouldBeSubset`. Error wrap/cause checks must use `Maddox.compare.containsError(err, expected)` (Maddox 6.1.0+). `.shouldBeCalledWithSubset` remains banned.

## [1.5.0] - 2026-08-25

### Added

- **`enforce-no-repo-writes-in-loops`** (error on Steps + Strategies): fail when a repository write runs inside a loop, array iterator, or same-file helper called from a loop. Prefer collect-then-bulk at the Step boundary. The repository must implement that bulk method as **parameterized** SQL (`unnest($1::type[], …)` / `ON CONFLICT`), not a relocated Prisma `upsert()` loop — documented in `backend-repositories.mdc` and `docs/llm/rules/enforce-no-repo-writes-in-loops.md`.

## [1.2.0] - 2026-05-19

### Changed

- npm package renamed from `@app/eslint-rules` to **`steps-pattern`** (generic, unscoped name aligned with the ESLint plugin id).

## [1.1.0] - 2026-05-12

### Changed

- Monorepo package directory renamed from `tools/eslint-rules` to **`tools/steps-pattern`**.
- ESLint rule **implementations** moved from `rules/*.js` to **`lib/rules/*.js`** to avoid confusion with **`docs/llm/rules/`** (markdown guides).

## [1.0.0] - 2026-05-12

### Added

- `docs/llm/` versioned knowledge base: `manifest.json`, `HOWTO.md`, `framework/*` guides, `docs/llm/rules/*` per-rule markdown for every exported `steps-pattern` rule.
- Package `README.md` and `package.json` `files` field so npm installs include `docs/llm`.
