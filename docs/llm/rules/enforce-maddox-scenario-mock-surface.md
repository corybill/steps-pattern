# enforce-maddox-scenario-mock-surface

## Rule id

`steps-pattern/enforce-maddox-scenario-mock-surface`

## Intent (from ESLint rule)

When a Maddox scenario’s outbound surface is too large (≥7 unique `mockThisFunction` targets **or** ≥8 `shouldBeCalledWith` assertions in one `it`), the entry-point controller / service / module / route / step must carry an open `@technical-debt` note acknowledging the smell and pointing at extracting a Module so the **caller spec** mocks fewer targets.

This is **not** `enforce-controller-orchestration`. A legal thin loader (one Service, return from state) can still fail this rule. Fat-route logic (`if`, second Service, DTO in the loader) is a different rule and a different recipe tree.

## When this rule applies

Enabled on package `spec/**/*.spec.{js,jsx,ts}` via `maddoxSpecs()` in `steps-pattern/eslint-config`.

## What triggers

Per `it` that constructs `Scenario` / `RemixScenario` / `FrameworkRouteScenario`:

- Unique `.mockThisFunction("Name", "method", …)` pairs **> 6** (i.e. 7+), or
- `.shouldBeCalledWith` call count **> 7** (i.e. 8+), and
- The resolved entry-point source (from `.withEntryPoint` import, or sibling path from the spec) is under `/controllers/`, `/services/`, `/modules/`, `/routes/`, `/steps/`, or `/strategies/`, and
- That source file does **not** yet contain the marker `[Maddox] Scenario mock surface`

## What this rule does not enforce

- Refactoring immediately — acknowledging debt is enough to silence
- Remix suites without a resolvable sibling route/controller path
- Closed (`[x]`) vs open (`[ ]`) checkbox — any line containing the marker counts
- Logic in the route/controller (`if`, second Service, assembled DTO) — that is `enforce-controller-orchestration`

## Correct fix (checklist)

Recipes (preferred first): [`../lint-fixes/enforce-maddox-scenario-mock-surface/`](../lint-fixes/enforce-maddox-scenario-mock-surface/). Reduce complexity in place first (including moving mid-flow defensive checks to an early precondition). Then:

1. **Split by iterator** when there is a collection (accounts, weeks, pages): Module = one item, Step loops (`Promise.all` when independent) — see [split-by-iterator](../lint-fixes/enforce-maddox-scenario-mock-surface/split-by-iterator/).
2. **Split by steps** when there is no iterator, or when sharing an encapsulated step group across callers — see [collapse-caller-mock-surface](../lint-fixes/enforce-maddox-scenario-mock-surface/collapse-caller-mock-surface/).
3. Until that lands, add this line under `@technical-debt` on the entry-point controller / service / module (or route/step) — see [acknowledge-mock-surface-debt](../lint-fixes/enforce-maddox-scenario-mock-surface/acknowledge-mock-surface-debt/):

```text
- [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.
```

## What good looks like

```js
/**
 * @technical-debt
 * - [ ] [Maddox] Scenario mock surface (≥7 mocks or ≥8 shouldBeCalledWith): extract a Module so the caller spec mocks fewer targets.
 */
```

Or a happy-path Scenario with fewer than 7 unique mocks and fewer than 8 `shouldBeCalledWith` pairs.

## Do not

- Do not `eslint-disable` this rule.
- Do not “fix” counts by switching to `shouldBeCalledWithSubset` / `IgnoreParam` (those are banned by sibling Maddox rules).
- Do not apply `enforce-controller-orchestration` recipes (`format-response-in-step`, `dispatch-verb-at-ingress`, …) to shrink a spec’s mock list.

## Related docs

- `docs/llm/lint-fixes/enforce-maddox-scenario-mock-surface/` (how we have fixed this)
- `docs/llm/lint-fixes/enforce-controller-orchestration/` (different problem: logic in the route)
- `docs/llm/framework/maddox-scenarios.md`
- `~/.cursor/skills/steps-engineer/MADDOX_AUTHORING.md`
