# enforce-maddox-before-each-setup-order

## Rule id

`steps-pattern/enforce-maddox-before-each-setup-order`

## Intent (from ESLint rule)

For **Maddox Scenario** specs only (`FromPromiseScenario`, `RemixScenario`, `FrameworkRouteScenario`, `ReactRouterFrameworkScenario`, or `new Scenario(...)`), require `setupValues`, `setupInputParams`, and `setupResponse` in `beforeEach` (or a delegated factory), in canonical order. See `.cursor/rules/maddox-scenario-tests.mdc`.

Specs that import Maddox only for `Maddox.compare` (component / unit RTL tests) are **out of scope** and are not reported.

## When this rule applies

Enabled on Maddox spec globs via `maddoxSpecs()`. The rule no-ops unless the file constructs a Scenario class.

## Correct fix (checklist)

1. Confirm the file uses a Scenario (`new Scenario` / `RemixScenario` / …). If it only uses `Maddox.compare`, no change is required.
2. In each Scenario suite `beforeEach`, declare helpers in order: `setupValues` → `setupInputParams` → middle mock helpers → `setupResponse`.
3. Do not silence the rule with `eslint-disable`; fix the setup contract.

## What good looks like

Canonical FromPromise / RemixScenario specs under `spec/` with the three required helpers in order.

## Do not

- Do not add `eslint-disable` to silence this rule.
- Do not force `setupInputParams` / `setupResponse` onto compare-only component specs — those files should stay Scenario-free.

## Related docs

`.cursor/rules/maddox-scenario-tests.mdc` and `docs/llm/framework/maddox-before-each.md`.
