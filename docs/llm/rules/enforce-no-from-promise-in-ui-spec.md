# enforce-no-from-promise-in-ui-spec

## Rule id

`steps-pattern/enforce-no-from-promise-in-ui-spec`

## Intent (from ESLint rule)

Forbid `FromPromiseScenario` in UI route specs. Use `RemixScenario` / `FrameworkRouteScenario` instead (`enforce-remix-scenario-for-ui-route-tests`).

## When this rule applies

Remix `maddoxSpecs({ remix: true })`.

## Correct fix (checklist)

1. Replace `FromPromiseScenario` with `Maddox.scenarios.FrameworkRouteScenario`.
2. Drive the route with stubs + `.render()` + `.next()`, not `withEntryPoint(Route, "loader")` as the only surface.

## Do not

- Do not add `eslint-disable` to keep FromPromise in a UI route spec.

## Related docs

`.cursor/rules/steps-pattern/maddox-route-scenario-tests.mdc`
