# enforce-remix-scenario-for-ui-route-tests

## Rule id

`steps-pattern/enforce-remix-scenario-for-ui-route-tests`

## Intent (from ESLint rule)

Enforce RemixScenario (`Maddox.scenarios.FrameworkRouteScenario`) for UI route tests in `.spec.jsx` files.

## When this rule applies

Remix `maddoxSpecs({ remix: true })`.

## Correct fix (checklist)

1. Use `RemixScenario` / `FrameworkRouteScenario`, not `FromPromiseScenario`, in UI route `.spec.jsx` files (`enforce-no-from-promise-in-ui-spec` is the sibling ban).
2. Call `.render()` before `.next()` (product convention; see the route Maddox rule).

## Do not

- Do not add `eslint-disable` to keep FromPromise in a UI route spec.

## Related docs

`.cursor/rules/steps-pattern/maddox-route-scenario-tests.mdc`
