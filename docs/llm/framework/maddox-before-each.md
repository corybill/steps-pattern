# Maddox — `beforeEach` setup conventions

Several ESLint rules share the same mental model for **`context.setup*`** functions attached in `beforeEach` (or a delegated factory). This document is the **single framework-level** summary; rule-specific docs in [`../rules/`](../rules/) link here for deltas.

## Canonical assignment order

In `beforeEach` (top-level statements only, or a delegated factory body resolved by the rule):

1. **`context.setupValues`** — Fixture IDs, rows, builders, constants used by the suite.
2. **`context.setupInputParams`** — Builds `context.inputParams` (and any sibling params wired into `withInputParams`). Remix **action** suites also copy the route module here and assign `context.stubModule.loader` so the action describe does not run the real loader (`enforce-maddox-loader-action-separation`).
3. **Middle helpers** — One `context.setup…` per outbound mock / assertion pattern as required by `enforce-maddox-middle-setup-cardinality` (pairs with `shouldBeCalledWith` in Scenario chains).
4. **`context.setupResponse`** — Expected successful return shape from the entry point (last among the “big three”).

Rules: `enforce-maddox-before-each-setup-order`, `enforce-maddox-middle-setup-cardinality`, `enforce-maddox-setup-params-array`.

## Params must be arrays

Inside setup lambdas, any assignment to **`context.somethingParams`** must use an **array** literal (`enforce-maddox-setup-params-array`).

## Middle setup content

Between `setupInputParams` and `setupResponse`, **middle** helpers should not assign **`context.inputParams`** or **`context.expected…Response/Result/Error`** unless the helper name includes **`Args`** (convention for loader-arg overrides) — `enforce-maddox-before-each-middle-setup-content` (warning).

## Per-test overrides inside `it`

Reassign `context.setupFoo = () => { … }` **before** the first `context.setupFoo()` call in that `it` (`enforce-maddox-it-setup-override-order`).

## Do not

- Disable these rules to keep a legacy “one giant beforeEach” structure — split inner describes and helpers instead.
- Stuff unrelated assertions between setup calls and `new Scenario` in the same `it` — keep `it` blocks declarative (`enforce-maddox-boilerplate`).
- Pair middle helpers with `shouldBeCalledWithSubset` — that API is banned (`enforce-no-maddox-should-be-called-with-subset`). Use `.shouldBeCalledWith` only.
