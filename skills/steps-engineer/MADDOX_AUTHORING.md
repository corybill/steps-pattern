# Maddox first-write (lint-clean on the first pass)

Read this **before** writing a new `*.spec.js` / `*.spec.jsx`. Do not generate a spec from prose, from this checklist alone, or from a neighbor file that has Maddox ESLint rules turned off.

## Hand-author at the ingress (Route / Controller / Module)

Structural ESLint rules are the coverage contract. **Do not run `maddox:generate`.** Author scenarios directly in `{name}.spec.jsx` (or `.spec.js`).

1. Identify the ingress file (Route `app/routes/*.jsx`, Controller `src/controllers/*.js`, or Module `src/modules/*.js` / UI `app/server/modules/<name>/<name>.js`). **Never** `withEntryPoint` a Service.
2. Write (or extend) `{name}.spec.jsx` under `calling <method>, it` (Remix: `calling the loader, it` / `calling the action, it`). Cover every success and failure branch the production code can take.
3. Prefer a **single** `{name}.spec.jsx` per route. Legacy `{name}.ai-driven.spec.jsx` siblings may still exist during the collapse campaign — edit them only when that file already owns the remainder; do not create new `.ai-driven.spec.jsx` files.
4. Optional fixture helpers next to the spec (`{name}.spec.jsx.maddox-fixtures.js`) are fine for shared IDs / rows — they are not a generate pack anymore.
5. ReadLints must be clean on the first pass you declare done. Fix `steps-pattern/enforce-maddox-*` structurally — no `eslint-disable`.

Exported-helper / table tests that use Vitest `expect` must not live in a FromPromise file. Put them in `{name}.pure.spec.js` (no `maddox` / `FromPromiseScenario` import). `maddoxSpecs()` ignores that suffix.

Also skim the **`spec`** section of `packages/steps-pattern/anti-patterns/PREWRITE.md` (in the holding repo) when it has entries (Don't/Do from real agent hits). Do not read full `SUMMARY.md` during feature work.

ESLint is the source of truth. Authoring docs that disagree with `steps-pattern/eslint-config/maddox-specs.js` are bugs — update the docs, do not copy the stale pattern.

## Clone, then rename (when a sibling already teaches the shape)

1. Open `packages/steps-pattern/docs/llm/HOWTO.md` **Flow B** and `packages/steps-pattern/docs/llm/framework/maddox-scenarios.md` + `packages/steps-pattern/docs/llm/framework/maddox-before-each.md` (all in the holding repo).
2. Copy a **lint-clean sibling in the same layer**. The canonical worlds goldens are the safest templates:
   - `packages/steps-pattern/specs/worlds/trunk/spec/` (`steps/load-widget.spec.js`, `modules/widget-module.spec.js`, `controllers/widget-controller.spec.js`, `app/routes/widget.spec.jsx`) — linted under `maddox-lambda` / `maddox-remix`.
   - Otherwise, pick a lint-clean sibling in the current product's workspace (same layer, same scenario kind). Verify it does not use `shouldBeCalledWithSubset` / `IgnoreParam` / `eslint-disable` for `steps-pattern/enforce-maddox-*` before cloning.
3. Keep the clone's `describe` nesting, `beforeEach` setup order, `context.*Params` **arrays**, scenario chain grouping, and happy-then-error `it` order. Swap only names, fixtures, and mock targets.

## Never clone these as templates

Workspaces where Maddox rules are intentionally **off** (or softened). Copying them teaches a shape that fails as soon as the rules are on:

- Remix/public specs as a template for **FromPromiseScenario** when `remixApp` sets `beforeEachSetupOrder: "off"`.
- Any workspace that lists Vitest-only step specs in its `eslint.config.js` (e.g. agent-runtime-style agent runtimes).
- Any lambda `*.spec.*` where step mocks are still allowed.
- Any spec that uses `shouldBeCalledWithSubset`, `IgnoreParam`, `IgnoreParams`, or `eslint-disable` for `steps-pattern/enforce-maddox-*`.

## Assertions (hard bans)

| Do | Do not |
| :--- | :--- |
| `.shouldBeCalledWith("Name", "method", context.fooParams)` | `.shouldBeCalledWithSubset(...)` — `enforce-no-maddox-should-be-called-with-subset` |
| Full deep-equal `context.fooParams` **array** (`[arg1, arg2, …]`) | `Maddox.constants.IgnoreParam` / `IgnoreParams` — `enforce-no-maddox-ignore-param` |
| Two calls to the same mock → two `.shouldBeCalledWith` + two param arrays | One subset assertion covering both calls |
| Split the Step if params are “too big to assert” | `.shouldBeCalled("Name", "method")` with no params |

`context.fooParams` must be an array literal (`enforce-maddox-setup-params-array`). Return fixtures use the `Response` suffix (`context.fooResponse`), never `Return`. Remix loader stubs use `context.<name>LoaderResponse`.

## `beforeEach` (top-level assignments only)

1. `context.setupValues` — IDs, rows, mock builders.
2. `context.setupInputParams` — `context.inputParams = […entry args]` (or Remix `initialEntries` / stub app context).
3. One `context.setup<Action><Object>` per unique `.mockThisFunction` in **first-use order**. Each defines `context.<name>Params`, `context.<name>Response`, and `context.<name>Error`.
4. `context.setupResponse` — `context.expectedResponse` (or Remix `expectedMaddoxErr`).

Cardinality: one middle helper per `.shouldBeCalledWith` in the busiest `it` (`enforce-maddox-middle-setup-cardinality`). If that count is large, split the production Step first (Dossier: Maddox Complexity Principle).

Inside each `it`: reassign setup overrides **first**, then call the same setup functions in the same order, then the Scenario chain only.

## Scenario chain

`mockThisFunction` → `withEntryPoint` → `withInputParams(context.inputParams)` → for each call in source order `shouldBeCalledWith` + `doesReturnWithPromise` / `doesErrorWithPromise` → `.test` / `.catch`.

Keep each method’s argument parentheses on one line (`enforce-maddox-scenario-chain-one-line`). Happy path `it` first; failure tests in the order mocks are invoked. Every `mockThisFunction` needs a `doesErrorWithPromise` suite (`enforce-maddox-coverage`).

## All success and failure paths (same execute pass)

Do not ship production and wait for “Make sure all success and failure paths are covered with tests.” Write the full matrix **with** the feature:

| Must have an `it` | Typical shape |
| :--- | :--- |
| Happy path (every success branch, not just the first) | `.doesReturnWithPromise` for all mocks; assert `response` / UI |
| Each mocked collaborator error | Chain only through the failing call; `.doesErrorWithPromise`; `Maddox.compare.containsError(err, "Could not …")` for the wrap and `Maddox.compare.containsError(err, context.xxxError.message)` for the cause. Do **not** exact-equal `err.message` — `.debug()` must not change the assertion. NEVER `Maddox.compare.subset`. |
| Early return / validation throw | Scenario stops at that boundary; no later mocks |
| Controller `Validator.validate` | `should fail validation when the payload is empty.` — input is `{}`; `containsError` wrap + `"Validation Error"` + every Zod `issue.message` from `safeParse({})` |
| Swallowed error that continues | `.doesErrorWithPromise` on the throw, then remaining `.doesReturnWithPromise`; assert **success** output |
| `Promise.all` siblings | Assert **every** parallel mock even when one rejects |
| Nested parent + leaf loaders (`Promise.all`) | Assert leftover sibling-loader calls; omit mocks the failing loader never reaches |
| UI empty / error / rendered | RemixScenario `.next` assertions for each state |

If a branch exists in production and has no `it`, the spec is incomplete.

Never `mockThisFunction` a Step (`enforce-no-step-mock-in-maddox-test`) or a Service in a route/controller spec. Never mock `PostgresProxy` — mock the Entity.

If a single Scenario has **≥7 unique mocks** or **≥8 `shouldBeCalledWith`**, `enforce-maddox-scenario-mock-surface` fires. Open the `Fixes:` recipes at `packages/steps-pattern/docs/llm/lint-fixes/enforce-maddox-scenario-mock-surface/` **before** editing. Reduce complexity first (drop unused outbounds; move mid-flow defensive checks to an early precondition), then:

- **preferred (has a collection):** Module = one item, Step loops (`Promise.all` when independent) — `split-by-iterator`.
- **when no iterator / sharing a step group:** fold a group of Steps into a Module so the caller spec mocks those methods — `collapse-caller-mock-surface`.
- **temporary:** open `@technical-debt` on the entry-point source (not the spec):

`- [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.`

## After the first write

Run `ReadLints` on the spec **before declaring the feature done**. If a `steps-pattern/enforce-maddox-*` rule fires, open `packages/steps-pattern/docs/llm/manifest.json` (in the holding repo) → that rule’s `path` and fix the structure. Do not `eslint-disable`. Do not return with only the happy path green.
