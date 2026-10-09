# enforce-no-service-entry-point-in-maddox-spec

## Rule id

`steps-pattern/enforce-no-service-entry-point-in-maddox-spec`

## Intent (from ESLint rule)

Maddox scenario tests must not use a Service class as their entry point when a Controller or Route exists above it. Scenarios should target Controllers/Routes or Modules instead. Exception: `spec/services/` and `spec/generated/services/` (package has no controller/route — Service is the ingress).

## When this rule applies

This rule is enabled for spec files where Maddox scenario tests are executed, specifically:
- `sync` spec files (`**/spec/**/*.spec.js`)
- `ui` spec files (`**/spec/**/*.spec.{js,jsx}`)

## Correct fix (checklist)

1. Identify where `withEntryPoint` is called using a Service.
2. Refactor the test suite to target the appropriate **Controller**, **Route**, or **Module** that wraps/triggers the Service.
3. If the package has no Controller or Route (Service is the ingress), put the spec under `spec/services/` so this rule does not apply.

## What good looks like

```javascript
import { PartnerSyncController } from "../../src/controllers/partner-sync-controller.js";

new FromPromiseScenario(this)
  .mockThisFunction("PartnerSyncService", "loadAllPublicAndPrivateData", PartnerSyncService)
  .withEntryPoint(PartnerSyncController, "loadAllPublicAndPrivateData")
  .withInputParams(context.inputParams)
  // ...
```

## Do not

- Do not use a Service class (e.g. classes matching paths in `src/services/` or `app/server/services/`) directly in `withEntryPoint` from a controller, route, or module spec.
- Do not bypass this with `eslint-disable` comments. Service-as-ingress specs belong under `spec/services/`.

## Related docs

- `.cursor/rules/maddox-scenario-tests.mdc`
