# enforce-no-maddox-compare-outside-scenario

## Rule id

`steps-pattern/enforce-no-maddox-compare-outside-scenario`

## Intent (from ESLint rule)

If a spec does not construct a Maddox Scenario (`FromPromiseScenario` / `RemixScenario` / `FrameworkRouteScenario` / `ReactRouterFrameworkScenario` / `new Scenario`), it must not use `Maddox.compare` — use Vitest `expect` (and Testing Library matchers) instead.

## When this rule applies

Spec files under the Maddox specs ESLint preset.

## What triggers

Any `Maddox.compare.*` MemberExpression when the Program has no Scenario `NewExpression`.

## What this rule does not enforce

- Scenario suites may continue using `Maddox.compare`
- Non-spec files

## Correct fix (checklist)

1. Replace `Maddox.compare.equal(a, b)` with `expect(a).toEqual(b)` (or `.toBe`).
2. Replace `Maddox.compare.truthy(x)` with `expect(x).toBeTruthy()`.
3. Drop the unused `Maddox` import when no Scenario remains.

## What good looks like

```js
import { expect } from "vitest";

expect(link).toHaveAttribute("href", context.defaultUrl);
expect(screen.getByText(context.defaultLabel)).toBeTruthy();
```

## Do not

```js
import Maddox from "maddox";
// no Scenario in file
Maddox.compare.equal(link.getAttribute("href"), context.defaultUrl);
```

## Related docs

- `docs/llm/lint-fixes/enforce-no-maddox-compare-outside-scenario/`
